import { hasVariants } from './variants.js?v=sale-price-policy-20261109';
import { orderedVariants } from './product-content.js?v=catalog-sku-audit-20261110';

function catalogImage(path, previousImages, alt) {
  const imagePath = value => {
    try { return new URL(value, 'https://catmandog.es').pathname.replace(/\.(?:png|jpe?g|webp)$/iu, ''); }
    catch { return null; }
  };
  const previous = previousImages.find(image => image?.src && imagePath(image.src) === imagePath(path));
  const studioAsset = /\/(?:assets\/(?:launch-studio-[^/]+|[^/]+\/editorial)|media\/(?:launch-studio|churu-formats)-[^/]+|media\/yagu)\//u.test(path);
  return { ...(previous || {}), src: path, alt,
    presentation: studioAsset ? 'editorial' : previous?.presentation };
}

export function applyServerPrices(products, entries) {
  if (!Array.isArray(entries)) return 0;
  const byId = new Map(entries.map(entry => [entry.variant_id, entry]));
  let applied = 0;
  for (const product of products) {
    const variants = hasVariants(product) ? product.variants : [product];
    for (const sku of variants) {
      const row = byId.get(sku.id);
      if (!row || row.product_id !== product.id || row.price_confirmed !== true ||
          !Number.isInteger(row.priceCents) || row.priceCents <= 0) continue;
      sku.price = row.priceCents / 100;
      sku.priceStatus = 'confirmed';
      sku.serverPriceConfirmed = true;
      if (row.availableForCart === false || !row.source_orderable || row.availability === 'unavailable' ||
          (row.availability === 'on_hand' && row.stock_quantity === 0))
        sku.availabilityStatus = 'unavailable';
      else sku.availabilityStatus = row.availability;
      applied += 1;
    }
  }
  return applied;
}

// Replace the browser's boot catalog with the active database assortment in place.
// Other UI modules keep references to these arrays, so reassigning them would leave stale data.
export function applyServerCatalog(products, catalogProducts, entries) {
  if (!Array.isArray(entries)) return false;
  const current = new Map(products.map(product => [product.id, product]));
  const grouped = new Map();
  for (const row of entries) {
    if (!row?.product_id || !row.variant_id) continue;
    if (!grouped.has(row.product_id)) grouped.set(row.product_id, []);
    grouped.get(row.product_id).push(row);
  }
  const next = [];
  for (const [id, rows] of grouped) {
    const first = rows[0];
    const original = current.get(id);
    const product = original || { id, isReal: true, tag: '', line: first.brand || 'CatManDog',
      optionLabel: 'Вариант', defaultVariantId: first.variant_id, variants: [] };
    const previousProductImage = product.image;
    const previousVariantImages = new Map((Array.isArray(product.variants) ? product.variants : [])
      .map(variant => [variant.id, variant.image]));
    product.name = first.name;
    product.brand = first.brand || '';
    product.category = first.category;
    product.pet = first.pet;
    product.foodType = first.food_type || undefined;
    if (product.category === 'Корм' && rows.length > 1) product.optionLabel = 'Фасовка';
    product.description = first.description || '';
    product.details = Array.isArray(first.details) ? first.details : [];
    product.displayPriority = Math.max(...rows.map(row => Number(row.display_priority) || 0));
    if (first.image_path) product.image = catalogImage(first.image_path, [previousProductImage], first.name);
    const existing = new Map((Array.isArray(product.variants) ? product.variants : []).map(variant => [variant.id, variant]));
    const variants = rows.map(row => {
      const sku = existing.get(row.variant_id) || (row.variant_id === product.id ? product : {
        id: row.variant_id, name: product.name, brand: product.brand, category: product.category,
        pet: product.pet, image: product.image, description: product.description,
        details: product.details, isReal: true });
      sku.label = row.label;
      const packageWeightKg = Number(row.package_weight_kg);
      if (packageWeightKg > 0) sku.packageWeightKg = packageWeightKg;
      sku.name = product.name;
      sku.brand = product.brand;
      sku.category = product.category;
      sku.pet = product.pet;
      sku.image = row.variant_image_path
        ? catalogImage(row.variant_image_path,
          [previousVariantImages.get(row.variant_id), previousProductImage], product.name)
        : product.image;
      sku.description = row.variant_description || product.description;
      sku.details = Array.isArray(row.variant_details) && row.variant_details.length
        ? row.variant_details : product.details;
      // Keep the stock record separate from checkout eligibility. An unconfirmed
      // price can block checkout without turning supplier stock into "sold out".
      sku.serverAvailabilityStatus = row.availability;
      sku.saleStatus = row.saleStatus || row.sale_status || null;
      sku.serverSourcingAvailability = row.sourcingAvailability || null;
      sku.serverSourceOrderable = row.source_orderable === true;
      sku.serverAvailableForCart = row.availableForCart === true;
      sku.availabilityStatus = sku.serverSourcingAvailability ||
        (row.availability === 'pending' && row.price_confirmed !== true
          ? 'pending' : row.availableForCart === false || row.source_orderable === false ||
          row.availability === 'unavailable' ||
          (row.availability === 'on_hand' && row.stock_quantity <= 0)
          ? 'unavailable' : row.availability);
      sku.serverPriceConfirmed = row.price_accepted === true ||
        (row.price_accepted === undefined && row.price_confirmed === true);
      if (sku.serverPriceConfirmed && Number.isInteger(row.priceCents) && row.priceCents > 0) {
        sku.price = row.priceCents / 100;
        sku.priceStatus = 'confirmed';
      } else if (Number.isInteger(row.referencePriceCents) && row.referencePriceCents > 0) {
        sku.price = row.referencePriceCents / 100;
        sku.priceStatus = 'temporary';
      } else if (Number.isFinite(sku.price) && sku.price > 0 &&
          ['confirmed', 'temporary'].includes(sku.priceStatus)) {
        // A documented retail price remains visible even if checkout is blocked.
      } else {
        sku.price = null;
        sku.priceStatus = 'pending';
      }
      return sku;
    });
    if (!original || Array.isArray(original.variants) || rows.length > 1) {
      product.variants = variants;
      if (product.category === 'Корм' && variants.length > 1)
        product.defaultVariantId = orderedVariants(product)[0].id;
      else if (product.displayPriority > 0 || !variants.some(variant => variant.id === product.defaultVariantId))
        product.defaultVariantId = variants[0].id;
    }
    next.push(product);
  }
  const order = new Map(products.map((product, index) => [product.id, index]));
  next.push(...products.filter(product => product.gift || product.catalogHidden));
  next.sort((a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity));
  products.splice(0, products.length, ...next);
  catalogProducts.splice(0, catalogProducts.length, ...next.filter(product => !product.catalogHidden)
    .sort((a, b) => (b.displayPriority || 0) - (a.displayPriority || 0)));
  return true;
}
