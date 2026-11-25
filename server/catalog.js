import { randomUUID } from 'node:crypto';
import { products } from '../data.js';
import { retiredProductIds } from '../catalog-policy.js';
import { snapshots, confirmedPrice, canBuy } from '../variants.js';
import { yaguRetailBenchmarks } from '../yagu-retail-benchmarks.js';
import { supplierSourcingByVariant } from './sourcing-status.js';
import { launchSelectedImageMap } from '../launch-selected-image-map.js';
import { selectedAcanaOrijenFormats } from '../acana-orijen-selected-formats.js';
import { salePriceDecision } from './sale-price-policy.js';
import { catalogEditorialContent } from '../catalog-editorial-content.js';
import { catalogEditorialCats } from '../catalog-editorial-cats.js';
import { catalogEditorialDogs } from '../catalog-editorial-dogs.js';
import { catalogEditorialRoyalCanin } from '../catalog-editorial-royal-canin.js';
import { catalogEditorialLeonardo } from '../catalog-editorial-leonardo.js';
import { catalogEditorialHeld } from '../catalog-editorial-held.js';
import { catalogEditorialChuruDog } from '../catalog-editorial-churu-dog.js';
import { catalogEditorialAcanaWet } from '../catalog-editorial-acana-wet.js';
import { catalogEditorialChuruCat } from '../catalog-editorial-churu-cat.js';
import { catalogEditorialNext } from '../catalog-editorial-next.js';
import { catalogEditorialOpenAudit } from '../catalog-editorial-open-audit.js';
import { catalogEditorialRoyalCaninNext } from '../catalog-editorial-royal-canin-next.js';
import { catalogEditorialRoyalCaninWave3 } from '../catalog-editorial-royal-canin-wave3.js';
import { publishYaguToys } from './yagu-toy-publication.js';
import { catsAtelierLegacyCopy, catsAtelierProducts } from '../cats-atelier-products.js';
import { seedInitialSalesLedger } from './initial-sales-ledger.js';

const cents = value => Number.isFinite(value) && value > 0 ? Math.round(value * 100) : null;
const imagePath = image => typeof image === 'string' ? image : image?.src || null;

export async function publishSelectedLaunchImages(client) {
  const { rows } = await client.query("SELECT name FROM catalog_migrations WHERE name='launch_selected_images_2026_11_05'");
  if (rows.length) return 0;
  let matchedProducts = 0;
  let matchedVariants = 0;
  for (const product of launchSelectedImageMap) {
    const updated = await client.query(`UPDATE catalog_products
      SET image_path=coalesce(nullif(image_path,''),$2),active=true,
        source=source-'catalogHidden'
      WHERE id=$1 RETURNING id`, [product.id, product.imagePath]);
    matchedProducts += updated.rowCount || 0;
    for (const variant of product.variants) {
      const result = await client.query(`UPDATE catalog_variants
        SET image_path=coalesce(nullif(image_path,''),$2),
          availability=CASE WHEN availability='unavailable' AND $4 THEN 'source_on_demand'
            ELSE availability END
        WHERE id=$1 AND product_id=$3`, [variant.id, variant.imagePath, product.id,
        variant.supplierCode !== '949577']);
      matchedVariants += result.rowCount || 0;
    }
  }
  if (matchedProducts === launchSelectedImageMap.length &&
      matchedVariants === launchSelectedImageMap.reduce((count, product) => count + product.variants.length, 0)) {
    await client.query("INSERT INTO catalog_migrations(name) VALUES('launch_selected_images_2026_11_05')");
  }
  return matchedProducts;
}

export function catalogRows(items = products) {
  return items.filter(product => !product.gift && !product.catalogHidden)
    .flatMap(product => snapshots(product).map(variant => ({
    product: {
      id: product.id, name: product.name, brand: product.brand || null,
      category: product.category || null, pet: product.pet || null,
      imagePath: imagePath(product.image), description: product.description || '',
      details: Array.isArray(product.details) ? product.details : [],
      foodType: product.foodType || null, source: product
    },
    variant: {
      id: variant === product ? product.id : variant.id,
      productId: product.id,
      label: variant.label || variant.weight || product.weight || '1 шт',
      imagePath: imagePath(variant.image) !== imagePath(product.image) ? imagePath(variant.image) : null,
      description: variant.description || product.description || '',
      details: Array.isArray(variant.details) ? variant.details :
        Array.isArray(product.details) ? product.details : [],
      sourcePriceCents: cents(confirmedPrice(variant)),
      sourceOrderable: canBuy(variant),
      source: variant
    }
  })));
}

