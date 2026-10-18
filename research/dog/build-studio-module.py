import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
manifest = json.loads((ROOT / 'research/dog/studio-manifest.json').read_text())
images = {r['id']: {key: r[key] for key in ['id', 'name', 'referencePath', 'referenceUrl', 'displayPath']} for r in manifest['images']}
assert len(images) == 24
for image in images.values():
    assert (ROOT / image['displayPath']).exists(), image['displayPath']
module = '// Real product references and generated gray studio photography\nconst images = ' + json.dumps(images, ensure_ascii=False, indent=2) + ''';
const variantImages = {
  '9235074': 'dog-mp-sensibowl-slomo-white',
  '7516408': 'dog-duvo-huggi-rabbit-large'
};
export function applyDogStudio(product) {
  function attach(target, key) {
    const asset = images[key];
    if (!asset) throw new Error(`Missing dog studio image: ${key}`);
    return {
      ...target,
      image: {
        src: asset.displayPath,
        alt: target.name + ' - студийное изображение',
        presentation: 'editorial',
        generated: true,
        originalSrc: asset.referencePath
      },
      imageSource: { name: 'Референс ' + product.brand, pageUrl: asset.referenceUrl }
    };
  }
  return {
    ...attach(product, product.id),
    variants: product.variants.map(variant => attach(variant, variantImages[variant.manufacturerSku] || product.id))
  };
}
'''
(ROOT / 'dog-studio-images.js').write_text(module)
print('24 verified image paths mapped to 22 dog families and their variants')
