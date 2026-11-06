import { sendcloudReady, sendcloudShippingOptions } from './sendcloud.js';

// Only a mass explicitly attached to a SKU can be used for a carrier quote.
// Package and carrier measurements are confirmed when the label is created.
export function skuWeightKg(value) {
  const label = String(value || '').trim().toLowerCase().replace(',', '.');
  const match = label.match(/^(?:(\d+)\s*[x×]\s*)?(\d+(?:\.\d+)?)\s*(кг|kg|г|gr|g)(?:\b|\s|$)/u);
  if (!match) return null;
  const kg = Number(match[2]) * (match[1] ? Number(match[1]) : 1) *
    (match[3] === 'кг' || match[3] === 'kg' ? 1 : 0.001);
  return kg > 0 && kg <= 30 ? kg : null;
}

export function cartParcel(lines, variants) {
  const byId = new Map(variants.map(row => [row.variant_id, row]));
  let weightKg = 0;
  const missing = [];
  for (const line of lines || []) {
    const row = byId.get(line?.variantId);
    if (!row || row.product_id !== line.productId || !Number.isInteger(line.qty) ||
      line.qty < 1 || line.qty > 99) throw new Error('Проверьте товары в корзине');
    const explicitWeight = Number(row.package_weight_kg);
    const weight = Number.isFinite(explicitWeight) && explicitWeight > 0 && explicitWeight <= 30
      ? explicitWeight : skuWeightKg(row.declared_weight || row.label);
    // A weight on a bulky accessory is not enough to estimate its dimensions.
    if (!weight || !['Корм', 'Лакомства'].includes(row.category)) {
      missing.push(line.variantId);
      continue;
    }
    weightKg += weight * line.qty;
  }
  if (missing.length) return { available: false, reason: 'weight_or_dimensions_missing', missingVariantIds: missing };
  if (weightKg > 20) return { available: false, reason: 'parcel_too_heavy', missingVariantIds: [] };
  // Quote the next half-kilogram tier rather than understating the carrier weight.
  const quoteWeightKg = Math.ceil((weightKg + 0.05) * 2) / 2;
  // These dimensions are quote assumptions, not measured CatManDog parcels.
  const box = quoteWeightKg <= 2.5 ? [40, 30, 20]
    : quoteWeightKg <= 10 ? [60, 40, 25] : [70, 45, 30];
  return { available: true, weightKg: Number(weightKg.toFixed(3)), quoteWeightKg,
    parcel: { weightKg: quoteWeightKg, lengthCm: box[0], widthCm: box[1], heightCm: box[2] } };
}

function cents(value) {
  if (typeof value === 'object' && value !== null) {
    if (value.currency && value.currency !== 'EUR') return null;
    return cents(value.value ?? value.amount);
  }
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric * 100) : null;
}

export function pricedShippingOptions(options) {
  return options.flatMap(option => {
    if (option.functionalities?.last_mile !== 'home_delivery') return [];
    const quoted = Array.isArray(option.quotes) ? option.quotes
      .map(quote => cents(quote.price?.total ?? quote.price?.total_price))
      .filter(Number.isInteger) : [];
    // Sendcloud already selects the billable tier, including volumetric weight.
    // If it returns several quotes, use the highest total to avoid undercharging.
    const priceCents = quoted.length ? Math.max(...quoted) : cents(option.quote?.total_price ?? option.quote?.price ??
      option.total_price ?? option.price);
    const code = option.shipping_option_code || option.code || option.id;
    if (!priceCents || !code) return [];
    return [{ code: String(code), carrier: String(option.carrier?.name || option.carrier_name ||
      option.carrier_code || ''), priceCents }];
  }).sort((a, b) => a.priceCents - b.priceCents);
}

export async function nationalShippingQuote({ postalCode, lines, variants, quoteOptions = sendcloudShippingOptions }) {
  if (!sendcloudReady()) return { available: false, reason: 'carrier_not_configured' };
  if (!/^\d{5}$/.test(String(postalCode || ''))) return { available: false, reason: 'invalid_postcode' };
  const measured = cartParcel(lines, variants);
  if (!measured.available) return measured;
  const options = pricedShippingOptions(await quoteOptions({ postalCode,
    parcels: [measured.parcel] }));
  if (!options.length) return { available: false, reason: 'no_carrier_quote',
    weightKg: measured.weightKg, quoteWeightKg: measured.quoteWeightKg,
    parcel: measured.parcel, packagingVerified: false };
  const selected = options[0];
  return { available: true, weightKg: measured.weightKg,
    quoteWeightKg: measured.quoteWeightKg, parcel: measured.parcel,
    packagingVerified: false, carrier: selected.carrier,
    optionCode: selected.code, deliveryCents: selected.priceCents };
}
