import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogProducts } from '../data.js';
import { customerFacts, orderedVariants } from '../product-content.js';
import { seoDocument } from '../server/seo.js';

test('all selectors with known package weights run from the smallest weight to the largest', () => {
  for (const product of catalogProducts.filter(item => item.variants?.length > 1 && item.variants.every(variant => variant.packageWeightKg > 0))) {
    const weights = orderedVariants(product).map(variant => variant.packageWeightKg);
    assert.deepEqual(weights, [...weights].sort((a, b) => a - b), product.id);
  }
});

test('generic feeding and selection instructions stay out of customer product facts', () => {
  for (const product of catalogProducts.filter(item => item.category === 'Корм')) {
    assert.doesNotMatch(customerFacts(product.details).join(' '), /Свежая вода|Норму кормления|Фасовку выберите/u, product.id);
  }
});

test('visible products do not reuse another product description', () => {
  const descriptions = catalogProducts.map(product => product.description?.trim());
  assert.ok(descriptions.every(Boolean));
  assert.equal(new Set(descriptions).size, catalogProducts.length);
});

test('the released Leonardo server page uses product facts and ordered formats', async () => {
  const html = await seoDocument('/producto/leonardo-adult-gf-poultry');
  assert.match(html, /carne fresca de ave \(30 %\)/u);
  assert.match(html, /Ingredientes principales/u);
  assert.match(html, /300 g, 1,8 kg, 7,5 kg/u);
  assert.doesNotMatch(html, /Consulta los formatos y detalles/u);
  assert.doesNotMatch(html, /<meta name="robots" content="noindex/u);
});

test('mixed gram and kilogram labels sort numerically when weight metadata is missing', () => {
  const variants = ['10 кг', '2 kg', '400 г', '4 kg'].map(label => ({ label }));
  assert.deepEqual(orderedVariants({ variants }).map(({ label }) => label), ['400 г', '2 kg', '4 kg', '10 кг']);
  assert.deepEqual(variants.map(({ label }) => label), ['10 кг', '2 kg', '400 г', '4 kg']);
});
