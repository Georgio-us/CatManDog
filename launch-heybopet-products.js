// The selected HB-PWFS-S30S is distinct from the older HBHD-PWF-SSSB30L.
// Both color photographs use the supplier's exact model as their reference.
const base = '/media/launch-studio-2026-11-05/';

export const launchHeyboPetProducts = [{
  id: 'heybopet-hb-pwfs-s30s',
  name: 'HeyboPet - беспроводной фонтан 3 л',
  brand: 'Heybo Pet',
  category: 'Миски и поилки',
  pet: 'cat',
  isReal: true,
  model: 'HB-PWFS-S30S',
  manufacturerSku: 'HB-PWFS-S30S',
  image: `${base}heybopet-hb-pwfs-s30s-black.webp`,
  description: 'Аккумуляторный фонтан с резервуаром из нержавеющей стали и датчиком движения',
  details: ['Объём 3 л', 'Аккумулятор 4000 мА·ч', 'Режим по датчику движения, по таймеру или непрерывный'],
  optionLabel: 'Цвет',
  defaultVariantId: 'heybopet-hb-pwfs-s30s-black',
  variants: [
    {
      id: 'heybopet-hb-pwfs-s30s-black',
      label: 'Чёрный',
      image: `${base}heybopet-hb-pwfs-s30s-black.webp`,
      price: 54.90,
      priceStatus: 'confirmed',
      availabilityStatus: 'unavailable'
    },
    {
      id: 'heybopet-hb-pwfs-s30s-white',
      label: 'Белый',
      image: `${base}heybopet-hb-pwfs-s30s-white.webp`,
      price: 54.90,
      priceStatus: 'confirmed',
      availabilityStatus: 'unavailable'
    }
  ]
}];
