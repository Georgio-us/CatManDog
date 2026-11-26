// Direct B2B sources verified in the account, outside imported supplier price files.
// This proves a purchasing route for the exact SKU, not perpetual supplier stock.
const verifiedAt = '2026-11-26';
const source = (code, url) => ({ code, url, checkedAt: verifiedAt, supplier: 'Royal Canin', channel: 'TIENDA B2B' });
export const directSupplierSources = Object.freeze({
  'rc-labrador-puppy-3kg': source('2491400', 'https://webshop.royalcanin.com/es/es/es-2491400-bhn-labrador-junior-3k'),
  'rc-labrador-puppy-12kg': source('2491800', 'https://webshop.royalcanin.com/es/es/es-2491800-bhn-labrador-junior-12k'),
  'rc-labrador-adult-3kg': source('2487400', 'https://webshop.royalcanin.com/es/es/es-2487400-bhn-labrador-adult-3kg'),
  'rc-labrador-adult-12kg': source('2487800', 'https://webshop.royalcanin.com/es/es/es-2487800-bhn-labrador-adult-12kg'),
  'rc-labrador-sterilised-12kg': source('3996800', 'https://webshop.royalcanin.com/es/es/es-3996800-bhn-labrador-ad-sterilided-12k'),
  'rc-labrador-adult5-12kg': source('1339800', 'https://webshop.royalcanin.com/es/es/es-1339800-bhn-labrador-ageing-5-12kg'),
  'rc-labrador-adult-wet-140g': source('1259000', 'https://webshop.royalcanin.com/es/es/es-1259000-labrador-10x140gr')
});

export const directSupplierSource = (variantId, source) => {
  const verified = directSupplierSources[variantId];
  return verified && source?.supplierCode === verified.code ? verified : null;
};