export async function importCatalog(db, items = products) {
  const rows = catalogRows(items);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(1043319)');
    for (const { product, variant } of rows) {
      await client.query(`INSERT INTO catalog_products(id,name,brand,category,pet,image_path,description,details,food_type,source,imported_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now()) ON CONFLICT(id) DO NOTHING`,
      [product.id, product.name, product.brand, product.category, product.pet, product.imagePath,
        product.description, JSON.stringify(product.details), product.foodType, product.source]);
      await client.query(`INSERT INTO catalog_variants(id,product_id,label,image_path,description,details,
        source_price_cents,source_orderable,availability,sale_status,source,imported_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now()) ON CONFLICT(id) DO NOTHING`,
      [variant.id, variant.productId, variant.label, variant.imagePath, variant.description,
        JSON.stringify(variant.details), variant.sourcePriceCents,variant.sourceOrderable,
        variant.source.availabilityStatus === 'pending' ? 'pending' :
          variant.sourceOrderable ? 'source_on_demand' : 'unavailable',
        variant.source.saleStatus === 'unavailable' ? 'unavailable' :
          variant.source.saleStatus === 'available' ? 'available' :
          /^(?:heybo pet|heiba pet|heybopet)$/i.test(product.brand || '') ? 'preorder' :
          /^(?:advance|hill[’']s)$/i.test(product.brand || '') ? 'unavailable' : 'available',
        variant.source]);
      // A confirmed B2B purchase quote belongs in its own column. Existing owner
      // edits take precedence, and the customer price is never used as a fallback.
      if (variant.source.purchasePriceStatus === 'confirmed' &&
          variant.source.purchasePriceTaxIncluded === false &&
          cents(variant.source.purchasePrice)) {
        await client.query(`UPDATE catalog_variants SET purchase_price_cents=$2
          WHERE id=$1 AND purchase_price_cents IS NULL`,
        [variant.id, cents(variant.source.purchasePrice)]);
      }
      // A historical quote is evidence, not a currently orderable purchase cost.
      if (variant.source.purchaseQuote) {
        await client.query(`UPDATE catalog_variants
          SET source=jsonb_set(source,'{purchaseQuote}',$2::jsonb,true),updated_at=now()
          WHERE id=$1 AND source->'purchaseQuote' IS DISTINCT FROM $2::jsonb`,
        [variant.id, JSON.stringify(variant.source.purchaseQuote)]);
      }
      // Existing launch variants may have been imported before retail research was completed.
      // Fill only empty reference prices; never replace an owner-approved or edited price.
      if (Object.hasOwn(yaguRetailBenchmarks, variant.source.supplier?.sku) && variant.sourcePriceCents) {
        await client.query(`UPDATE catalog_variants SET source_price_cents=$2
          WHERE id=$1 AND source_price_cents IS NULL AND price_override_cents IS NULL
            AND price_confirmed=false`, [variant.id, variant.sourcePriceCents]);
      }
    }
    if (items === products) {
      const supplierPhotoMigration = 'atelier_supplier_main_images_2026_11_25';
      const applied = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1', [supplierPhotoMigration]);
      if (!applied.rows.length) {
        for (const card of catsAtelierProducts) {
          const previous = card.gallery[0].src;
          const current = card.image.src;
          const source = JSON.stringify({ image: card.image, gallery: card.gallery });
          const changed = await client.query(`UPDATE catalog_products SET image_path=$2,
            source=CASE WHEN source->'image'->>'src'=$3
              THEN source || $4::jsonb ELSE source END
            WHERE id=$1 AND image_path=$3`, [card.id, current, previous, source]);
          if (changed.rowCount) await client.query(`UPDATE catalog_variants SET
            image_path=CASE WHEN image_path=$3 THEN $2 ELSE image_path END,
            source=CASE WHEN source->'image'->>'src'=$3
              THEN source || $4::jsonb ELSE source END,updated_at=now()
            WHERE product_id=$1 AND (image_path=$3 OR source->'image'->>'src'=$3)`,
          [card.id, current, previous, source]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [supplierPhotoMigration]);
      }
    }
    if (items === products) {
      const litterPriceMigration = 'approved_litter_retail_prices_2026_11_21';
      const done = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1', [litterPriceMigration]);
      if (!done.rows.length) {
        for (const [id, priceCents] of [
          ['cat-litter-yommy-tofu-lavanda-6l-pack', 999],
          ['cat-litter-uniko-tofu-18l-pack', 1999],
          ['cat-litter-yommy-tofu-pl-6l-pack', 999],
          ['cat-litter-sanicat-clumping-unscented-8l-pack', 799]
        ]) {
          await client.query(`UPDATE catalog_variants SET price_confirmed=true,updated_at=now()
            WHERE id=$1 AND source_price_cents=$2 AND price_override_cents IS NULL
              AND price_confirmed=false`, [id, priceCents]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [litterPriceMigration]);
      }
    }
    if (items === products) {
      const litterPhotoMigration = 'litter_exact_photos_and_formats_2026_11_21';
      const done = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1', [litterPhotoMigration]);
      if (!done.rows.length) {
        const previousNames = new Map([
          ['cat-litter-yommy-tofu-lavanda-6l', 'Yommy Tofu Lavanda - комкующийся наполнитель 6 л'],
          ['cat-litter-uniko-tofu-18l', 'Uniko Tofu Cat Litter - комкующийся наполнитель 18 л'],
          ['cat-litter-sanicat-clumping-unscented-8l', 'Sanicat Clumping - комкующийся наполнитель без отдушки 8 л']
        ]);
        for (const source of products.filter(product => previousNames.has(product.id))) {
          await client.query(`UPDATE catalog_products SET
            name=$2,description=$3,details=$4::jsonb,image_path=$5,source=$6::jsonb
            WHERE id=$1 AND name=$7 AND image_path IS NULL`,
          [source.id, source.name, source.description, JSON.stringify(source.details),
            imagePath(source.image), JSON.stringify(source), previousNames.get(source.id)]);
          for (const variant of source.variants) {
            await client.query(`UPDATE catalog_variants SET
              label=$2,description=$3,details=$4::jsonb,image_path=$5,source=$6::jsonb,updated_at=now()
              WHERE id=$1 AND image_path IS NULL`,
            [variant.id, variant.label, variant.description, JSON.stringify(variant.details),
              imagePath(variant.image), JSON.stringify(variant)]);
          }
        }
        await client.query(`UPDATE catalog_products SET active=false
          WHERE id='cat-litter-yommy-tofu-pl-6l' AND image_path IS NULL`);
        await client.query(`UPDATE catalog_variants SET active=false,updated_at=now()
          WHERE product_id='cat-litter-yommy-tofu-pl-6l' AND stock_quantity=0`);
        for (const [id, priceCents] of [
          ['cat-litter-yommy-tofu-verde-6l-pack', 999],
          ['cat-litter-uniko-tofu-6l-pack', 999]
        ]) {
          await client.query(`UPDATE catalog_variants SET price_confirmed=true,updated_at=now()
            WHERE id=$1 AND source_price_cents=$2 AND price_override_cents IS NULL
              AND price_confirmed=false`, [id, priceCents]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [litterPhotoMigration]);
      }
    }
    if (items === products) {
      const litterStudioMigration = 'litter_studio_r2_images_2026_11_21';
      const done = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1', [litterStudioMigration]);
      if (!done.rows.length) {
        const base = 'https://img.catmandog.es/assets/litter-studio-2026-11-21/';
        for (const [id, file] of [
          ['cat-litter-yommy-tofu-lavanda-6l-pack', 'yommy-tofu-lavanda-6l'],
          ['cat-litter-yommy-tofu-verde-6l-pack', 'yommy-tofu-verde-6l'],
          ['cat-litter-uniko-tofu-6l-pack', 'uniko-tofu-6l'],
          ['cat-litter-uniko-tofu-18l-pack', 'uniko-tofu-18l'],
          ['cat-litter-sanicat-clumping-unscented-8l-pack', 'sanicat-clumping-8l']
        ]) {
          await client.query(`UPDATE catalog_variants SET image_path=$2,updated_at=now()
            WHERE id=$1 AND image_path=$3`,
          [id, `${base}${file}-studio-v1.webp`, `/media/litter-2026-11-21/${file}.webp`]);
        }
        for (const [id, file] of [
          ['cat-litter-yommy-tofu-lavanda-6l', 'yommy-tofu-lavanda-6l'],
          ['cat-litter-uniko-tofu-18l', 'uniko-tofu-18l'],
          ['cat-litter-sanicat-clumping-unscented-8l', 'sanicat-clumping-8l']
        ]) {
          await client.query(`UPDATE catalog_products SET image_path=$2
            WHERE id=$1 AND image_path=$3`,
          [id, `${base}${file}-studio-v1.webp`, `/media/litter-2026-11-21/${file}.webp`]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [litterStudioMigration]);
      }
    }
    if (items === products) {
      const litterStockMigration = 'litter_owner_confirmed_minimum_stock_2026_11_21';
      const done = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1', [litterStockMigration]);
      if (!done.rows.length) {
        // The owner confirmed physical stock and two Sanicat bags. Until the
        // invoice quantity is transcribed, expose only one of each other SKU.
        for (const [id, minimum] of [
          ['cat-litter-yommy-tofu-lavanda-6l-pack', 1],
          ['cat-litter-yommy-tofu-verde-6l-pack', 1],
          ['cat-litter-uniko-tofu-6l-pack', 1],
          ['cat-litter-uniko-tofu-18l-pack', 1],
          ['cat-litter-sanicat-clumping-unscented-8l-pack', 2]
        ]) {
          const { rows } = await client.query(`SELECT stock_quantity,reserved_quantity
            FROM catalog_variants WHERE id=$1 FOR UPDATE`, [id]);
          if (!rows.length) throw new Error(`Missing litter stock SKU ${id}`);
          const delta = Math.max(0, minimum - Number(rows[0].stock_quantity || 0));
          if (!delta) continue;
          const changed = await client.query(`UPDATE catalog_variants SET
            stock_quantity=coalesce(stock_quantity,0)+$2,availability='on_hand',updated_at=now()
            WHERE id=$1 RETURNING stock_quantity,reserved_quantity`, [id, delta]);
          await client.query(`INSERT INTO inventory_movements
            (id,variant_id,idempotency_key,reason,delta_on_hand,delta_reserved,
             on_hand_after,reserved_after,note)
            VALUES($1,$2,$3,'adjustment',$4,0,$5,$6,$7)`,
          [randomUUID(), id, `litter_owner_stock_2026_11_21_${id}`, delta,
            changed.rows[0].stock_quantity, changed.rows[0].reserved_quantity,
            'Owner confirmed stock from invoice and package photos; conservative minimum quantity']);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [litterStockMigration]);
      }
    }
    if (items === products) {
      const invoiceReconcileMigration = 'litter_invoice_stock_and_small_uniko_price_2026_11_21';
      const done = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1', [invoiceReconcileMigration]);
      if (!done.rows.length) {
        // Retail decision: the owner accepted 10.99 for the 6 L bag after comparing
        // the maker's 8.50 price and another retailer's 12.20 price.
        await client.query(`UPDATE catalog_variants SET
          source_price_cents=1099,price_confirmed=true,
          source=jsonb_set(source,'{price}','10.99'::jsonb,true),updated_at=now()
          WHERE id='cat-litter-uniko-tofu-6l-pack' AND source_price_cents=999
            AND price_override_cents IS NULL`);
        const targets = [
          ['cat-litter-yommy-tofu-lavanda-6l-pack', 2],
          ['cat-litter-yommy-tofu-verde-6l-pack', 2],
          ['cat-litter-uniko-tofu-6l-pack', 1],
          ['cat-litter-uniko-tofu-18l-pack', 2],
          ['cat-litter-sanicat-clumping-unscented-8l-pack', 1]
        ];
        for (const [id, target] of targets) {
          const { rows } = await client.query(`SELECT stock_quantity,reserved_quantity
            FROM catalog_variants WHERE id=$1 FOR UPDATE`, [id]);
          if (!rows.length) throw new Error(`Missing litter stock SKU ${id}`);
          const before = Number(rows[0].stock_quantity || 0);
          const delta = target - before;
          if (!delta) continue;
          if (target < Number(rows[0].reserved_quantity || 0))
            throw new Error(`Reserved litter exceeds invoice count ${id}`);
          const changed = await client.query(`UPDATE catalog_variants SET
            stock_quantity=$2,availability='on_hand',updated_at=now()
            WHERE id=$1 RETURNING stock_quantity,reserved_quantity`, [id, target]);
          await client.query(`INSERT INTO inventory_movements
            (id,variant_id,idempotency_key,reason,delta_on_hand,delta_reserved,
             on_hand_after,reserved_after,note)
            VALUES($1,$2,$3,'adjustment',$4,0,$5,$6,$7)`,
          [randomUUID(), id, `litter_invoice_reconcile_2026_11_21_${id}`, delta,
            changed.rows[0].stock_quantity, changed.rows[0].reserved_quantity,
            'Owner invoice count: four Yommy, two Uniko 18 L, one Uniko 6 L, one Sanicat; Yommy split assumed 2+2']);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [invoiceReconcileMigration]);
      }
    }
    if (items === products) {
      const finalLitterCountMigration = 'litter_invoice_two_each_2026_11_21';
      const done = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1', [finalLitterCountMigration]);
      if (!done.rows.length) {
        for (const id of ['cat-litter-uniko-tofu-6l-pack',
          'cat-litter-sanicat-clumping-unscented-8l-pack']) {
          const { rows } = await client.query(`SELECT stock_quantity,reserved_quantity
            FROM catalog_variants WHERE id=$1 FOR UPDATE`, [id]);
          if (!rows.length) throw new Error(`Missing litter stock SKU ${id}`);
          const delta = Math.max(0, 2 - Number(rows[0].stock_quantity || 0));
          if (!delta) continue;
          const changed = await client.query(`UPDATE catalog_variants SET
            stock_quantity=coalesce(stock_quantity,0)+$2,availability='on_hand',updated_at=now()
            WHERE id=$1 RETURNING stock_quantity,reserved_quantity`, [id, delta]);
          await client.query(`INSERT INTO inventory_movements
            (id,variant_id,idempotency_key,reason,delta_on_hand,delta_reserved,
             on_hand_after,reserved_after,note)
            VALUES($1,$2,$3,'adjustment',$4,0,$5,$6,$7)`,
          [randomUUID(), id, `litter_two_each_2026_11_21_${id}`, delta,
            changed.rows[0].stock_quantity, changed.rows[0].reserved_quantity,
            'Owner corrected invoice count: two units of each of the five litter variants']);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [finalLitterCountMigration]);
      }
    }
    if (items === products) await publishYaguToys(client);
    if (items === products) {
      const localMigration = await client.query("SELECT name FROM catalog_migrations WHERE name='local_only_products_archived'");
      if (!localMigration.rows.length) {
        await client.query('UPDATE catalog_products SET active=false WHERE id = ANY($1::text[])',
          [products.filter(product => product.gift || product.catalogHidden).map(product => product.id)]);
        await client.query("INSERT INTO catalog_migrations(name) VALUES('local_only_products_archived')");
      }
      const editorMigration = await client.query("SELECT name FROM catalog_migrations WHERE name='product_editor_fields_backfilled'");
      if (!editorMigration.rows.length) {
        await client.query(`UPDATE catalog_products SET description=coalesce(source->>'description',''),
          details=CASE WHEN jsonb_typeof(source->'details')='array' THEN source->'details' ELSE '[]'::jsonb END,
          food_type=nullif(source->>'foodType','')`);
        await client.query("INSERT INTO catalog_migrations(name) VALUES('product_editor_fields_backfilled')");
      }
      const variantMigration = await client.query("SELECT name FROM catalog_migrations WHERE name='variant_editor_fields_backfilled'");
      if (!variantMigration.rows.length) {
        await client.query(`UPDATE catalog_variants v SET description=coalesce(v.source->>'description',p.description),
          details=CASE WHEN jsonb_typeof(v.source->'details')='array' THEN v.source->'details'
            ELSE p.details END,
          image_path=CASE WHEN jsonb_typeof(v.source->'image')='string' AND
            v.source->>'image' IS DISTINCT FROM p.image_path THEN v.source->>'image'
            WHEN jsonb_typeof(v.source->'image')='object' AND
            v.source->'image'->>'src' IS DISTINCT FROM p.image_path
            THEN v.source->'image'->>'src' ELSE NULL END
          FROM catalog_products p WHERE p.id=v.product_id`);
        await client.query("INSERT INTO catalog_migrations(name) VALUES('variant_editor_fields_backfilled')");
      }
      const atelierCopyMigration = 'cats_atelier_editorial_copy_2026_11_21';
      const atelierCopyDone = await client.query(
        'SELECT 1 FROM catalog_migrations WHERE name=$1', [atelierCopyMigration]);
      if (!atelierCopyDone.rowCount && !atelierCopyDone.rows.length) {
        for (const product of products.filter(item => item.brand === 'Cat’s Atelier')) {
          const legacy = catsAtelierLegacyCopy.get(product.id);
          if (!legacy) continue;
          // Replace only the exact earlier generated copy. Owner edits win.
          const updated = await client.query(`UPDATE catalog_products SET
            name=$2,description=$3,
            source=coalesce(source,'{}'::jsonb)||jsonb_build_object('name',$2::text,'description',$3::text)
            WHERE id=$1 AND name=$4 AND description=$5 RETURNING id`,
          [product.id, product.name, product.description, legacy.name, legacy.description]);
          if (!updated.rowCount && !updated.rows.length) continue;
          await client.query(`UPDATE catalog_variants SET description=$2,
            source=coalesce(source,'{}'::jsonb)||jsonb_build_object('name',$3::text,'description',$2::text),
            updated_at=now()
            WHERE product_id=$1 AND description=$4`,
          [product.id, product.description, product.name, legacy.description]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [atelierCopyMigration]);
      }
      const migration = await client.query("SELECT name FROM catalog_migrations WHERE name='retired_products_archived'");
      if (!migration.rows.length) {
        await client.query('UPDATE catalog_products SET active=false WHERE id = ANY($1::text[])',
          [[...retiredProductIds]]);
        await client.query("INSERT INTO catalog_migrations(name) VALUES('retired_products_archived')");
      }
      await publishSelectedLaunchImages(client);
      // Publish the three exact formats requested after confirmed customer demand.
      // Store retail and purchase amounts in different columns. The veterinary
      // item has no purchase offer; the ACANA 11.4 kg benchmark is below
      // undiscounted landed cost and is corrected by a later migration.
      const demandMigration = 'confirmed_demand_formats_2026_11_08';
      const demandDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1', [demandMigration]);
      if (!demandDone.rowCount) {
        for (const [id, retailCents, purchaseCents, saleStatus, availability] of [
          ['royal-canin-chihuahua-adult-3kg', 2969, 2055, 'available', 'source_on_demand'],
          ['royal-canin-gastrointestinal-kitten-dry-2kg', 3669, null, 'unavailable', 'unavailable'],
          ['acana-grass-fed-lamb-11-4kg', 8949, 8122, 'unavailable', 'pending']
        ]) {
          await client.query(`UPDATE catalog_variants SET
            price_override_cents=coalesce(price_override_cents,$2),
            purchase_price_cents=coalesce(purchase_price_cents,$3),
            price_confirmed=true,sale_status=$4,availability=$5,
            tax_rate_bps=coalesce(tax_rate_bps,1000),updated_at=now()
            WHERE id=$1`, [id, retailCents, purchaseCents, saleStatus, availability]);
        }
        await client.query(`UPDATE catalog_products SET
          image_path='/media/confirmed-demand-2026-11-08/acana-grass-fed-lamb-11-4kg.webp',
          description=CASE WHEN description='' THEN
            'Сухой корм ACANA Grass-Fed Lamb с ягнёнком для собак' ELSE description END,
          source=source||jsonb_build_object('defaultVariantId','acana-grass-fed-lamb-11-4kg')
          WHERE id='cmd-source-0f4a3ef9889b8ff3'`);
        await client.query(`UPDATE catalog_variants SET display_priority=1
          WHERE id='acana-grass-fed-lamb-11-4kg'`);
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [demandMigration]);
      }
      // The supplier catalogs may already have been imported before these
      // storefront variants existed. Match only the exact supplier article.
      for (const [variantId, brand, article] of [
        ['royal-canin-chihuahua-adult-3kg', 'Royal Canin', '2210400'],
        ['acana-grass-fed-lamb-11-4kg', 'ACANA', 'ACS203']
      ]) {
        await client.query(`INSERT INTO supplier_catalog_matches
          (item_id,source_id,variant_id,match_method)
          SELECT i.id,i.source_id,$1,'catalog'
          FROM supplier_catalog_items i JOIN supplier_catalog_sources s ON s.id=i.source_id
          WHERE s.brand=$2 AND i.article=$3
          ORDER BY s.price_date DESC,s.imported_at DESC LIMIT 1
          ON CONFLICT DO NOTHING`, [variantId, brand, article]);
      }
      // The 11 exact package sizes from the revised paid and bonus baskets.
      // Keep the B2B tariff (ex IVA) separate from the customer retail price.
      const selectedFormatsMigration = 'acana_orijen_selected_formats_2026_11_09';
      const selectedFormatsDone = await client.query(
        'SELECT 1 FROM catalog_migrations WHERE name=$1', [selectedFormatsMigration]);
      if (!selectedFormatsDone.rowCount) {
        for (const item of selectedAcanaOrijenFormats) {
          await client.query(`UPDATE catalog_products SET active=true WHERE id=$1`, [item.productId]);
          await client.query(`UPDATE catalog_variants SET
            source_price_cents=CASE WHEN price_override_cents IS NULL
              THEN $2 ELSE source_price_cents END,
            purchase_price_cents=coalesce(purchase_price_cents,$3),
            tax_rate_bps=coalesce(tax_rate_bps,1000),
            image_path=$4,
            source_orderable=true,availability='source_on_demand',sale_status='available',
            display_priority=greatest(display_priority,1),updated_at=now()
            WHERE id=$1`, [item.id, Math.round(item.retail * 100),
            Math.round(item.tariff * 100),
            `/media/acana-orijen-selected-2026-11-09/${item.image}`]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)',
          [selectedFormatsMigration]);
      }
      // An earlier catalogue load wrote a uniform 20% markup as confirmed
      // overrides. Replace only those exact formula values with the researched
      // retail price; preserve any distinct owner-edited amount.
      const retailReconcileMigration = 'selected_retail_reconcile_2026_11_09';
      const retailReconcileDone = await client.query(
        'SELECT 1 FROM catalog_migrations WHERE name=$1', [retailReconcileMigration]);
      if (!retailReconcileDone.rowCount) {
        const previousAutoCents = new Map([
          ['acana-adult-dog-11-4kg', 8484],
          ['acana-puppy-11-4kg', 8488],
          ['acana-dog-red-meat-11-4kg', 8220],
          ['acana-light-fit-6kg', 5095],
          ['dog-orijen-original-11-4kg', 10847],
          ['acana-classics-red-meat-9-7kg', 6955],
          ['acana-classics-wild-coast-9-7kg', 7132],
          ['acana-puppy-small-breed-6kg', 5095],
          ['acana-wild-prairie-6kg', 5979],
          ['orijen-regional-red-6kg', 8708],
          ['acana-senior-6kg', 5095]
        ]);
        for (const item of selectedAcanaOrijenFormats) {
          await client.query(`UPDATE catalog_variants SET
            source_price_cents=$2,price_override_cents=NULL,
            price_confirmed=false,updated_at=now()
            WHERE id=$1 AND price_override_cents=$3`,
          [item.id, Math.round(item.retail * 100), previousAutoCents.get(item.id)]);
        }
        await client.query(`UPDATE catalog_variants SET
          source_price_cents=9299,price_override_cents=NULL,
          price_confirmed=false,source_orderable=true,
          availability='source_on_demand',sale_status='available',updated_at=now()
          WHERE id='acana-grass-fed-lamb-11-4kg'
            AND price_override_cents=10858`);
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)',
          [retailReconcileMigration]);
      }
      await client.query(`UPDATE catalog_products SET
        image_path='/media/acana-orijen-selected-2026-11-09/orijen-original-dog-11-4kg.webp',
        source=jsonb_set(source,'{defaultVariantId}',to_jsonb($1::text),true)
        WHERE id='dog-orijen-original'
          AND (source->>'defaultVariantId') IS DISTINCT FROM $1`,
      ['dog-orijen-original-11-4kg']);
      // Supplier sheets may be imported after the storefront catalogue.
      // Recheck exact articles on every import so those later sources link too.
      for (const item of selectedAcanaOrijenFormats) {
        await client.query(`INSERT INTO supplier_catalog_matches
          (item_id,source_id,variant_id,match_method)
          SELECT i.id,i.source_id,$1,'catalog'
          FROM supplier_catalog_items i JOIN supplier_catalog_sources s ON s.id=i.source_id
          WHERE lower(s.brand)=lower($2) AND i.article=$3 AND i.shop_price_cents>0
          ORDER BY s.price_date DESC,s.imported_at DESC LIMIT 1
          ON CONFLICT DO NOTHING`, [item.id, item.brand, item.article]);
      }
      // This demand SKU was blocked because its old 89.49 EUR retail benchmark
      // was below the 90.48 EUR undiscounted landed purchase cost. Publish it at
      // a documented cost floor while preserving the supplier tariff separately.
      const lambFloorMigration = 'acana_lamb_cost_floor_2026_11_09';
      const lambFloorDone = await client.query(
        'SELECT 1 FROM catalog_migrations WHERE name=$1', [lambFloorMigration]);
      if (!lambFloorDone.rowCount) {
        await client.query(`UPDATE catalog_variants SET
          source_price_cents=9299,price_override_cents=NULL,price_confirmed=false,
          purchase_price_cents=coalesce(purchase_price_cents,8122),
          tax_rate_bps=coalesce(tax_rate_bps,1000),
          source_orderable=true,availability='source_on_demand',sale_status='available',updated_at=now()
          WHERE id='acana-grass-fed-lamb-11-4kg'
            AND (price_override_cents IS NULL OR price_override_cents IN (8949,10858))`);
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)',
          [lambFloorMigration]);
      }
      const gastroFallbackMigration = 'gastro_kitten_retail_fallback_2026_11_09';
      const gastroFallbackDone = await client.query(
        'SELECT 1 FROM catalog_migrations WHERE name=$1', [gastroFallbackMigration]);
      if (!gastroFallbackDone.rowCount) {
        const gastro = products.find(product =>
          product.id === 'royal-canin-gastrointestinal-kitten-dry')?.variants?.[0];
        if (gastro) {
          await client.query(`UPDATE catalog_variants SET
            source_price_cents=3669,
            price_override_cents=CASE WHEN price_override_cents=3669
              THEN NULL ELSE price_override_cents END,
            source_orderable=true,availability='source_on_demand',
            sale_status='available',source=source||$2::jsonb,updated_at=now()
            WHERE id=$1 AND (price_override_cents IS NULL OR price_override_cents=3669)`,
          [gastro.id, JSON.stringify(gastro)]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)',
          [gastroFallbackMigration]);
      }
      const salePolicyMigration = await client.query("SELECT name FROM catalog_migrations WHERE name='initial_brand_sale_status_2026_11_06'");
      if (!salePolicyMigration.rows.length) {
        await client.query(`UPDATE catalog_variants v SET sale_status=CASE
          WHEN lower(p.brand) IN ('heybo pet','heiba pet','heybopet') THEN 'preorder'
          WHEN lower(p.brand) IN ('advance','hill’s','hill''s') THEN 'unavailable'
          ELSE 'available' END,updated_at=now()
          FROM catalog_products p WHERE p.id=v.product_id AND p.active=true AND v.active=true`);
        await client.query("INSERT INTO catalog_migrations(name) VALUES('initial_brand_sale_status_2026_11_06')");
      }
      const acanaWetUnavailableMigration = 'acana_wet_unavailable_2026_11_19';
      const acanaWetUnavailableDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [acanaWetUnavailableMigration]);
      if (!acanaWetUnavailableDone.rows.length) {
        // The owner confirmed that the current distributor cannot supply these
        // six wet-food SKUs. Preserve any physical stock and the retail price.
        await client.query(`UPDATE catalog_variants SET sale_status='unavailable',
          source_orderable=false,availability='unavailable',updated_at=now()
          WHERE product_id = ANY($1::text[]) AND coalesce(stock_quantity,0)=0`, [[
          'acana-wet-kitten', 'acana-wet-chicken', 'acana-wet-tuna',
          'acana-wet-lamb', 'acana-wet-salmon', 'acana-wet-beef'
        ]]);
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)',
          [acanaWetUnavailableMigration]);
      }
      const unpricedRequestMigration = 'unpriced_customer_request_2026_11_10';
      const dogActivityMigration = 'yagu_dog_activity_availability_2026_11_16';
      const dogActivityDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [dogActivityMigration]);
      if (!dogActivityDone.rows.length) {
        await client.query(`UPDATE catalog_variants SET sale_status='unavailable',
          source_orderable=false,availability='unavailable',updated_at=now()
          WHERE id = ANY($1::text[])`, [[
          'yagu-7500016-activity', 'yagu-7575324-activity', 'yagu-7517008-activity'
        ]]);
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [dogActivityMigration]);
      }
      const dogActivityPriceMigration = 'yagu_dog_activity_market_prices_2026_11_16';
      const dogActivityPriceDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [dogActivityPriceMigration]);
      if (!dogActivityPriceDone.rows.length) {
        for (const [id, previousCents, retailCents] of [
          ['yagu-7514503-activity', 793, 500],
          ['yagu-7500016-activity', 1452, 675],
          ['yagu-7575324-activity', 1699, 1399],
          ['yagu-7517008-activity', 1599, 1339]
        ]) {
          const source = products.find(product => product.id === id)?.variants?.[0];
          await client.query(`UPDATE catalog_variants SET source_price_cents=$3,
            source=source||$4::jsonb,updated_at=now()
            WHERE id=$1 AND source_price_cents=$2 AND price_override_cents IS NULL
              AND price_confirmed=false`,
          [id, previousCents, retailCents, JSON.stringify(source)]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [dogActivityPriceMigration]);
      }
      const unpricedRequestDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [unpricedRequestMigration]);
      if (!unpricedRequestDone.rows.length) {
        await client.query(`UPDATE catalog_variants SET sale_status='unavailable',updated_at=now()
          WHERE id = ANY($1::text[]) AND price_confirmed=false`, [[
          'heybopet-hbzh-icb-19', 'heybopet-hbzh-icb-24',
          'birthday-bandana', 'halloween-bandana', 'elf-hat'
        ]]);
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [unpricedRequestMigration]);
      }
      const editorialMigration = 'verified_product_copy_2026_11_10';
      const editorialDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [editorialMigration]);
      if (!editorialDone.rows.length) {
        for (const [productId, copy] of Object.entries(catalogEditorialContent)) {
          await client.query(`UPDATE catalog_products SET
            description=CASE WHEN btrim(description)='' THEN $2 ELSE description END,
            details=CASE WHEN details='[]'::jsonb THEN $3::jsonb ELSE details END
            WHERE id=$1 AND (btrim(description)='' OR details='[]'::jsonb)`,
          [productId, copy.description, JSON.stringify(copy.details)]);
          await client.query(`UPDATE catalog_variants SET
            description=CASE WHEN btrim(description)='' THEN $2 ELSE description END,
            details=CASE WHEN details='[]'::jsonb THEN $3::jsonb ELSE details END,
            updated_at=now()
            WHERE product_id=$1 AND (btrim(description)='' OR details='[]'::jsonb)`,
          [productId, copy.description, JSON.stringify(copy.details)]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [editorialMigration]);
      }
      const boilerplateMigration = 'remove_customer_copy_boilerplate_2026_11_10';
      const boilerplateDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [boilerplateMigration]);
      if (!boilerplateDone.rows.length) {
        const cleanDetails = table => `UPDATE ${table} AS entry SET details=(
          SELECT coalesce(jsonb_agg(to_jsonb(item.value) ORDER BY item.ordinality),'[]'::jsonb)
          FROM jsonb_array_elements_text(entry.details) WITH ORDINALITY AS item(value,ordinality)
          WHERE item.value !~* '^(Норму кормления|Свежая вода|Фасовку выберите перед добавлением в корзину|Используйте по инструкции на упаковке производителя)'
            AND item.value !~* '^(Сухой|Влажный) корм( для кошек)?$'
            AND item.value !~* '^(Сухой )?полнорационный (сухой )?корм$'
        ) WHERE EXISTS (SELECT 1 FROM jsonb_array_elements_text(entry.details) AS item(value)
          WHERE item.value ~* '^(Норму кормления|Свежая вода|Фасовку выберите перед добавлением в корзину|Используйте по инструкции на упаковке производителя)'
            OR item.value ~* '^(Сухой|Влажный) корм( для кошек)?$'
            OR item.value ~* '^(Сухой )?полнорационный (сухой )?корм$')`;
        await client.query(cleanDetails('catalog_products'));
        await client.query(cleanDetails('catalog_variants'));
        for (const [productId, copy] of Object.entries(catalogEditorialContent)) {
          await client.query(`UPDATE catalog_variants v SET
            description=CASE WHEN v.description='Сухой корм '||p.name||' для собак'
              THEN $2 ELSE v.description END,
            details=CASE WHEN v.details='[]'::jsonb THEN $3::jsonb ELSE v.details END,
            updated_at=now()
            FROM catalog_products p WHERE p.id=v.product_id AND p.id=$1
              AND (v.description='Сухой корм '||p.name||' для собак'
                OR v.details='[]'::jsonb)`,
          [productId, copy.description, JSON.stringify(copy.details)]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [boilerplateMigration]);
      }
      const restoreAccessoryImages = 'restore_accessory_sprite_images_2026_11_12';
      const restoredAccessoryImages = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [restoreAccessoryImages]);
      if (!restoredAccessoryImages.rows.length) {
        const ids = ['birthday-bandana', 'halloween-bandana', 'elf-hat'];
        // A blank path keeps the existing studio sprite image from data.js.
        // Only undo the old placeholder; never replace a later product photo.
        await client.query(`UPDATE catalog_products SET image_path=NULL
          WHERE id=ANY($1::text[]) AND image_path='/media/catalog/photo-pending.svg'`, [ids]);
        await client.query(`UPDATE catalog_variants SET image_path=NULL,updated_at=now()
          WHERE id=ANY($1::text[]) AND image_path='/media/catalog/photo-pending.svg'`, [ids]);
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [restoreAccessoryImages]);
      }
      const leonardoCopyMigration = 'leonardo_poultry_verified_copy_2026_11_10';
      const leonardoCopyDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [leonardoCopyMigration]);
      if (!leonardoCopyDone.rows.length) {
        const copy = catalogEditorialContent['leonardo-poultry'];
        const oldDescription = 'Беззерновой сухой корм с птицей для взрослых кошек Амарант заменяет злаки в повседневной рецептуре';
        await client.query(`UPDATE catalog_products SET description=$2,details=$3::jsonb
          WHERE id=$1 AND description=$4`,
        ['leonardo-poultry', copy.description, JSON.stringify(copy.details), oldDescription]);
        await client.query(`UPDATE catalog_variants SET description=$2,details=$3::jsonb,updated_at=now()
          WHERE product_id=$1 AND description=$4`,
        ['leonardo-poultry', copy.description, JSON.stringify(copy.details), oldDescription]);
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [leonardoCopyMigration]);
      }
      const catCopyMigration = 'verified_cat_recipe_copy_2026_11_10';
      const catCopyDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [catCopyMigration]);
      if (!catCopyDone.rows.length) {
        for (const [productId, copy] of Object.entries(catalogEditorialCats)) {
          await client.query(`UPDATE catalog_products SET description=$2,details=$3::jsonb
            WHERE id=$1 AND description=$4`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
          await client.query(`UPDATE catalog_variants SET description=$2,details=$3::jsonb,updated_at=now()
            WHERE product_id=$1 AND (description=$4 OR btrim(description)='')`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [catCopyMigration]);
      }
      const dogCopyMigration = 'verified_dog_recipe_copy_2026_11_10';
      const dogCopyDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [dogCopyMigration]);
      if (!dogCopyDone.rows.length) {
        for (const [productId, copy] of Object.entries(catalogEditorialDogs)) {
          await client.query(`UPDATE catalog_products SET description=$2,details=$3::jsonb
            WHERE id=$1 AND description=$4`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
          await client.query(`UPDATE catalog_variants SET description=$2,details=$3::jsonb,updated_at=now()
            WHERE product_id=$1 AND (description=$4 OR btrim(description)='')`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [dogCopyMigration]);
      }
      const royalCaninCopyMigration = 'verified_royal_canin_cat_copy_2026_11_11';
      const royalCaninCopyDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [royalCaninCopyMigration]);
      if (!royalCaninCopyDone.rows.length) {
        for (const [productId, copy] of Object.entries(catalogEditorialRoyalCanin)) {
          await client.query(`UPDATE catalog_products SET description=$2,details=$3::jsonb
            WHERE id=$1 AND description=$4`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
          await client.query(`UPDATE catalog_variants SET description=$2,details=$3::jsonb,updated_at=now()
            WHERE product_id=$1 AND (description=$4 OR btrim(description)='')`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [royalCaninCopyMigration]);
      }
      const leonardoBatchMigration = 'verified_leonardo_cat_copy_2026_11_11';
      const leonardoBatchDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [leonardoBatchMigration]);
      if (!leonardoBatchDone.rows.length) {
        for (const [productId, copy] of Object.entries(catalogEditorialLeonardo)) {
          await client.query(`UPDATE catalog_products SET description=$2,details=$3::jsonb
            WHERE id=$1 AND description=$4`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
          await client.query(`UPDATE catalog_variants SET description=$2,details=$3::jsonb,updated_at=now()
            WHERE product_id=$1 AND (description=$4 OR btrim(description)='')`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [leonardoBatchMigration]);
      }
      const openAuditMigration = 'verified_open_product_copy_2026_11_25';
      const openAuditDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [openAuditMigration]);
      if (!openAuditDone.rows.length) {
        for (const [productId, copy] of Object.entries(catalogEditorialOpenAudit)) {
          await client.query(`UPDATE catalog_products SET description=$2,details=$3::jsonb
            WHERE id=$1 AND description=$4`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
          await client.query(`UPDATE catalog_variants SET description=$2,details=$3::jsonb,updated_at=now()
            WHERE product_id=$1 AND description=$4`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [openAuditMigration]);
      }
      const royalCaninNextMigration = 'royal_canin_next_copy_2026_11_25';
      const royalCaninNextDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [royalCaninNextMigration]);
      if (!royalCaninNextDone.rows.length) {
        for (const [productId, copy] of Object.entries(catalogEditorialRoyalCaninNext)) {
          await client.query(`UPDATE catalog_products SET description=$2,details=$3::jsonb
            WHERE id=$1 AND description=$4`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
          await client.query(`UPDATE catalog_variants SET description=$2,details=$3::jsonb,updated_at=now()
            WHERE product_id=$1 AND description=$4`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [royalCaninNextMigration]);
      }
      const royalCaninWave3Migration = 'royal_canin_wave3_copy_2026_11_25';
      const royalCaninWave3Done = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [royalCaninWave3Migration]);
      if (!royalCaninWave3Done.rows.length) {
        for (const [productId, copy] of Object.entries(catalogEditorialRoyalCaninWave3)) {
          await client.query(`UPDATE catalog_products SET description=$2,details=$3::jsonb
            WHERE id=$1 AND description=$4`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
          await client.query(`UPDATE catalog_variants SET description=$2,details=$3::jsonb,updated_at=now()
            WHERE product_id=$1 AND description=$4`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [royalCaninWave3Migration]);
      }
      const heldCopyMigration = 'verified_legacy_recipe_copy_2026_11_12';
      const heldCopyDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [heldCopyMigration]);
      if (!heldCopyDone.rows.length) {
        for (const [productId, copy] of Object.entries(catalogEditorialHeld)) {
          await client.query(`UPDATE catalog_products SET description=$2,details=$3::jsonb
            WHERE id=$1 AND description=$4`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
          await client.query(`UPDATE catalog_variants SET description=$2,details=$3::jsonb,updated_at=now()
            WHERE product_id=$1 AND (description=$4 OR btrim(description)='')`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [heldCopyMigration]);
      }
      const churuDogCopyMigration = 'verified_churu_dog_copy_2026_11_12';
      const churuDogCopyDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [churuDogCopyMigration]);
      if (!churuDogCopyDone.rows.length) {
        for (const [productId, copy] of Object.entries(catalogEditorialChuruDog)) {
          await client.query(`UPDATE catalog_products SET description=$2,details=$3::jsonb
            WHERE id=$1 AND description=$4`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
          await client.query(`UPDATE catalog_variants SET description=$2,details=$3::jsonb,updated_at=now()
            WHERE product_id=$1 AND description=$4`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [churuDogCopyMigration]);
      }
      // Older catalog rows used copy from the first Churu DOG import. Match those
      // exact strings so a later editorial edit by the owner is never overwritten.
      const churuDogLegacyCopyMigration = 'verified_churu_dog_legacy_copy_2026_11_12';
      const churuDogLegacyCopyDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [churuDogLegacyCopyMigration]);
      if (!churuDogLegacyCopyDone.rows.length) {
        const legacyDescriptions = {
          'churu-dog-tuna-pack4': 'Кремовое лакомство для собак, вкус курица с тунцом. В пачке 4 тюбика × 14 г',
          'churu-dog-tuna-pack8': 'Кремовое лакомство для собак, вкус курица с тунцом. В пачке 8 тюбиков × 20 г',
          'churu-dog-tuna-bites': 'Мягкие кусочки с кремовой начинкой, вкус курица с тунцом. В пачке 8 порций по 12 г',
          'churu-dog-salmon-pack4': 'Кремовое лакомство для собак, вкус курица с лососем. В пачке 4 тюбика × 14 г',
          'churu-dog-salmon-pack8': 'Кремовое лакомство для собак, вкус курица с лососем. В пачке 8 тюбиков × 20 г',
          'churu-dog-salmon-bites': 'Мягкие кусочки с кремовой начинкой, вкус курица с лососем. В пачке 8 порций по 12 г',
          'churu-dog-cheese-pack4': 'Кремовое лакомство для собак, вкус курица с сыром. В пачке 4 тюбика × 14 г',
          'churu-dog-cheese-pack8': 'Кремовое лакомство для собак, вкус курица с сыром. В пачке 8 тюбиков × 20 г',
          'churu-dog-cheese-bites': 'Мягкие кусочки с кремовой начинкой, вкус курица с сыром. В пачке 8 порций по 12 г',
          'churu-dog-chicken-pack8': 'Кремовое лакомство для собак, вкус курица. В пачке 8 тюбиков × 20 г',
          'churu-dog-chicken-bites': 'Мягкие кусочки с кремовой начинкой, вкус курица. В пачке 8 порций по 12 г'
        };
        for (const [productId, legacyDescription] of Object.entries(legacyDescriptions)) {
          const copy = catalogEditorialChuruDog[productId];
          await client.query(`UPDATE catalog_products SET description=$2,details=$3::jsonb
            WHERE id=$1 AND description=$4`,
          [productId, copy.description, JSON.stringify(copy.details), legacyDescription]);
          await client.query(`UPDATE catalog_variants SET description=$2,details=$3::jsonb,updated_at=now()
            WHERE product_id=$1 AND description=$4`,
          [productId, copy.description, JSON.stringify(copy.details), legacyDescription]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [churuDogLegacyCopyMigration]);
      }
      const acanaWetCopyMigration = 'verified_acana_wet_copy_2026_11_12';
      const acanaWetCopyDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [acanaWetCopyMigration]);
      if (!acanaWetCopyDone.rows.length) {
        for (const [productId, copy] of Object.entries(catalogEditorialAcanaWet)) {
          await client.query(`UPDATE catalog_products SET description=$2,details=$3::jsonb
            WHERE id=$1 AND description=$4`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
          await client.query(`UPDATE catalog_variants SET description=$2,details=$3::jsonb,updated_at=now()
            WHERE product_id=$1 AND description=$4`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [acanaWetCopyMigration]);
      }
      const churuCatCopyMigration = 'verified_churu_cat_copy_2026_11_12';
      const churuCatCopyDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [churuCatCopyMigration]);
      if (!churuCatCopyDone.rows.length) {
        for (const [productId, copy] of Object.entries(catalogEditorialChuruCat)) {
          await client.query(`UPDATE catalog_products SET description=$2,details=$3::jsonb
            WHERE id=$1 AND description=$4`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
          await client.query(`UPDATE catalog_variants SET description=$2,details=$3::jsonb,updated_at=now()
            WHERE product_id=$1 AND description=$4`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [churuCatCopyMigration]);
      }
      const nextCopyMigration = 'verified_next_30_copy_2026_11_17';
      const nextCopyDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [nextCopyMigration]);
      if (!nextCopyDone.rows.length) {
        for (const [productId, copy] of Object.entries(catalogEditorialNext)) {
          await client.query(`UPDATE catalog_products SET description=$2,details=$3::jsonb
            WHERE id=$1 AND description=$4`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
          await client.query(`UPDATE catalog_variants SET description=$2,details=$3::jsonb,updated_at=now()
            WHERE product_id=$1 AND description=$4`,
          [productId, copy.description, JSON.stringify(copy.details), copy.previousDescription]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [nextCopyMigration]);
      }
      // Owner-approved retail prices for Persian Kitten remain separate from B2B quotes.
      const persianKittenMigration = 'persian_kitten_owner_prices_2026_11_25';
      const persianKittenDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [persianKittenMigration]);
      if (!persianKittenDone.rowCount) {
        for (const [id, priceCents] of [
          ['rc-persian-kitten-400g', 799],
          ['rc-persian-kitten-2kg', 3199],
          ['rc-persian-kitten-4kg', 5999]
        ]) {
          await client.query(`UPDATE catalog_variants SET
            price_override_cents=$2,price_confirmed=true,
            sale_status='available',availability='source_on_demand',
            updated_at=now() WHERE id=$1`, [id, priceCents]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [persianKittenMigration]);
      }
      const royalCaninOrderMigration = 'royal_canin_order_prices_2026_11_25';
      const royalCaninOrderDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [royalCaninOrderMigration]);
      if (!royalCaninOrderDone.rowCount) {
        for (const [id, priceCents] of [
          ['rc-sphynx-adult-2kg', 3299],
          ['rc-kitten-jelly-85g', 149]
        ]) {
          await client.query(`UPDATE catalog_variants SET
            price_override_cents=$2,price_confirmed=true,
            sale_status='available',availability='source_on_demand',
            updated_at=now() WHERE id=$1`, [id, priceCents]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [royalCaninOrderMigration]);
      }
      // The owner set a retail price for this model; its two color variants remain
      // unavailable for checkout until Tina confirms which colors she can supply.
      await client.query(`UPDATE catalog_variants SET price_override_cents=5490,
        price_confirmed=true WHERE id = ANY($1::text[])
          AND price_override_cents IS NULL AND price_confirmed=false`,
      [['heybopet-hb-pwfs-s30s-black','heybopet-hb-pwfs-s30s-white']]);
      // PWF is sold as one box of three filters. The supplier MOQ is 20 boxes,
      // so keep checkout unavailable until the first batch is actually received.
      await client.query(`UPDATE catalog_variants SET
        price_override_cents=699,price_confirmed=true,
        purchase_price_cents=coalesce(purchase_price_cents,460),updated_at=now()
        WHERE id='heybopet-pwf-filters-3-box'
          AND price_override_cents IS NULL AND price_confirmed=false`);
      // Tina's updated proforma confirms a first batch of 20 fountains and 20
      // filter boxes. They can be ordered by customers, but stock stays at zero
      // until the shipment is received and recorded.
      const heyboFirstBatchMigration = 'heybopet_first_batch_orderable_2026_11_12';
      const heyboFirstBatchDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [heyboFirstBatchMigration]);
      if (!heyboFirstBatchDone.rows.length) {
        await client.query(`UPDATE catalog_variants SET
          sale_status='available',source_orderable=true,
          availability='source_on_demand',updated_at=now()
          WHERE id = ANY($1::text[]) AND sale_status='preorder'`,
        [['heybopet-hb-pwfs-s30s-black','heybopet-hb-pwfs-s30s-white',
          'heybopet-pwf-filters-3-box']]);
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)',
          [heyboFirstBatchMigration]);
      }
      // Update only the original imported copy so an owner's later product edit wins.
      const filterCopy = 'Универсальные сменные фильтры для питьевых фонтанов, совместимые с большинством моделей и задерживающие частицы и загрязнения в воде';
      const filterDetails = JSON.stringify([
        'В коробочке 3 сменных фильтра'
      ]);
      await client.query(`UPDATE catalog_products SET description=$2,details=$3::jsonb
        WHERE id=$1 AND description IN (
          'Набор сменных фильтров для поилки HeyboPet',
          'Сменные фильтры для питьевого фонтана HeyboPet HB-PWFS-S30S: задерживают частицы и загрязнения в воде',
          'Сменные фильтры для питьевых фонтанов: помогают задерживать частицы и загрязнения в воде')
          AND (details='["В коробочке 3 сменных фильтра"]'::jsonb OR
            details='["В коробочке 3 сменных фильтра","Совместимость подтверждена с моделью HB-PWFS-S30S","Совместимость с другими моделями поилок не подтверждена"]'::jsonb OR
            details='["В коробочке 3 сменных фильтра","Подходят для фонтанов с фильтром такой же формы и размера","Перед покупкой сравните фильтр с тем, который используется в вашей поилке"]'::jsonb)`,
      ['heybopet-pwf-filters-3', filterCopy, filterDetails]);
      await client.query(`UPDATE catalog_variants SET description=$2,details=$3::jsonb
        WHERE id=$1 AND description IN (
          'Набор сменных фильтров для поилки HeyboPet',
          'Сменные фильтры для питьевого фонтана HeyboPet HB-PWFS-S30S: задерживают частицы и загрязнения в воде',
          'Сменные фильтры для питьевых фонтанов: помогают задерживать частицы и загрязнения в воде')
          AND (details='["В коробочке 3 сменных фильтра"]'::jsonb OR
            details='["В коробочке 3 сменных фильтра","Совместимость подтверждена с моделью HB-PWFS-S30S","Совместимость с другими моделями поилок не подтверждена"]'::jsonb OR
            details='["В коробочке 3 сменных фильтра","Подходят для фонтанов с фильтром такой же формы и размера","Перед покупкой сравните фильтр с тем, который используется в вашей поилке"]'::jsonb)`,
      ['heybopet-pwf-filters-3-box', filterCopy, filterDetails]);
    }
    if (items === products) {
      const saleMigration = 'owner_offsite_pouch_sale_2026_11_21';
      const recorded = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1', [saleMigration]);
      if (!recorded.rows.length) {
        for (const [id, name, amount] of [
          ['royalcanin-93e8aeca-85g', 'Royal Canin Kitten 85 g', '14.90'],
          ['leonardo-wet-pure-chicken-85g', 'Leonardo Finest Selection Pure Chicken 85 g', '13.10']
        ]) {
          const { rows: stock } = await client.query(`SELECT stock_quantity,reserved_quantity
            FROM catalog_variants WHERE id=$1 FOR UPDATE`, [id]);
          if (!stock.length || Number(stock[0].stock_quantity) - Number(stock[0].reserved_quantity) < 10)
            throw new Error(`Insufficient free stock for owner-confirmed offsite sale: ${id}`);
          const { rows: changed } = await client.query(`UPDATE catalog_variants SET
            stock_quantity=stock_quantity-10,updated_at=now() WHERE id=$1
            RETURNING stock_quantity,reserved_quantity`, [id]);
          await client.query(`INSERT INTO inventory_movements
            (id,variant_id,idempotency_key,reason,delta_on_hand,delta_reserved,
             on_hand_after,reserved_after,note)
            VALUES($1,$2,$3,'manual_sale',-10,0,$4,$5,$6)`,
          [randomUUID(), id, `owner_offsite_sale_2026_11_21_${id}`,
            changed[0].stock_quantity, changed[0].reserved_quantity,
            `Owner-confirmed sale of 10 ${name}; EUR ${amount} line; EUR 28.00 total awaiting payment via Ukrainian card; invoice pending`]);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [saleMigration]);
      }
      const ledgerMigration = 'owner_offsite_pouch_sale_paid_ledger_2026_11_21';
      const ledgerRecorded = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [ledgerMigration]);
      if (!ledgerRecorded.rows.length) {
        const saleId = randomUUID();
        await client.query(`INSERT INTO external_sales
          (id,reference,sale_date,customer_note,payment_channel,payment_status,paid_on,
           gross_cents,product_cost_cents,gift_cost_cents,documentation_status,note)
          VALUES($1,$2,$3,$4,$5,'paid',$3,2800,2279,46,'pending',$6)`,
        [saleId, 'neighbor-pouches-2026-11-21', '2026-11-21', 'Соседка', 'privatbank_ua',
          'Владелец подтвердил получение оплаты на украинскую карту; банковская сумма и документ отдельно не проверены']);
        for (const [variantId, unitPriceCents, purchaseCostCents] of [
          ['royalcanin-93e8aeca-85g', 149, 1253],
          ['leonardo-wet-pure-chicken-85g', 131, 1026]
        ]) {
          const linked = await client.query(`INSERT INTO external_sale_items
            (sale_id,variant_id,quantity,unit_price_cents,purchase_cost_cents,stock_movement_id)
            SELECT $1,$2,10,$3,$4,id FROM inventory_movements WHERE idempotency_key=$5`,
          [saleId, variantId, unitPriceCents, purchaseCostCents,
            `owner_offsite_sale_2026_11_21_${variantId}`]);
          if (linked.rowCount !== 1)
            throw new Error(`Missing stock movement for paid offsite sale: ${variantId}`);
        }
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [ledgerMigration]);
      }
      const expenseMigration = 'owner_personal_and_welcome_expenses_2026_11_21';
      const expenseRecorded = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [expenseMigration]);
      if (!expenseRecorded.rows.length) {
        const leonardoId = 'leonardo-wet-pure-chicken-85g';
        const fountainId = 'heybopet-hb-pwfs-s30s-white';
        const { rows: balances } = await client.query(`SELECT id,stock_quantity,reserved_quantity
          FROM catalog_variants WHERE id=ANY($1::text[]) ORDER BY id FOR UPDATE`,
        [[leonardoId, fountainId]]);
        const stock = new Map(balances.map(row => [row.id, row]));
        if (Number(stock.get(leonardoId)?.stock_quantity) !== 6 ||
            Number(stock.get(fountainId)?.stock_quantity) !== 20 ||
            Number(stock.get(leonardoId)?.reserved_quantity) > 4 ||
            Number(stock.get(fountainId)?.reserved_quantity) > 19) {
          console.warn('Owner expense import paused: live stock differs from the owner-confirmed 6 Leonardo and 20 white fountains');
        } else {
          const saleReference = 'neighbor-pouches-2026-11-21';
          const expenses = [
            ['leonardo-personal', 'Leonardo Finest Selection Pure Chicken 85 г', '931251',
              leonardoId, 1, 103, 'personal', 'Коты владельца', null],
            ['leonardo-anton-gift', 'Leonardo Finest Selection Pure Chicken 85 г', '931251',
              leonardoId, 1, 102, 'welcome_gift', 'Антон', null],
            ['churu-personal-three', 'Churu лосось и курица, отдельные тюбики', '949577',
              null, 3, 138, 'personal', 'Коты владельца', null],
            ['churu-anton-gift', 'Churu лосось и курица, отдельный тюбик', '949577',
              null, 1, 46, 'welcome_gift', 'Антон', null],
            ['churu-neighbor-gift', 'Churu лосось и курица, отдельный тюбик', '949577',
              null, 1, 46, 'welcome_gift', 'Соседка', saleReference],
            ['fresh-duck-personal', 'Leonardo Fresh Duck & Poultry 4 кг', '931040',
              null, 1, 3320, 'personal', 'Коты владельца', null],
            ['fountain-personal', 'HeyboPet белая поилка HB-PWFS-S30S', 'HB-PWFS-S30S',
              fountainId, 1, 2927, 'personal', 'Коты владельца', null]
          ];
          for (const [suffix,itemName,supplierSku,variantId,quantity,totalCost,category,
            recipient,relatedSale] of expenses) {
            const reference = `owner-expense-2026-11-21-${suffix}`;
            let movementId = null;
            if (variantId) {
              const { rows: changed } = await client.query(`UPDATE catalog_variants
                SET stock_quantity=stock_quantity-$2,updated_at=now()
                WHERE id=$1 RETURNING stock_quantity,reserved_quantity`, [variantId,quantity]);
              movementId = randomUUID();
              await client.query(`INSERT INTO inventory_movements
                (id,variant_id,idempotency_key,reason,delta_on_hand,delta_reserved,
                 on_hand_after,reserved_after,note)
                VALUES($1,$2,$3,$4,$5,0,$6,$7,$8)`,
              [movementId,variantId,reference,
                category === 'personal' ? 'personal_expense' : 'marketing_expense',
                -quantity,changed[0].stock_quantity,changed[0].reserved_quantity,
                `${recipient}; ${itemName}; фактическая стоимость партии ${totalCost} центов`]);
            }
            await client.query(`INSERT INTO owner_expenses
              (id,reference,expense_date,item_name,supplier_sku,variant_id,quantity,
               total_cost_cents,category,recipient,stock_movement_id,
               related_sale_reference,note)
              VALUES($1,$2,'2026-11-21',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [randomUUID(),reference,itemName,supplierSku,variantId,quantity,totalCost,
              category,recipient,movementId,relatedSale,
              'Подтверждено владельцем 21.11; дата фактического использования не уточнена']);
          }
          await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [expenseMigration]);
        }
      }
    }
    if (items === products) await seedInitialSalesLedger(client);
    await client.query('COMMIT');
    return rows.length;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

export async function catalogSnapshot(db) {
  const [{ rows }, supplierStates] = await Promise.all([db.query(`SELECT v.id AS variant_id,v.product_id,p.name,p.brand,p.category,p.pet,p.image_path,
    p.description,p.details,p.food_type,v.image_path AS variant_image_path,
    v.description AS variant_description,v.details AS variant_details,
    v.label,v.source AS price_source,v.source->>'weight' AS declared_weight,
    v.source->>'packageWeightKg' AS package_weight_kg,
    v.source_price_cents,v.price_override_cents,v.purchase_price_cents,
    v.price_confirmed,v.source_orderable,v.availability,v.sale_status,v.stock_quantity,v.reserved_quantity,
    (SELECT coalesce(sum(i.quantity),0)::integer FROM order_items i JOIN orders o ON o.id=i.order_id
      WHERE i.variant_id=v.id AND i.source_mode!='on_hand' AND o.payment_status='paid'
        AND o.is_test=false AND o.status IN ('received','packing','delivering')) AS committed_quantity,
    v.reorder_point,v.target_stock,
    v.tax_rate_bps,v.display_priority
    FROM catalog_variants v JOIN catalog_products p ON p.id=v.product_id
    WHERE p.active=true AND v.active=true
      AND coalesce(p.source->>'gift','')='' AND coalesce(p.source->>'catalogHidden','false')!='true'
    ORDER BY p.name,v.display_priority DESC,v.label`),
    supplierSourcingByVariant(db)]);
  return rows.map(({ price_source, ...row }) => {
    const supplier = supplierStates.get(row.variant_id);
    const price = salePriceDecision({ ...row, price_source });
    const sourcingAvailability = ['unavailable', 'pending'].includes(row.availability)
      ? 'unavailable' : row.availability === 'on_hand' && row.stock_quantity > 0
      ? 'on_hand' : supplier ? 'source_on_demand' : 'unavailable';
    return {
      ...row, sale_price_cents: price.priceCents, price_accepted: price.accepted,
      price_basis: price.basis, price_review: price.review,
      sourcing_availability: sourcingAvailability,
      pickup_available: row.availability === 'on_hand' &&
        Number(row.stock_quantity) - Number(row.reserved_quantity || 0) -
        Number(row.committed_quantity || 0) > 0,
      selected_supplier_units: supplier?.selectedUnits || 0,
      supplier_source_count: supplier?.sourceCount || 0,
      orderable: row.sale_status !== 'unavailable' && price.accepted
    };
  });
}
