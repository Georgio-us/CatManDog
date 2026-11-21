// Studio images are stored in R2; purchase costs and stock remain separate from retail prices.
const image = (file, alt) => ({
  src: `https://img.catmandog.es/assets/litter-studio-2026-11-21/${file}-studio-v1.webp`,
  alt, presentation: 'editorial'
});
const variant = (id, label, price, photo, description, details, extra = {}) => ({
  id, label, price, priceStatus: 'confirmed',
  saleStatus: 'available', availabilityStatus: 'source_on_demand',
  image: photo, description, details, sizes: [label], ...extra
});

const lavenderPhoto = image('yommy-tofu-lavanda-6l', 'Упаковка Yommy Tofu Lavanda 6 л');
const greenTeaPhoto = image('yommy-tofu-verde-6l', 'Упаковка Yommy Tofu Verde 6 л');
const uniko6Photo = image('uniko-tofu-6l', 'Упаковка Uniko Tofu Cat Litter 6 л');
const uniko18Photo = image('uniko-tofu-18l', 'Упаковка Uniko Tofu Cat Litter 18 л');
const sanicatPhoto = image('sanicat-clumping-8l', 'Упаковка Sanicat Clumping 8 л без ароматизаторов');

export const newLitterProducts = [
  {
    id: 'cat-litter-yommy-tofu-lavanda-6l',
    name: 'Yommy Tofu - комкующийся наполнитель 6 л', brand: 'Yommy',
    category: 'Наполнитель', pet: 'cat', isReal: true,
    optionLabel: 'Аромат', weight: '6 л', image: lavenderPhoto,
    description: 'Натуральный комкующийся наполнитель из тофу для кошачьего лотка в упаковке 6 л',
    details: ['Наполнитель из тофу', 'Комкующийся наполнитель', 'Упаковка 6 л'],
    defaultVariantId: 'cat-litter-yommy-tofu-lavanda-6l-pack',
    variants: [
      variant('cat-litter-yommy-tofu-lavanda-6l-pack', 'Лаванда · 6 л', 9.99,
        lavenderPhoto, 'Натуральный комкующийся наполнитель из тофу с ароматом лаванды для кошачьего лотка',
        ['Наполнитель из тофу', 'Комкующийся наполнитель', 'Аромат лаванды', 'Упаковка 6 л']),
      variant('cat-litter-yommy-tofu-verde-6l-pack', 'Зелёный чай · 6 л', 9.99,
        greenTeaPhoto, 'Натуральный комкующийся наполнитель из тофу с ароматом зелёного чая для кошачьего лотка',
        ['Наполнитель из тофу', 'Комкующийся наполнитель', 'Аромат зелёного чая', 'Упаковка 6 л'])
    ]
  },
  {
    id: 'cat-litter-uniko-tofu-18l',
    name: 'Uniko Tofu Cat Litter - комкующийся наполнитель', brand: 'Uniko',
    category: 'Наполнитель', pet: 'cat', isReal: true,
    optionLabel: 'Упаковка', weight: '6-18 л', image: uniko18Photo,
    description: 'Натуральный комкующийся наполнитель из тофу для кошачьего лотка в двух размерах',
    details: ['Наполнитель из тофу', 'Комкующийся наполнитель', 'Упаковка 6 или 18 л'],
    defaultVariantId: 'cat-litter-uniko-tofu-18l-pack',
    variants: [
      variant('cat-litter-uniko-tofu-6l-pack', '6 л', 10.99,
        uniko6Photo, 'Натуральный комкующийся наполнитель из тофу для кошачьего лотка в упаковке 6 л',
        ['Наполнитель из тофу', 'Комкующийся наполнитель', 'Упаковка 6 л'],
        { retailResearch: { checkedAt: '2026-11-21', manufacturerRetail: 8.50,
          comparableRetail: 12.20, sourceUrl: 'https://pilesan.com/wp-content/uploads/2026/03/catalogo-uniko-mini_compressed.pdf',
          comparatorUrl: 'https://complementosparaaves.com/es/arena-para-gatos/7626-uniko-arena-de-tofu-para-gatos-6-litros-25-kg-8428540772393.html' } }),
      variant('cat-litter-uniko-tofu-18l-pack', '18 л', 19.99,
        uniko18Photo, 'Натуральный комкующийся наполнитель из тофу для кошачьего лотка в упаковке 18 л',
        ['Наполнитель из тофу', 'Комкующийся наполнитель', 'Упаковка 18 л'])
    ]
  },
  {
    id: 'cat-litter-sanicat-clumping-unscented-8l',
    name: 'Sanicat Clumping - комкующийся наполнитель без отдушки 8 л',
    brand: 'Sanicat', category: 'Наполнитель', pet: 'cat', isReal: true,
    optionLabel: 'Упаковка', weight: '8 л', image: sanicatPhoto,
    description: 'Комкующийся наполнитель Sanicat Clumping без ароматизаторов для кошачьего лотка в упаковке 8 л',
    details: ['Комкующийся наполнитель', 'Без ароматизаторов', 'Упаковка 8 л'],
    defaultVariantId: 'cat-litter-sanicat-clumping-unscented-8l-pack',
    variants: [variant('cat-litter-sanicat-clumping-unscented-8l-pack', '8 л', 7.99,
      sanicatPhoto, 'Комкующийся наполнитель Sanicat Clumping без ароматизаторов для кошачьего лотка в упаковке 8 л',
      ['Комкующийся наполнитель', 'Без ароматизаторов', 'Упаковка 8 л'])]
  }
];
