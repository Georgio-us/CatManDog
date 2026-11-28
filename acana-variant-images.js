const editorialRoot = 'https://img.catmandog.es/assets/acana/editorial';

export const acanaStudioImages = {
  'acana-bountiful': { name: 'ACANA Bountiful Catch', grams: [1800, 4500] },
  'acana-first-feast': { name: 'ACANA First Feast', grams: [340, 1800] },
  'acana-grasslands': { name: 'ACANA Grasslands Cat', grams: [340, 1800, 4500] },
  'acana-hp-indoor': { name: 'ACANA Highest Protein Indoor Cat', grams: [1800, 4500] },
  'acana-homestead': { name: 'ACANA Homestead Harvest', grams: [340, 1800, 4500] },
  'acana-indoor': { name: 'ACANA Indoor Entrée', grams: [340, 1800, 4500] },
  'acana-pacifica': { name: 'ACANA Pacifica', grams: [340, 1800, 4500] },
  'acana-wild-prairie': { name: 'ACANA Wild Prairie', grams: [340, 1800, 4500] }
};

export function acanaStudioImage(productId, name, grams) {
  return {
    src: `${editorialRoot}/${productId}-${grams}g-studio-v1.webp`,
    alt: `${name} · ${grams === 340 ? '340 g' : `${grams / 1000} kg`}`,
    presentation: 'editorial',
    generated: true
  };
}
