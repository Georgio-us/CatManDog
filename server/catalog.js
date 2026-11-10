import { products } from '../data.js';
import { retiredProductIds } from '../catalog-policy.js';
import { snapshots, confirmedPrice, canBuy } from '../variants.js';
import { yaguRetailBenchmarks } from '../yagu-retail-benchmarks.js';
import { supplierSourcingByVariant } from './sourcing-status.js';
import { launchSelectedImageMap } from '../launch-selected-image-map.js';
import { selectedAcanaOrijenFormats } from '../acana-orijen-selected-formats.js';
import { salePriceDecision } from './sale-price-policy.js';
import { catalogEditorialContent } from '../catalog-editorial-content.js';

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
        /^(?:heybo pet|heiba pet|heybopet)$/i.test(product.brand || '') ? 'preorder' :
          /^(?:advance|hill[’']s)$/i.test(product.brand || '') ? 'unavailable' : 'available',
        variant.source]);
      // Existing launch variants may have been imported before retail research was completed.
      // Fill only empty reference prices; never replace an owner-approved or edited price.
      if (Object.hasOwn(yaguRetailBenchmarks, variant.source.supplier?.sku) && variant.sourcePriceCents) {
        await client.query(`UPDATE catalog_variants SET source_price_cents=$2
          WHERE id=$1 AND source_price_cents IS NULL AND price_override_cents IS NULL
            AND price_confirmed=false`, [variant.id, variant.sourcePriceCents]);
      }
    }
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
      const unpricedRequestMigration = 'unpriced_customer_request_2026_11_10';
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
      const missingPhotoMigration = 'unsourced_accessory_photo_placeholder_2026_11_10';
      const missingPhotoDone = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1',
        [missingPhotoMigration]);
      if (!missingPhotoDone.rows.length) {
        const ids = ['birthday-bandana', 'halloween-bandana', 'elf-hat'];
        const image = '/media/catalog/photo-pending.svg';
        await client.query(`UPDATE catalog_products SET image_path=$2
          WHERE id=ANY($1::text[]) AND coalesce(image_path,'')=''`, [ids, image]);
        await client.query(`UPDATE catalog_variants SET image_path=$2,updated_at=now()
          WHERE id=ANY($1::text[]) AND coalesce(image_path,'')=''`, [ids, image]);
        await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [missingPhotoMigration]);
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
    v.price_confirmed,v.source_orderable,v.availability,v.sale_status,v.stock_quantity,v.reorder_point,v.target_stock,
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
      selected_supplier_units: supplier?.selectedUnits || 0,
      supplier_source_count: supplier?.sourceCount || 0,
      orderable: row.sale_status !== 'unavailable' && price.accepted
    };
  });
}
