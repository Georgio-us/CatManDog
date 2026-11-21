// Customer prices approved on 2026-11-21. Supplier costs and physical stock
// are deliberately left unset until they are checked separately.
const items = [
  {
    id: 'cat-litter-yommy-tofu-lavanda-6l',
    name: 'Yommy Tofu Lavanda - комкующийся наполнитель 6 л',
    brand: 'Yommy', label: '6 л', price: 9.99,
    description: 'Натуральный комкующийся наполнитель из тофу с ароматом лаванды для кошачьего лотка',
    details: ['Наполнитель из тофу', 'Комкующийся наполнитель', 'Аромат лаванды', 'Упаковка 6 л']
  },
  {
    id: 'cat-litter-uniko-tofu-18l',
    name: 'Uniko Tofu Cat Litter - комкующийся наполнитель 18 л',
    brand: 'Uniko', label: '18 л', price: 19.99,
    description: 'Натуральный комкующийся наполнитель из тофу для кошачьего лотка в упаковке 18 л',
    details: ['Наполнитель из тофу', 'Комкующийся наполнитель', 'Упаковка 18 л']
  },
  {
    id: 'cat-litter-yommy-tofu-pl-6l',
    name: 'Yommy Tofu PL - комкующийся наполнитель 6 л',
    brand: 'Yommy', label: '6 л', price: 9.99,
    description: 'Натуральный комкующийся наполнитель Yommy Tofu PL для кошачьего лотка в упаковке 6 л',
    details: ['Наполнитель из тофу', 'Комкующийся наполнитель', 'Упаковка 6 л']
  },
  {
    id: 'cat-litter-sanicat-clumping-unscented-8l',
    name: 'Sanicat Clumping - комкующийся наполнитель без отдушки 8 л',
    brand: 'Sanicat', label: '8 л', price: 7.99,
    description: 'Комкующийся наполнитель Sanicat Clumping без ароматизаторов для кошачьего лотка в упаковке 8 л',
    details: ['Комкующийся наполнитель', 'Без ароматизаторов', 'Упаковка 8 л']
  }
];

export const newLitterProducts = items.map(item => {
  const variantId = `${item.id}-pack`;
  return {
    id: item.id, name: item.name, brand: item.brand,
    category: 'Наполнитель', pet: 'cat', isReal: true,
    optionLabel: 'Упаковка', weight: item.label,
    description: item.description, details: item.details,
    image: { placeholder: true },
    defaultVariantId: variantId,
    variants: [{
      id: variantId, label: item.label, name: item.name,
      price: item.price, priceStatus: 'confirmed',
      saleStatus: 'available', availabilityStatus: 'source_on_demand',
      description: item.description, details: item.details,
      sizes: [item.label]
    }]
  };
});
