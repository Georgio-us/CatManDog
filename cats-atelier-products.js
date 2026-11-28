import { atelierDescription } from './atelier-description.js';
import { atelierSupplierMain } from './atelier-supplier-main.js';

// Cat’s Atelier assortment from supplier export dated 2026-11-18.
// Retail prices mirror supplier public prices; purchase costs remain unknown.
const correctedNames = {
  'SH-W-A60': 'Cat’s Atelier - настенная деревянная полка Arc 60 см',
  'SH-M-A60': 'Cat’s Atelier - настенная металлическая полка Arc 60 см',
  'ST-MB-F': 'Cat’s Atelier - настенная ступенька из МДФ для кошки',
  'ST-WB-F': 'Cat’s Atelier - настенная деревянная ступенька для кошки',
  'SH-M-W95-UL': 'Cat’s Atelier - настенная металлическая полка Wave 95 см, асимметричная, левая',
  'SH-M-W95-UR': 'Cat’s Atelier - настенная металлическая полка Wave 95 см, асимметричная, правая',
  'SH-W-W95-UL': 'Cat’s Atelier - настенная деревянная полка Wave 95 см, асимметричная, левая',
  'SH-W-W95-UR': 'Cat’s Atelier - настенная деревянная полка Wave 95 см, асимметричная, правая',
  'CO-W-A60': 'Cat’s Atelier - чехол матраса для деревянной полки Arc 60 см',
  'CO-W-F60': 'Cat’s Atelier - чехол матраса для деревянной полки Flat 60 см',
  'SH-W-A60-G': 'Cat’s Atelier - оконная деревянная полка Arc 60 см',
  'SH-M-A60-G': 'Cat’s Atelier - оконная металлическая полка Arc 60 см'
};
export const catsAtelierLegacyCopy = new Map();
export const catsAtelierProducts = [
  {
    "id": "cats-atelier-sh-m-da100",
    "name": "Cat’s Atelier - настенная полка Double Arch 100 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 183.0,
    "retailPrice": 183.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для стены",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Настенная полка для отдыха и перемещения кошки по вертикали. Устанавливается на подходящую стену.",
    "details": [
      "Монтаж: стена",
      "Основа: металл",
      "Длина: 100 см",
      "Артикул: SH-M-DA100"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/SH-M-DA100-studio-v2.webp",
      "alt": "Cat’s Atelier - настенная полка Double Arch 100 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/34/cat-shelf-the-double-arch-haven-100-cm-sh-m-da100.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-DA100/637.webp",
        "originalSrc": "https://catsatelier.com/637-thickbox_default/cat-shelf-the-double-arch-haven-100-cm-sh-m-da100.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-DA100/43.webp",
        "originalSrc": "https://catsatelier.com/43-thickbox_default/cat-shelf-the-double-arch-haven-100-cm-sh-m-da100.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-DA100/45.webp",
        "originalSrc": "https://catsatelier.com/45-thickbox_default/cat-shelf-the-double-arch-haven-100-cm-sh-m-da100.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-DA100/46.webp",
        "originalSrc": "https://catsatelier.com/46-thickbox_default/cat-shelf-the-double-arch-haven-100-cm-sh-m-da100.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-DA100/634.webp",
        "originalSrc": "https://catsatelier.com/634-thickbox_default/cat-shelf-the-double-arch-haven-100-cm-sh-m-da100.jpg",
        "reference": true,
        "alt": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        },
        "caption": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        }
      }
    ],
    "manufacturerSku": "SH-M-DA100",
    "ean": "5906546701102",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "SH-M-DA100",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=4"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 183.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 183.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=4"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "wall"
  },
  {
    "id": "cats-atelier-sh-w-a60",
    "name": "Cat’s Atelier - настенная полка Arc 60 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 169.0,
    "retailPrice": 169.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для стены",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Настенная полка для отдыха и перемещения кошки по вертикали. Устанавливается на подходящую стену.",
    "details": [
      "Монтаж: стена",
      "Основа: дерево",
      "Длина: 60 см",
      "Артикул: SH-W-A60"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/SH-W-A60-studio-v2.webp",
      "alt": "Cat’s Atelier - настенная полка Arc 60 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/63/cat-wall-shelf-curvaceous-comfort-60-cm-sh-w-a60.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-A60/638.webp",
        "originalSrc": "https://catsatelier.com/638-thickbox_default/cat-wall-shelf-curvaceous-comfort-60-cm-sh-w-a60.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-A60/559.webp",
        "originalSrc": "https://catsatelier.com/559-thickbox_default/cat-wall-shelf-curvaceous-comfort-60-cm-sh-w-a60.jpg",
        "reference": true,
        "alt": {
          "ru": "Варианты отделки дерева",
          "es": "Acabados de madera",
          "uk": "Варіанти оздоблення дерева"
        },
        "caption": {
          "ru": "Варианты отделки дерева",
          "es": "Acabados de madera",
          "uk": "Варіанти оздоблення дерева"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-A60/633.webp",
        "originalSrc": "https://catsatelier.com/633-thickbox_default/cat-wall-shelf-curvaceous-comfort-60-cm-sh-w-a60.jpg",
        "reference": true,
        "alt": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        },
        "caption": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        }
      }
    ],
    "manufacturerSku": "SH-W-A60",
    "ean": "5906546701027",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "SH-W-A60",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=6"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 169.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 169.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=6"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "wall"
  },
  {
    "id": "cats-atelier-st-mb-f",
    "name": "Cat’s Atelier - настенная ступенька для кошки",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 34.0,
    "retailPrice": 34.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для стены",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Ступенька помогает кошке подниматься к настенным полкам. Подбирайте число и расстояние между ступенями под своего питомца.",
    "details": [
      "Монтаж: стена",
      "Артикул: ST-MB-F"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/ST-MB-F-studio-v3.webp",
      "alt": "Cat’s Atelier - настенная ступенька для кошки",
      "generated": true,
      "originalSrc": "https://catsatelier.com/81/flat-cat-wall-step-st-f1021.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/ST-MB-F/563.webp",
        "originalSrc": "https://catsatelier.com/563-thickbox_default/flat-cat-wall-step-st-f1021.jpg",
        "reference": true,
        "alt": {
          "ru": "Варианты цвета кронштейна",
          "es": "Opciones de color del soporte",
          "uk": "Варіанти кольору кронштейна"
        },
        "caption": {
          "ru": "Варианты цвета кронштейна",
          "es": "Opciones de color del soporte",
          "uk": "Варіанти кольору кронштейна"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/ST-MB-F/564.webp",
        "originalSrc": "https://catsatelier.com/564-thickbox_default/flat-cat-wall-step-st-f1021.jpg",
        "reference": true,
        "alt": {
          "ru": "Варианты ткани",
          "es": "Opciones de tejido",
          "uk": "Варіанти тканини"
        },
        "caption": {
          "ru": "Варианты ткани",
          "es": "Opciones de tejido",
          "uk": "Варіанти тканини"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/ST-MB-F/83.webp",
        "originalSrc": "https://catsatelier.com/83-thickbox_default/flat-cat-wall-step-st-f1021.jpg",
        "reference": true,
        "alt": {
          "ru": "Ступенька и её крепление",
          "es": "Peldaño y su fijación",
          "uk": "Сходинка та її кріплення"
        },
        "caption": {
          "ru": "Ступенька и её крепление",
          "es": "Peldaño y su fijación",
          "uk": "Сходинка та її кріплення"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/ST-MB-F/632.webp",
        "originalSrc": "https://catsatelier.com/632-thickbox_default/flat-cat-wall-step-st-f1021.jpg",
        "reference": true,
        "alt": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        },
        "caption": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        }
      }
    ],
    "manufacturerSku": "ST-MB-F",
    "ean": "5906546701270",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "ST-MB-F",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=7"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 34.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 34.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=7"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "wall"
  },
  {
    "id": "cats-atelier-co-m-60",
    "name": "Cat’s Atelier - чехол матраса для металлической полки 60 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 44.0,
    "retailPrice": 44.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Сменный чехол",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Сменный чехол матраса для совместимой полки Cat’s Atelier. Матрас и полка продаются отдельно.",
    "details": [
      "Только чехол, без матраса и полки",
      "Длина: 60 см",
      "Артикул: CO-M-60"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/CO-shared-studio-v1.webp",
      "alt": "Cat’s Atelier - чехол матраса для металлической полки 60 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/105/extra-mattress-cover-for-metal-base-shelf.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/CO-M-60/106.webp",
        "originalSrc": "https://catsatelier.com/106-thickbox_default/extra-mattress-cover-for-metal-base-shelf.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь съёмного чехла",
          "es": "Detalle de la funda extraíble",
          "uk": "Деталь знімного чохла"
        },
        "caption": {
          "ru": "Деталь съёмного чехла",
          "es": "Detalle de la funda extraíble",
          "uk": "Деталь знімного чохла"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/CO-M-60/658.webp",
        "originalSrc": "https://catsatelier.com/658-thickbox_default/extra-mattress-cover-for-metal-base-shelf.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      }
    ],
    "manufacturerSku": "CO-M-60",
    "ean": "5906546701584",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "CO-M-60",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=20"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 44.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 44.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=20"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "accessory"
  },
  {
    "id": "cats-atelier-sh-m-w95-sl",
    "name": "Cat’s Atelier - настенная полка Wave 95 см, симметричная, левая",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 169.0,
    "retailPrice": 169.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для стены",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Настенная полка для отдыха и перемещения кошки по вертикали. Устанавливается на подходящую стену.",
    "details": [
      "Монтаж: стена",
      "Основа: металл",
      "Длина: 95 см",
      "Артикул: SH-M-W95-SL"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/SH-M-W95-SL-studio-v1.webp",
      "alt": "Cat’s Atelier - настенная полка Wave 95 см, симметричная, левая",
      "generated": true,
      "originalSrc": "https://catsatelier.com/142/metal-base-cat-wall-shelf-wave-95-cm-symmetrical-left-sh-m-w95-sl.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W95-SL/639.webp",
        "originalSrc": "https://catsatelier.com/639-thickbox_default/metal-base-cat-wall-shelf-wave-95-cm-symmetrical-left-sh-m-w95-sl.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W95-SL/147.webp",
        "originalSrc": "https://catsatelier.com/147-thickbox_default/metal-base-cat-wall-shelf-wave-95-cm-symmetrical-left-sh-m-w95-sl.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W95-SL/148.webp",
        "originalSrc": "https://catsatelier.com/148-thickbox_default/metal-base-cat-wall-shelf-wave-95-cm-symmetrical-left-sh-m-w95-sl.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W95-SL/631.webp",
        "originalSrc": "https://catsatelier.com/631-thickbox_default/metal-base-cat-wall-shelf-wave-95-cm-symmetrical-left-sh-m-w95-sl.jpg",
        "reference": true,
        "alt": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        },
        "caption": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        }
      }
    ],
    "manufacturerSku": "SH-M-W95-SL",
    "ean": "5906546701072",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "SH-M-W95-SL",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=24"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 169.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 169.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=24"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "wall"
  },
  {
    "id": "cats-atelier-sh-m-w75-sl",
    "name": "Cat’s Atelier - настенная полка Wave 75 см, симметричная, левая",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 155.0,
    "retailPrice": 155.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для стены",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Настенная полка для отдыха и перемещения кошки по вертикали. Устанавливается на подходящую стену.",
    "details": [
      "Монтаж: стена",
      "Основа: металл",
      "Длина: 75 см",
      "Артикул: SH-M-W75-SL"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/SH-M-W75-SL-studio-v1.webp",
      "alt": "Cat’s Atelier - настенная полка Wave 75 см, симметричная, левая",
      "generated": true,
      "originalSrc": "https://catsatelier.com/149/cat-wall-shelf-playful-curve-left-75-cm-sh-m-w75sl.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W75-SL/640.webp",
        "originalSrc": "https://catsatelier.com/640-thickbox_default/cat-wall-shelf-playful-curve-left-75-cm-sh-m-w75sl.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W75-SL/170.webp",
        "originalSrc": "https://catsatelier.com/170-thickbox_default/cat-wall-shelf-playful-curve-left-75-cm-sh-m-w75sl.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W75-SL/171.webp",
        "originalSrc": "https://catsatelier.com/171-thickbox_default/cat-wall-shelf-playful-curve-left-75-cm-sh-m-w75sl.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W75-SL/630.webp",
        "originalSrc": "https://catsatelier.com/630-thickbox_default/cat-wall-shelf-playful-curve-left-75-cm-sh-m-w75sl.jpg",
        "reference": true,
        "alt": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        },
        "caption": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        }
      }
    ],
    "manufacturerSku": "SH-M-W75-SL",
    "ean": "5906546701232",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "SH-M-W75-SL",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=25"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 155.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 155.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=25"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "wall"
  },
  {
    "id": "cats-atelier-sh-m-w75-ur",
    "name": "Cat’s Atelier - настенная полка Wave 75 см, симметричная, правая",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 155.0,
    "retailPrice": 155.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для стены",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Настенная полка для отдыха и перемещения кошки по вертикали. Устанавливается на подходящую стену.",
    "details": [
      "Монтаж: стена",
      "Основа: металл",
      "Длина: 75 см",
      "Артикул: SH-M-W75-UR"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/SH-M-W75-UR-studio-v1.webp",
      "alt": "Cat’s Atelier - настенная полка Wave 75 см, симметричная, правая",
      "generated": true,
      "originalSrc": "https://catsatelier.com/197/cat-shelf-the-playful-curve-right-75-cm-sh-m-w75ur.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W75-UR/641.webp",
        "originalSrc": "https://catsatelier.com/641-thickbox_default/cat-shelf-the-playful-curve-right-75-cm-sh-m-w75ur.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W75-UR/212.webp",
        "originalSrc": "https://catsatelier.com/212-thickbox_default/cat-shelf-the-playful-curve-right-75-cm-sh-m-w75ur.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W75-UR/213.webp",
        "originalSrc": "https://catsatelier.com/213-thickbox_default/cat-shelf-the-playful-curve-right-75-cm-sh-m-w75ur.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W75-UR/629.webp",
        "originalSrc": "https://catsatelier.com/629-thickbox_default/cat-shelf-the-playful-curve-right-75-cm-sh-m-w75ur.jpg",
        "reference": true,
        "alt": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        },
        "caption": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        }
      }
    ],
    "manufacturerSku": "SH-M-W75-UR",
    "ean": "5906546701294",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "SH-M-W75-UR",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=27"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 155.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 155.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=27"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "wall"
  },
  {
    "id": "cats-atelier-sh-m-w95-ur",
    "name": "Cat’s Atelier - настенная полка Wave 95 см, симметричная, правая",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 169.0,
    "retailPrice": 169.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для стены",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Настенная полка для отдыха и перемещения кошки по вертикали. Устанавливается на подходящую стену.",
    "details": [
      "Монтаж: стена",
      "Основа: металл",
      "Длина: 95 см",
      "Артикул: SH-M-W95-UR"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/SH-M-W95-UR-studio-v1.webp",
      "alt": "Cat’s Atelier - настенная полка Wave 95 см, симметричная, правая",
      "generated": true,
      "originalSrc": "https://catsatelier.com/214/metal-base-cat-wall-shelf-wave-95-cm-unsymmetrical-right-sh-m-w95-ur.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W95-UR/642.webp",
        "originalSrc": "https://catsatelier.com/642-thickbox_default/metal-base-cat-wall-shelf-wave-95-cm-unsymmetrical-right-sh-m-w95-ur.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W95-UR/231.webp",
        "originalSrc": "https://catsatelier.com/231-thickbox_default/metal-base-cat-wall-shelf-wave-95-cm-unsymmetrical-right-sh-m-w95-ur.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W95-UR/232.webp",
        "originalSrc": "https://catsatelier.com/232-thickbox_default/metal-base-cat-wall-shelf-wave-95-cm-unsymmetrical-right-sh-m-w95-ur.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W95-UR/628.webp",
        "originalSrc": "https://catsatelier.com/628-thickbox_default/metal-base-cat-wall-shelf-wave-95-cm-unsymmetrical-right-sh-m-w95-ur.jpg",
        "reference": true,
        "alt": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        },
        "caption": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        }
      }
    ],
    "manufacturerSku": "SH-M-W95-UR",
    "ean": "5906546701010",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "SH-M-W95-UR",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=28"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 169.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 169.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=28"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "wall"
  },
  {
    "id": "cats-atelier-sh-f-60",
    "name": "Cat’s Atelier - настенная полка Flat 60 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 141.0,
    "retailPrice": 141.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для стены",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Настенная полка для отдыха и перемещения кошки по вертикали. Устанавливается на подходящую стену.",
    "details": [
      "Монтаж: стена",
      "Основа: дерево",
      "Длина: 60 см",
      "Артикул: SH-F-60"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/SH-F-60-studio-v1.webp",
      "alt": "Cat’s Atelier - настенная полка Flat 60 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/253/cat-shelf-the-cozy-nook-60-cm-sh-f60.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-F-60/643.webp",
        "originalSrc": "https://catsatelier.com/643-thickbox_default/cat-shelf-the-cozy-nook-60-cm-sh-f60.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-F-60/555.webp",
        "originalSrc": "https://catsatelier.com/555-thickbox_default/cat-shelf-the-cozy-nook-60-cm-sh-f60.jpg",
        "reference": true,
        "alt": {
          "ru": "Варианты отделки дерева",
          "es": "Acabados de madera",
          "uk": "Варіанти оздоблення дерева"
        },
        "caption": {
          "ru": "Варианты отделки дерева",
          "es": "Acabados de madera",
          "uk": "Варіанти оздоблення дерева"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-F-60/257.webp",
        "originalSrc": "https://catsatelier.com/257-thickbox_default/cat-shelf-the-cozy-nook-60-cm-sh-f60.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-F-60/259.webp",
        "originalSrc": "https://catsatelier.com/259-thickbox_default/cat-shelf-the-cozy-nook-60-cm-sh-f60.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-F-60/265.webp",
        "originalSrc": "https://catsatelier.com/265-thickbox_default/cat-shelf-the-cozy-nook-60-cm-sh-f60.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-F-60/266.webp",
        "originalSrc": "https://catsatelier.com/266-thickbox_default/cat-shelf-the-cozy-nook-60-cm-sh-f60.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-F-60/627.webp",
        "originalSrc": "https://catsatelier.com/627-thickbox_default/cat-shelf-the-cozy-nook-60-cm-sh-f60.jpg",
        "reference": true,
        "alt": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        },
        "caption": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        }
      }
    ],
    "manufacturerSku": "SH-F-60",
    "ean": "5906546701089",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "SH-F-60",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=30"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 141.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 141.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=30"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "wall"
  },
  {
    "id": "cats-atelier-sh-w-f75",
    "name": "Cat’s Atelier - настенная полка Flat 75 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 155.0,
    "retailPrice": 155.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для стены",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Настенная полка для отдыха и перемещения кошки по вертикали. Устанавливается на подходящую стену.",
    "details": [
      "Монтаж: стена",
      "Основа: дерево",
      "Длина: 75 см",
      "Артикул: SH-W-F75"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/SH-W-F75-studio-v1.webp",
      "alt": "Cat’s Atelier - настенная полка Flat 75 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/267/cat-shelf-the-cozy-nook-75-cm-sh-f75g.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-F75/644.webp",
        "originalSrc": "https://catsatelier.com/644-thickbox_default/cat-shelf-the-cozy-nook-75-cm-sh-f75g.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-F75/556.webp",
        "originalSrc": "https://catsatelier.com/556-thickbox_default/cat-shelf-the-cozy-nook-75-cm-sh-f75g.jpg",
        "reference": true,
        "alt": {
          "ru": "Варианты отделки дерева",
          "es": "Acabados de madera",
          "uk": "Варіанти оздоблення дерева"
        },
        "caption": {
          "ru": "Варианты отделки дерева",
          "es": "Acabados de madera",
          "uk": "Варіанти оздоблення дерева"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-F75/271.webp",
        "originalSrc": "https://catsatelier.com/271-thickbox_default/cat-shelf-the-cozy-nook-75-cm-sh-f75g.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-F75/273.webp",
        "originalSrc": "https://catsatelier.com/273-thickbox_default/cat-shelf-the-cozy-nook-75-cm-sh-f75g.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-F75/279.webp",
        "originalSrc": "https://catsatelier.com/279-thickbox_default/cat-shelf-the-cozy-nook-75-cm-sh-f75g.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-F75/280.webp",
        "originalSrc": "https://catsatelier.com/280-thickbox_default/cat-shelf-the-cozy-nook-75-cm-sh-f75g.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-F75/626.webp",
        "originalSrc": "https://catsatelier.com/626-thickbox_default/cat-shelf-the-cozy-nook-75-cm-sh-f75g.jpg",
        "reference": true,
        "alt": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        },
        "caption": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        }
      }
    ],
    "manufacturerSku": "SH-W-F75",
    "ean": "5906546701621",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "SH-W-F75",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=31"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 155.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 155.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=31"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "wall"
  },
  {
    "id": "cats-atelier-sh-w-f75-g",
    "name": "Cat’s Atelier - оконная полка Flat 75 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 155.0,
    "retailPrice": 155.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для окна",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Подвесная полка для отдыха кошки у окна. Перед заказом проверьте совместимость крепления с вашей оконной рамой.",
    "details": [
      "Монтаж: окно",
      "Основа: дерево",
      "Длина: 75 см",
      "Артикул: SH-W-F75-G"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/SH-W-F75-G-studio-v6.webp",
      "alt": "Cat’s Atelier - оконная полка Flat 75 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/282/cat-window-shelf-the-sunny-spot-75-cm-sh-w-f75-g.jpg"
    },
    "gallery": [
      {"src":"https://img.catmandog.es/assets/cats-atelier/supplier-sh-w-f75-g/SH-W-F75-G-supplier-557-v1.webp","originalSrc":"https://catsatelier.com/557-thickbox_default/cat-window-shelf-the-sunny-spot-75-cm-sh-w-f75-g.jpg","reference":true,"alt":{"ru":"Четыре варианта отделки дерева","es":"Cuatro acabados de madera","uk":"Чотири варіанти оздоблення дерева"},"caption":{"ru":"Четыре варианта отделки дерева","es":"Cuatro acabados de madera","uk":"Чотири варіанти оздоблення дерева"}},
      {"src":"https://img.catmandog.es/assets/cats-atelier/supplier-sh-w-f75-g/SH-W-F75-G-supplier-286-v1.webp","originalSrc":"https://catsatelier.com/286-thickbox_default/cat-window-shelf-the-sunny-spot-75-cm-sh-w-f75-g.jpg","reference":true,"alt":{"ru":"Съёмный коврик и деревянная основа","es":"Colchoneta extraíble y base de madera","uk":"Знімний килимок і дерев’яна основа"},"caption":{"ru":"Съёмный коврик и деревянная основа","es":"Colchoneta extraíble y base de madera","uk":"Знімний килимок і дерев’яна основа"}},
      {"src":"https://img.catmandog.es/assets/cats-atelier/supplier-sh-w-f75-g/SH-W-F75-G-supplier-287-v1.webp","originalSrc":"https://catsatelier.com/287-thickbox_default/cat-window-shelf-the-sunny-spot-75-cm-sh-w-f75-g.jpg","reference":true,"alt":{"ru":"Крючок на оконной раме","es":"Gancho en el marco de la ventana","uk":"Гачок на віконній рамі"},"caption":{"ru":"Крючок на оконной раме","es":"Gancho en el marco de la ventana","uk":"Гачок на віконній рамі"}},
      {"src":"https://img.catmandog.es/assets/cats-atelier/supplier-sh-w-f75-g/SH-W-F75-G-supplier-288-v1.webp","originalSrc":"https://catsatelier.com/288-thickbox_default/cat-window-shelf-the-sunny-spot-75-cm-sh-w-f75-g.jpg","reference":true,"alt":{"ru":"Присоска полки крупным планом","es":"Primer plano de la ventosa del estante","uk":"Присоска полиці зблизька"},"caption":{"ru":"Присоска полки крупным планом","es":"Primer plano de la ventosa del estante","uk":"Присоска полиці зблизька"}},
      {"src":"https://img.catmandog.es/assets/cats-atelier/supplier-sh-w-f75-g/SH-W-F75-G-supplier-290-v1.webp","originalSrc":"https://catsatelier.com/290-thickbox_default/cat-window-shelf-the-sunny-spot-75-cm-sh-w-f75-g.jpg","reference":true,"alt":{"ru":"Обратная сторона коврика","es":"Reverso de la colchoneta","uk":"Зворотний бік килимка"},"caption":{"ru":"Обратная сторона коврика","es":"Reverso de la colchoneta","uk":"Зворотний бік килимка"}},
      {"src":"https://img.catmandog.es/assets/cats-atelier/supplier-sh-w-f75-g/SH-W-F75-G-supplier-291-v1.webp","originalSrc":"https://catsatelier.com/291-thickbox_default/cat-window-shelf-the-sunny-spot-75-cm-sh-w-f75-g.jpg","reference":true,"alt":{"ru":"Молния съёмного чехла","es":"Cremallera de la funda extraíble","uk":"Блискавка знімного чохла"},"caption":{"ru":"Молния съёмного чехла","es":"Cremallera de la funda extraíble","uk":"Блискавка знімного чохла"}},
      {"src":"https://img.catmandog.es/assets/cats-atelier/supplier-sh-w-f75-g/SH-W-F75-G-supplier-645-v1.webp","originalSrc":"https://catsatelier.com/645-thickbox_default/cat-window-shelf-the-sunny-spot-75-cm-sh-w-f75-g.jpg","reference":true,"alt":{"ru":"Палитра ткани DOT","es":"Paleta del tejido DOT","uk":"Палітра тканини DOT"},"caption":{"ru":"Палитра ткани DOT","es":"Paleta del tejido DOT","uk":"Палітра тканини DOT"}}
    ],
    "configurationType": "atelier-window-shelf-f75-g",
    "manufacturerSku": "SH-W-F75-G",
    "ean": "5906546701454",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "SH-W-F75-G",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=32"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 155.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 155.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=32"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "window"
  },
  {
    "id": "cats-atelier-sh-w-f60-g",
    "name": "Cat’s Atelier - оконная полка 60 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 141.0,
    "retailPrice": 141.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для окна",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Подвесная полка для отдыха кошки у окна. Перед заказом проверьте совместимость крепления с вашей оконной рамой.",
    "details": [
      "Монтаж: окно",
      "Основа: дерево",
      "Длина: 60 см",
      "Артикул: SH-W-F60-G"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/SH-W-F60-G-studio-v4.webp",
      "alt": "Cat’s Atelier - оконная полка 60 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/292/cat-window-shelf-the-sunny-spot-75-cm-sh-f75g.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-F60-G/558.webp",
        "originalSrc": "https://catsatelier.com/558-thickbox_default/cat-window-shelf-the-sunny-spot-75-cm-sh-f75g.jpg",
        "reference": true,
        "alt": {
          "ru": "Варианты отделки дерева",
          "es": "Acabados de madera",
          "uk": "Варіанти оздоблення дерева"
        },
        "caption": {
          "ru": "Варианты отделки дерева",
          "es": "Acabados de madera",
          "uk": "Варіанти оздоблення дерева"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-F60-G/297.webp",
        "originalSrc": "https://catsatelier.com/297-thickbox_default/cat-window-shelf-the-sunny-spot-75-cm-sh-f75g.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-F60-G/298.webp",
        "originalSrc": "https://catsatelier.com/298-thickbox_default/cat-window-shelf-the-sunny-spot-75-cm-sh-f75g.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-F60-G/646.webp",
        "originalSrc": "https://catsatelier.com/646-thickbox_default/cat-window-shelf-the-sunny-spot-75-cm-sh-f75g.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      }
    ],
    "manufacturerSku": "SH-W-F60-G",
    "ean": "5906546701447",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "SH-W-F60-G",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=33"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 141.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 141.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=33"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "window"
  },
  {
    "id": "cats-atelier-sh-m-a60",
    "name": "Cat’s Atelier - настенная полка Arc 60 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 141.0,
    "retailPrice": 141.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для стены",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Настенная полка для отдыха и перемещения кошки по вертикали. Устанавливается на подходящую стену.",
    "details": [
      "Монтаж: стена",
      "Основа: металл",
      "Длина: 60 см",
      "Артикул: SH-M-A60"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/SH-M-A60-studio-v1.webp",
      "alt": "Cat’s Atelier - настенная полка Arc 60 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/300/cat-shelf-the-arcing-haven-60-cm-sh-m-60.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A60/647.webp",
        "originalSrc": "https://catsatelier.com/647-thickbox_default/cat-shelf-the-arcing-haven-60-cm-sh-m-60.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A60/317.webp",
        "originalSrc": "https://catsatelier.com/317-thickbox_default/cat-shelf-the-arcing-haven-60-cm-sh-m-60.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A60/318.webp",
        "originalSrc": "https://catsatelier.com/318-thickbox_default/cat-shelf-the-arcing-haven-60-cm-sh-m-60.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A60/625.webp",
        "originalSrc": "https://catsatelier.com/625-thickbox_default/cat-shelf-the-arcing-haven-60-cm-sh-m-60.jpg",
        "reference": true,
        "alt": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        },
        "caption": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        }
      }
    ],
    "manufacturerSku": "SH-M-A60",
    "ean": "5906546701003",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "SH-M-A60",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=34"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 141.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 141.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=34"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "wall"
  },
  {
    "id": "cats-atelier-sh-m-a75",
    "name": "Cat’s Atelier - настенная полка Arc 75 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 155.0,
    "retailPrice": 155.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для стены",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Настенная полка для отдыха и перемещения кошки по вертикали. Устанавливается на подходящую стену.",
    "details": [
      "Монтаж: стена",
      "Основа: металл",
      "Длина: 75 см",
      "Артикул: SH-M-A75"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/SH-M-A75-studio-v1.webp",
      "alt": "Cat’s Atelier - настенная полка Arc 75 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/319/cat-shelf-the-arcing-haven-75-cm-sh-m-a75-g.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A75/648.webp",
        "originalSrc": "https://catsatelier.com/648-thickbox_default/cat-shelf-the-arcing-haven-75-cm-sh-m-a75-g.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A75/335.webp",
        "originalSrc": "https://catsatelier.com/335-thickbox_default/cat-shelf-the-arcing-haven-75-cm-sh-m-a75-g.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A75/336.webp",
        "originalSrc": "https://catsatelier.com/336-thickbox_default/cat-shelf-the-arcing-haven-75-cm-sh-m-a75-g.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A75/624.webp",
        "originalSrc": "https://catsatelier.com/624-thickbox_default/cat-shelf-the-arcing-haven-75-cm-sh-m-a75-g.jpg",
        "reference": true,
        "alt": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        },
        "caption": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        }
      }
    ],
    "manufacturerSku": "SH-M-A75",
    "ean": "5906546701416",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "SH-M-A75",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=35"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 155.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 155.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=35"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "wall"
  },
  {
    "id": "cats-atelier-sh-m-a75-g",
    "name": "Cat’s Atelier - оконная полка Arc 75 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 155.0,
    "retailPrice": 155.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для окна",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Подвесная полка для отдыха кошки у окна. Перед заказом проверьте совместимость крепления с вашей оконной рамой.",
    "details": [
      "Монтаж: окно",
      "Основа: металл",
      "Длина: 75 см",
      "Артикул: SH-M-A75-G"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/SH-M-A75-G-studio-v4.webp",
      "alt": "Cat’s Atelier - оконная полка Arc 75 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/379/cat-window-shelf-the-arcing-view-60-cm-sh-m-a60.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A75-G/649.webp",
        "originalSrc": "https://catsatelier.com/649-thickbox_default/cat-window-shelf-the-arcing-view-60-cm-sh-m-a60.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A75-G/377.webp",
        "originalSrc": "https://catsatelier.com/377-thickbox_default/cat-window-shelf-the-arcing-view-60-cm-sh-m-a60.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A75-G/378.webp",
        "originalSrc": "https://catsatelier.com/378-thickbox_default/cat-window-shelf-the-arcing-view-60-cm-sh-m-a60.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A75-G/381.webp",
        "originalSrc": "https://catsatelier.com/381-thickbox_default/cat-window-shelf-the-arcing-view-60-cm-sh-m-a60.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A75-G/376.webp",
        "originalSrc": "https://catsatelier.com/376-thickbox_default/cat-window-shelf-the-arcing-view-60-cm-sh-m-a60.jpg",
        "reference": true,
        "alt": {
          "ru": "Полка у окна",
          "es": "Estante junto a la ventana",
          "uk": "Полиця біля вікна"
        },
        "caption": {
          "ru": "Полка у окна",
          "es": "Estante junto a la ventana",
          "uk": "Полиця біля вікна"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A75-G/382.webp",
        "originalSrc": "https://catsatelier.com/382-thickbox_default/cat-window-shelf-the-arcing-view-60-cm-sh-m-a60.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A75-G/623.webp",
        "originalSrc": "https://catsatelier.com/623-thickbox_default/cat-window-shelf-the-arcing-view-60-cm-sh-m-a60.jpg",
        "reference": true,
        "alt": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        },
        "caption": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        }
      }
    ],
    "manufacturerSku": "SH-M-A75-G",
    "ean": "5906546701393",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "SH-M-A75-G",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=38"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 155.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 155.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=38"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "window"
  },
  {
    "id": "cats-atelier-sh-m-w75-sr",
    "name": "Cat’s Atelier - настенная полка Wave 75 см, симметричная, правая",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 155.0,
    "retailPrice": 155.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для стены",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Настенная полка для отдыха и перемещения кошки по вертикали. Устанавливается на подходящую стену.",
    "details": [
      "Монтаж: стена",
      "Основа: металл",
      "Длина: 75 см",
      "Артикул: SH-M-W75-SR"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/SH-M-W75-SR-studio-v1.webp",
      "alt": "Cat’s Atelier - настенная полка Wave 75 см, симметричная, правая",
      "generated": true,
      "originalSrc": "https://catsatelier.com/516/metal-base-cat-wall-shelf-wave-75-cm-symmetrical-right-sh-m-w75sr.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W75-SR/397.webp",
        "originalSrc": "https://catsatelier.com/397-thickbox_default/metal-base-cat-wall-shelf-wave-75-cm-symmetrical-right-sh-m-w75sr.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W75-SR/398.webp",
        "originalSrc": "https://catsatelier.com/398-thickbox_default/metal-base-cat-wall-shelf-wave-75-cm-symmetrical-right-sh-m-w75sr.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W75-SR/650.webp",
        "originalSrc": "https://catsatelier.com/650-thickbox_default/metal-base-cat-wall-shelf-wave-75-cm-symmetrical-right-sh-m-w75sr.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W75-SR/622.webp",
        "originalSrc": "https://catsatelier.com/622-thickbox_default/metal-base-cat-wall-shelf-wave-75-cm-symmetrical-right-sh-m-w75sr.jpg",
        "reference": true,
        "alt": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        },
        "caption": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        }
      }
    ],
    "manufacturerSku": "SH-M-W75-SR",
    "ean": "5906546701171",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "SH-M-W75-SR",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=39"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 155.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 155.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=39"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "wall"
  },
  {
    "id": "cats-atelier-sh-m-w95-ul",
    "name": "Cat’s Atelier - настенная полка Wave 95 см, симметричная, левая",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 169.0,
    "retailPrice": 169.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для стены",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Настенная полка для отдыха и перемещения кошки по вертикали. Устанавливается на подходящую стену.",
    "details": [
      "Монтаж: стена",
      "Основа: металл",
      "Длина: 95 см",
      "Артикул: SH-M-W95-UL"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/SH-M-W95-UL-studio-v1.webp",
      "alt": "Cat’s Atelier - настенная полка Wave 95 см, симметричная, левая",
      "generated": true,
      "originalSrc": "https://catsatelier.com/400/metal-base-cat-wall-shelf-wave-95-cm-unsymmetrical-left-sh-m-w95-ul.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W95-UL/651.webp",
        "originalSrc": "https://catsatelier.com/651-thickbox_default/metal-base-cat-wall-shelf-wave-95-cm-unsymmetrical-left-sh-m-w95-ul.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W95-UL/414.webp",
        "originalSrc": "https://catsatelier.com/414-thickbox_default/metal-base-cat-wall-shelf-wave-95-cm-unsymmetrical-left-sh-m-w95-ul.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W95-UL/415.webp",
        "originalSrc": "https://catsatelier.com/415-thickbox_default/metal-base-cat-wall-shelf-wave-95-cm-unsymmetrical-left-sh-m-w95-ul.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W95-UL/413.webp",
        "originalSrc": "https://catsatelier.com/413-thickbox_default/metal-base-cat-wall-shelf-wave-95-cm-unsymmetrical-left-sh-m-w95-ul.jpg",
        "reference": true,
        "alt": {
          "ru": "Варианты ткани",
          "es": "Opciones de tejido",
          "uk": "Варіанти тканини"
        },
        "caption": {
          "ru": "Варианты ткани",
          "es": "Opciones de tejido",
          "uk": "Варіанти тканини"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W95-UL/621.webp",
        "originalSrc": "https://catsatelier.com/621-thickbox_default/metal-base-cat-wall-shelf-wave-95-cm-unsymmetrical-left-sh-m-w95-ul.jpg",
        "reference": true,
        "alt": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        },
        "caption": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        }
      }
    ],
    "manufacturerSku": "SH-M-W95-UL",
    "ean": "5906546701126",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "SH-M-W95-UL",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=40"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 169.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 169.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=40"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "wall"
  },
  {
    "id": "cats-atelier-sh-m-w75-ul",
    "name": "Cat’s Atelier - настенная полка Wave 75 см, симметричная, левая",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 155.0,
    "retailPrice": 155.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для стены",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Настенная полка для отдыха и перемещения кошки по вертикали. Устанавливается на подходящую стену.",
    "details": [
      "Монтаж: стена",
      "Основа: металл",
      "Длина: 75 см",
      "Артикул: SH-M-W75-UL"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/SH-M-W75-UL-studio-v1.webp",
      "alt": "Cat’s Atelier - настенная полка Wave 75 см, симметричная, левая",
      "generated": true,
      "originalSrc": "https://catsatelier.com/416/metal-base-cat-wall-shelf-wave-75-cm-unsymmetrical-left-sh-m-w75ul.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W75-UL/652.webp",
        "originalSrc": "https://catsatelier.com/652-thickbox_default/metal-base-cat-wall-shelf-wave-75-cm-unsymmetrical-left-sh-m-w75ul.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W75-UL/425.webp",
        "originalSrc": "https://catsatelier.com/425-thickbox_default/metal-base-cat-wall-shelf-wave-75-cm-unsymmetrical-left-sh-m-w75ul.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W75-UL/426.webp",
        "originalSrc": "https://catsatelier.com/426-thickbox_default/metal-base-cat-wall-shelf-wave-75-cm-unsymmetrical-left-sh-m-w75ul.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W75-UL/620.webp",
        "originalSrc": "https://catsatelier.com/620-thickbox_default/metal-base-cat-wall-shelf-wave-75-cm-unsymmetrical-left-sh-m-w75ul.jpg",
        "reference": true,
        "alt": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        },
        "caption": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        }
      }
    ],
    "manufacturerSku": "SH-M-W75-UL",
    "ean": "5906546701034",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "SH-M-W75-UL",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=41"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 155.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 155.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=41"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "wall"
  },
  {
    "id": "cats-atelier-co-w-a60",
    "name": "Cat’s Atelier - чехол матраса для деревянной полки 60 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 53.0,
    "retailPrice": 53.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Сменный чехол",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Сменный чехол матраса для совместимой полки Cat’s Atelier. Матрас и полка продаются отдельно.",
    "details": [
      "Только чехол, без матраса и полки",
      "Длина: 60 см",
      "Артикул: CO-W-A60"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/CO-shared-studio-v1.webp",
      "alt": "Cat’s Atelier - чехол матраса для деревянной полки 60 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/439/extra-mattress-cover-for-wood-base-shelf-60cm.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/CO-W-A60/436.webp",
        "originalSrc": "https://catsatelier.com/436-thickbox_default/extra-mattress-cover-for-wood-base-shelf-60cm.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь съёмного чехла",
          "es": "Detalle de la funda extraíble",
          "uk": "Деталь знімного чохла"
        },
        "caption": {
          "ru": "Деталь съёмного чехла",
          "es": "Detalle de la funda extraíble",
          "uk": "Деталь знімного чохла"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/CO-W-A60/659.webp",
        "originalSrc": "https://catsatelier.com/659-thickbox_default/extra-mattress-cover-for-wood-base-shelf-60cm.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      }
    ],
    "manufacturerSku": "CO-W-A60",
    "ean": "5906546701515",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "CO-W-A60",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=53"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 53.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 53.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=53"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "accessory"
  },
  {
    "id": "cats-atelier-co-w-95",
    "name": "Cat’s Atelier - чехол матраса для деревянной полки 95 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 68.0,
    "retailPrice": 68.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Сменный чехол",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Сменный чехол матраса для совместимой полки Cat’s Atelier. Матрас и полка продаются отдельно.",
    "details": [
      "Только чехол, без матраса и полки",
      "Длина: 95 см",
      "Артикул: CO-W-95"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/CO-shared-studio-v1.webp",
      "alt": "Cat’s Atelier - чехол матраса для деревянной полки 95 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/443/copy-of-extra-mattress-cover-for-wood-base-shelf-95cm.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/CO-W-95/440.webp",
        "originalSrc": "https://catsatelier.com/440-thickbox_default/copy-of-extra-mattress-cover-for-wood-base-shelf-95cm.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь съёмного чехла",
          "es": "Detalle de la funda extraíble",
          "uk": "Деталь знімного чохла"
        },
        "caption": {
          "ru": "Деталь съёмного чехла",
          "es": "Detalle de la funda extraíble",
          "uk": "Деталь знімного чохла"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/CO-W-95/660.webp",
        "originalSrc": "https://catsatelier.com/660-thickbox_default/copy-of-extra-mattress-cover-for-wood-base-shelf-95cm.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      }
    ],
    "manufacturerSku": "CO-W-95",
    "ean": "5906546701508",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "CO-W-95",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=54"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 68.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 68.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=54"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "accessory"
  },
  {
    "id": "cats-atelier-co-m-75",
    "name": "Cat’s Atelier - чехол матраса для металлической полки 75 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 53.0,
    "retailPrice": 53.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Сменный чехол",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Сменный чехол матраса для совместимой полки Cat’s Atelier. Матрас и полка продаются отдельно.",
    "details": [
      "Только чехол, без матраса и полки",
      "Длина: 75 см",
      "Артикул: CO-M-75"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/CO-shared-studio-v1.webp",
      "alt": "Cat’s Atelier - чехол матраса для металлической полки 75 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/446/extra-mattress-cover-for-metal-base-shelf-75cm.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/CO-M-75/444.webp",
        "originalSrc": "https://catsatelier.com/444-thickbox_default/extra-mattress-cover-for-metal-base-shelf-75cm.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь съёмного чехла",
          "es": "Detalle de la funda extraíble",
          "uk": "Деталь знімного чохла"
        },
        "caption": {
          "ru": "Деталь съёмного чехла",
          "es": "Detalle de la funda extraíble",
          "uk": "Деталь знімного чохла"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/CO-M-75/661.webp",
        "originalSrc": "https://catsatelier.com/661-thickbox_default/extra-mattress-cover-for-metal-base-shelf-75cm.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      }
    ],
    "manufacturerSku": "CO-M-75",
    "ean": "5906546701591",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "CO-M-75",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=55"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 53.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 53.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=55"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "accessory"
  },
  {
    "id": "cats-atelier-co-m-95",
    "name": "Cat’s Atelier - чехол матраса для металлической полки 95 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 62.0,
    "retailPrice": 62.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Сменный чехол",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Сменный чехол матраса для совместимой полки Cat’s Atelier. Матрас и полка продаются отдельно.",
    "details": [
      "Только чехол, без матраса и полки",
      "Длина: 95 см",
      "Артикул: CO-M-95"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/CO-shared-studio-v1.webp",
      "alt": "Cat’s Atelier - чехол матраса для металлической полки 95 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/449/extra-mattress-cover-for-metal-base-shelf-95cm.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/CO-M-95/447.webp",
        "originalSrc": "https://catsatelier.com/447-thickbox_default/extra-mattress-cover-for-metal-base-shelf-95cm.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь съёмного чехла",
          "es": "Detalle de la funda extraíble",
          "uk": "Деталь знімного чохла"
        },
        "caption": {
          "ru": "Деталь съёмного чехла",
          "es": "Detalle de la funda extraíble",
          "uk": "Деталь знімного чохла"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/CO-M-95/662.webp",
        "originalSrc": "https://catsatelier.com/662-thickbox_default/extra-mattress-cover-for-metal-base-shelf-95cm.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      }
    ],
    "manufacturerSku": "CO-M-95",
    "ean": "5906546701614",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "CO-M-95",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=56"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 62.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 62.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=56"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "accessory"
  },
  {
    "id": "cats-atelier-co-m-100",
    "name": "Cat’s Atelier - чехол матраса для металлической полки 100 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 66.0,
    "retailPrice": 66.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Сменный чехол",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Сменный чехол матраса для совместимой полки Cat’s Atelier. Матрас и полка продаются отдельно.",
    "details": [
      "Только чехол, без матраса и полки",
      "Длина: 100 см",
      "Артикул: CO-M-100"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/CO-shared-studio-v1.webp",
      "alt": "Cat’s Atelier - чехол матраса для металлической полки 100 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/452/extra-mattress-cover-for-metal-base-shelf-100cm.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/CO-M-100/450.webp",
        "originalSrc": "https://catsatelier.com/450-thickbox_default/extra-mattress-cover-for-metal-base-shelf-100cm.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь съёмного чехла",
          "es": "Detalle de la funda extraíble",
          "uk": "Деталь знімного чохла"
        },
        "caption": {
          "ru": "Деталь съёмного чехла",
          "es": "Detalle de la funda extraíble",
          "uk": "Деталь знімного чохла"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/CO-M-100/663.webp",
        "originalSrc": "https://catsatelier.com/663-thickbox_default/extra-mattress-cover-for-metal-base-shelf-100cm.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      }
    ],
    "manufacturerSku": "CO-M-100",
    "ean": "5906546701607",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "CO-M-100",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=57"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 66.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 66.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=57"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "accessory"
  },
  {
    "id": "cats-atelier-ma-w-60",
    "name": "Cat’s Atelier - матрас для деревянной полки 60 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 65.0,
    "retailPrice": 65.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Сменный матрас",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Сменный матрас для совместимой полки Cat’s Atelier. Полка продаётся отдельно.",
    "details": [
      "Матрас без полки",
      "Длина: 60 см",
      "Артикул: MA-W-60"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/MA-shared-studio-v1.webp",
      "alt": "Cat’s Atelier - матрас для деревянной полки 60 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/455/extra-complete-mattress-for-wood-base-shelf.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/MA-W-60/453.webp",
        "originalSrc": "https://catsatelier.com/453-thickbox_default/extra-complete-mattress-for-wood-base-shelf.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь матраса",
          "es": "Detalle del colchón",
          "uk": "Деталь матраца"
        },
        "caption": {
          "ru": "Деталь матраса",
          "es": "Detalle del colchón",
          "uk": "Деталь матраца"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/MA-W-60/664.webp",
        "originalSrc": "https://catsatelier.com/664-thickbox_default/extra-complete-mattress-for-wood-base-shelf.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      }
    ],
    "manufacturerSku": "MA-W-60",
    "ean": "5906546701539",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "MA-W-60",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=58"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 65.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 65.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=58"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "accessory"
  },
  {
    "id": "cats-atelier-ma-w-95",
    "name": "Cat’s Atelier - матрас для деревянной полки 95 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 81.0,
    "retailPrice": 81.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Сменный матрас",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Сменный матрас для совместимой полки Cat’s Atelier. Полка продаётся отдельно.",
    "details": [
      "Матрас без полки",
      "Длина: 95 см",
      "Артикул: MA-W-95"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/MA-shared-studio-v1.webp",
      "alt": "Cat’s Atelier - матрас для деревянной полки 95 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/458/extra-complete-mattress-for-wood-base-shelf.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/MA-W-95/456.webp",
        "originalSrc": "https://catsatelier.com/456-thickbox_default/extra-complete-mattress-for-wood-base-shelf.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь матраса",
          "es": "Detalle del colchón",
          "uk": "Деталь матраца"
        },
        "caption": {
          "ru": "Деталь матраса",
          "es": "Detalle del colchón",
          "uk": "Деталь матраца"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/MA-W-95/665.webp",
        "originalSrc": "https://catsatelier.com/665-thickbox_default/extra-complete-mattress-for-wood-base-shelf.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      }
    ],
    "manufacturerSku": "MA-W-95",
    "ean": "5906546701522",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "MA-W-95",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=59"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 81.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 81.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=59"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "accessory"
  },
  {
    "id": "cats-atelier-ma-m-60",
    "name": "Cat’s Atelier - матрас для металлической полки 60 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 54.0,
    "retailPrice": 54.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Сменный матрас",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Сменный матрас для совместимой полки Cat’s Atelier. Полка продаётся отдельно.",
    "details": [
      "Матрас без полки",
      "Длина: 60 см",
      "Артикул: MA-M-60"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/MA-shared-studio-v1.webp",
      "alt": "Cat’s Atelier - матрас для металлической полки 60 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/461/extra-complete-mattress-for-metal-base-shelf-60cm.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/MA-M-60/459.webp",
        "originalSrc": "https://catsatelier.com/459-thickbox_default/extra-complete-mattress-for-metal-base-shelf-60cm.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь матраса",
          "es": "Detalle del colchón",
          "uk": "Деталь матраца"
        },
        "caption": {
          "ru": "Деталь матраса",
          "es": "Detalle del colchón",
          "uk": "Деталь матраца"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/MA-M-60/666.webp",
        "originalSrc": "https://catsatelier.com/666-thickbox_default/extra-complete-mattress-for-metal-base-shelf-60cm.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      }
    ],
    "manufacturerSku": "MA-M-60",
    "ean": "5906546701577",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "MA-M-60",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=60"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 54.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 54.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=60"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "accessory"
  },
  {
    "id": "cats-atelier-ma-m-75",
    "name": "Cat’s Atelier - матрас для металлической полки 75 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 65.0,
    "retailPrice": 65.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Сменный матрас",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Сменный матрас для совместимой полки Cat’s Atelier. Полка продаётся отдельно.",
    "details": [
      "Матрас без полки",
      "Длина: 75 см",
      "Артикул: MA-M-75"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/MA-shared-studio-v1.webp",
      "alt": "Cat’s Atelier - матрас для металлической полки 75 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/464/extra-complete-mattress-for-metal-base-shelf-75cm.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/MA-M-75/462.webp",
        "originalSrc": "https://catsatelier.com/462-thickbox_default/extra-complete-mattress-for-metal-base-shelf-75cm.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь матраса",
          "es": "Detalle del colchón",
          "uk": "Деталь матраца"
        },
        "caption": {
          "ru": "Деталь матраса",
          "es": "Detalle del colchón",
          "uk": "Деталь матраца"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/MA-M-75/667.webp",
        "originalSrc": "https://catsatelier.com/667-thickbox_default/extra-complete-mattress-for-metal-base-shelf-75cm.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      }
    ],
    "manufacturerSku": "MA-M-75",
    "ean": "5906546701560",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "MA-M-75",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=61"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 65.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 65.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=61"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "accessory"
  },
  {
    "id": "cats-atelier-ma-m-95",
    "name": "Cat’s Atelier - матрас для металлической полки 95 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 76.0,
    "retailPrice": 76.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Сменный матрас",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Сменный матрас для совместимой полки Cat’s Atelier. Полка продаётся отдельно.",
    "details": [
      "Матрас без полки",
      "Длина: 95 см",
      "Артикул: MA-M-95"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/MA-shared-studio-v1.webp",
      "alt": "Cat’s Atelier - матрас для металлической полки 95 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/467/extra-complete-mattress-for-metal-base-shelf-95cm.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/MA-M-95/465.webp",
        "originalSrc": "https://catsatelier.com/465-thickbox_default/extra-complete-mattress-for-metal-base-shelf-95cm.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь матраса",
          "es": "Detalle del colchón",
          "uk": "Деталь матраца"
        },
        "caption": {
          "ru": "Деталь матраса",
          "es": "Detalle del colchón",
          "uk": "Деталь матраца"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/MA-M-95/668.webp",
        "originalSrc": "https://catsatelier.com/668-thickbox_default/extra-complete-mattress-for-metal-base-shelf-95cm.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      }
    ],
    "manufacturerSku": "MA-M-95",
    "ean": "5906546701553",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "MA-M-95",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=62"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 76.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 76.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=62"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "accessory"
  },
  {
    "id": "cats-atelier-ma-m-100",
    "name": "Cat’s Atelier - матрас для металлической полки 100 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 81.0,
    "retailPrice": 81.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Сменный матрас",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Сменный матрас для совместимой полки Cat’s Atelier. Полка продаётся отдельно.",
    "details": [
      "Матрас без полки",
      "Длина: 100 см",
      "Артикул: MA-M-100"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/MA-shared-studio-v1.webp",
      "alt": "Cat’s Atelier - матрас для металлической полки 100 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/470/extra-complete-mattress-for-metal-base-shelf-100cm.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/MA-M-100/468.webp",
        "originalSrc": "https://catsatelier.com/468-thickbox_default/extra-complete-mattress-for-metal-base-shelf-100cm.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь матраса",
          "es": "Detalle del colchón",
          "uk": "Деталь матраца"
        },
        "caption": {
          "ru": "Деталь матраса",
          "es": "Detalle del colchón",
          "uk": "Деталь матраца"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/MA-M-100/669.webp",
        "originalSrc": "https://catsatelier.com/669-thickbox_default/extra-complete-mattress-for-metal-base-shelf-100cm.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      }
    ],
    "manufacturerSku": "MA-M-100",
    "ean": "5906546701546",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "MA-M-100",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=63"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 81.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 81.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=63"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "accessory"
  },
  {
    "id": "cats-atelier-sh-w-w95-ul",
    "name": "Cat’s Atelier - настенная полка Wave 95 см, симметричная, левая",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 212.0,
    "retailPrice": 212.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для стены",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Настенная полка для отдыха и перемещения кошки по вертикали. Устанавливается на подходящую стену.",
    "details": [
      "Монтаж: стена",
      "Основа: дерево",
      "Длина: 95 см",
      "Артикул: SH-W-W95-UL"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/SH-W-W95-UL-studio-v1.webp",
      "alt": "Cat’s Atelier - настенная полка Wave 95 см, симметричная, левая",
      "generated": true,
      "originalSrc": "https://catsatelier.com/477/polka-scienna-dla-kota-wiszaca-fala-95-cm-nl-sh-w-w95l.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-W95-UL/653.webp",
        "originalSrc": "https://catsatelier.com/653-thickbox_default/polka-scienna-dla-kota-wiszaca-fala-95-cm-nl-sh-w-w95l.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-W95-UL/560.webp",
        "originalSrc": "https://catsatelier.com/560-thickbox_default/polka-scienna-dla-kota-wiszaca-fala-95-cm-nl-sh-w-w95l.jpg",
        "reference": true,
        "alt": {
          "ru": "Варианты отделки дерева",
          "es": "Acabados de madera",
          "uk": "Варіанти оздоблення дерева"
        },
        "caption": {
          "ru": "Варианты отделки дерева",
          "es": "Acabados de madera",
          "uk": "Варіанти оздоблення дерева"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-W95-UL/619.webp",
        "originalSrc": "https://catsatelier.com/619-thickbox_default/polka-scienna-dla-kota-wiszaca-fala-95-cm-nl-sh-w-w95l.jpg",
        "reference": true,
        "alt": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        },
        "caption": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        }
      }
    ],
    "manufacturerSku": "SH-W-W95-UL",
    "ean": "5906546701485",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "SH-W-W95-UL",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=65"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 212.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 212.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=65"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "wall"
  },
  {
    "id": "cats-atelier-sh-w-w95-ur",
    "name": "Cat’s Atelier - настенная полка Wave 95 см, симметричная, правая",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 212.0,
    "retailPrice": 212.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для стены",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Настенная полка для отдыха и перемещения кошки по вертикали. Устанавливается на подходящую стену.",
    "details": [
      "Монтаж: стена",
      "Основа: дерево",
      "Длина: 95 см",
      "Артикул: SH-W-W95-UR"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/SH-W-W95-UR-studio-v1.webp",
      "alt": "Cat’s Atelier - настенная полка Wave 95 см, симметричная, правая",
      "generated": true,
      "originalSrc": "https://catsatelier.com/485/wood-base-cat-wall-shelf-wave-95-cm-unsymmetrical-right.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-W95-UR/654.webp",
        "originalSrc": "https://catsatelier.com/654-thickbox_default/wood-base-cat-wall-shelf-wave-95-cm-unsymmetrical-right.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-W95-UR/561.webp",
        "originalSrc": "https://catsatelier.com/561-thickbox_default/wood-base-cat-wall-shelf-wave-95-cm-unsymmetrical-right.jpg",
        "reference": true,
        "alt": {
          "ru": "Варианты отделки дерева",
          "es": "Acabados de madera",
          "uk": "Варіанти оздоблення дерева"
        },
        "caption": {
          "ru": "Варианты отделки дерева",
          "es": "Acabados de madera",
          "uk": "Варіанти оздоблення дерева"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-W95-UR/618.webp",
        "originalSrc": "https://catsatelier.com/618-thickbox_default/wood-base-cat-wall-shelf-wave-95-cm-unsymmetrical-right.jpg",
        "reference": true,
        "alt": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        },
        "caption": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        }
      }
    ],
    "manufacturerSku": "SH-W-W95-UR",
    "ean": "5906546701478",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "SH-W-W95-UR",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=66"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 212.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 212.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=66"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "wall"
  },
  {
    "id": "cats-atelier-sh-w-a60-g",
    "name": "Cat’s Atelier - оконная полка Arc 60 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 169.0,
    "retailPrice": 169.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для окна",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Подвесная полка для отдыха кошки у окна. Перед заказом проверьте совместимость крепления с вашей оконной рамой.",
    "details": [
      "Монтаж: окно",
      "Основа: дерево",
      "Длина: 60 см",
      "Артикул: SH-W-A60-G"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/SH-W-A60-G-studio-v4.webp",
      "alt": "Cat’s Atelier - оконная полка Arc 60 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/579/cat-window-hammock-bed-swing-the-arcing-view-60cm-sh-w-a60-g.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-A60-G/655.webp",
        "originalSrc": "https://catsatelier.com/655-thickbox_default/cat-window-hammock-bed-swing-the-arcing-view-60cm-sh-w-a60-g.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-A60-G/562.webp",
        "originalSrc": "https://catsatelier.com/562-thickbox_default/cat-window-hammock-bed-swing-the-arcing-view-60cm-sh-w-a60-g.jpg",
        "reference": true,
        "alt": {
          "ru": "Варианты отделки дерева",
          "es": "Acabados de madera",
          "uk": "Варіанти оздоблення дерева"
        },
        "caption": {
          "ru": "Варианты отделки дерева",
          "es": "Acabados de madera",
          "uk": "Варіанти оздоблення дерева"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-A60-G/503.webp",
        "originalSrc": "https://catsatelier.com/503-thickbox_default/cat-window-hammock-bed-swing-the-arcing-view-60cm-sh-w-a60-g.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-W-A60-G/501.webp",
        "originalSrc": "https://catsatelier.com/501-thickbox_default/cat-window-hammock-bed-swing-the-arcing-view-60cm-sh-w-a60-g.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      }
    ],
    "manufacturerSku": "SH-W-A60-G",
    "ean": "5906546701096",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "SH-W-A60-G",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=67"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 169.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 169.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=67"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "window"
  },
  {
    "id": "cats-atelier-sh-m-a60-g",
    "name": "Cat’s Atelier - оконная полка Arc 60 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 141.0,
    "retailPrice": 141.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для окна",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Подвесная полка для отдыха кошки у окна. Перед заказом проверьте совместимость крепления с вашей оконной рамой.",
    "details": [
      "Монтаж: окно",
      "Основа: металл",
      "Длина: 60 см",
      "Артикул: SH-M-A60-G"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/SH-M-A60-G-studio-v4.webp",
      "alt": "Cat’s Atelier - оконная полка Arc 60 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/524/copy-of-cat-window-shelf-the-arcing-view-60-cm-sh-m-a60g.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A60-G/656.webp",
        "originalSrc": "https://catsatelier.com/656-thickbox_default/copy-of-cat-window-shelf-the-arcing-view-60-cm-sh-m-a60g.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A60-G/519.webp",
        "originalSrc": "https://catsatelier.com/519-thickbox_default/copy-of-cat-window-shelf-the-arcing-view-60-cm-sh-m-a60g.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A60-G/520.webp",
        "originalSrc": "https://catsatelier.com/520-thickbox_default/copy-of-cat-window-shelf-the-arcing-view-60-cm-sh-m-a60g.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A60-G/522.webp",
        "originalSrc": "https://catsatelier.com/522-thickbox_default/copy-of-cat-window-shelf-the-arcing-view-60-cm-sh-m-a60g.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A60-G/518.webp",
        "originalSrc": "https://catsatelier.com/518-thickbox_default/copy-of-cat-window-shelf-the-arcing-view-60-cm-sh-m-a60g.jpg",
        "reference": true,
        "alt": {
          "ru": "Полка у окна",
          "es": "Estante junto a la ventana",
          "uk": "Полиця біля вікна"
        },
        "caption": {
          "ru": "Полка у окна",
          "es": "Estante junto a la ventana",
          "uk": "Полиця біля вікна"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A60-G/523.webp",
        "originalSrc": "https://catsatelier.com/523-thickbox_default/copy-of-cat-window-shelf-the-arcing-view-60-cm-sh-m-a60g.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      }
    ],
    "manufacturerSku": "SH-M-A60-G",
    "ean": "5906546701195",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "SH-M-A60-G",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=69"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 141.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 141.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=69"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "window"
  },
  {
    "id": "cats-atelier-sh-m-w95-sp",
    "name": "Cat’s Atelier - настенная полка Wave 95 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 169.0,
    "retailPrice": 169.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для стены",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Настенная полка для отдыха и перемещения кошки по вертикали. Устанавливается на подходящую стену.",
    "details": [
      "Монтаж: стена",
      "Основа: металл",
      "Длина: 95 см",
      "Артикул: SH-M-W95-SP"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/SH-M-W95-SP-studio-v1.webp",
      "alt": "Cat’s Atelier - настенная полка Wave 95 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/553/metal-base-cat-wall-shelf-wave-95-cm-symmetrical-right-sh-m-w95-sr.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W95-SP/657.webp",
        "originalSrc": "https://catsatelier.com/657-thickbox_default/metal-base-cat-wall-shelf-wave-95-cm-symmetrical-right-sh-m-w95-sr.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-W95-SP/617.webp",
        "originalSrc": "https://catsatelier.com/617-thickbox_default/metal-base-cat-wall-shelf-wave-95-cm-symmetrical-right-sh-m-w95-sr.jpg",
        "reference": true,
        "alt": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        },
        "caption": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        }
      }
    ],
    "manufacturerSku": "SH-M-W95-SP",
    "ean": "5906546701126",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "SH-M-W95-SP",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=70"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 169.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 169.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=70"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "wall"
  },
  {
    "id": "cats-atelier-st-wb-f",
    "name": "Cat’s Atelier - настенная ступенька для кошки",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 37.0,
    "retailPrice": 37.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для стены",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Ступенька помогает кошке подниматься к настенным полкам. Подбирайте число и расстояние между ступенями под своего питомца.",
    "details": [
      "Монтаж: стена",
      "Артикул: ST-WB-F"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/ST-WB-F-studio-v1.webp",
      "alt": "Cat’s Atelier - настенная ступенька для кошки",
      "generated": true,
      "originalSrc": "https://catsatelier.com/577/copy-of-flat-cat-wall-step-st-w-f.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/ST-WB-F/577.webp",
        "originalSrc": "https://catsatelier.com/577-thickbox_default/copy-of-flat-cat-wall-step-st-w-f.jpg",
        "reference": true,
        "alt": {
          "ru": "Ступенька и её крепление",
          "es": "Peldaño y su fijación",
          "uk": "Сходинка та її кріплення"
        },
        "caption": {
          "ru": "Ступенька и её крепление",
          "es": "Peldaño y su fijación",
          "uk": "Сходинка та її кріплення"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/ST-WB-F/578.webp",
        "originalSrc": "https://catsatelier.com/578-thickbox_default/copy-of-flat-cat-wall-step-st-w-f.jpg",
        "reference": true,
        "alt": {
          "ru": "Варианты цвета кронштейна",
          "es": "Opciones de color del soporte",
          "uk": "Варіанти кольору кронштейна"
        },
        "caption": {
          "ru": "Варианты цвета кронштейна",
          "es": "Opciones de color del soporte",
          "uk": "Варіанти кольору кронштейна"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/ST-WB-F/575.webp",
        "originalSrc": "https://catsatelier.com/575-thickbox_default/copy-of-flat-cat-wall-step-st-w-f.jpg",
        "reference": true,
        "alt": {
          "ru": "Варианты ткани",
          "es": "Opciones de tejido",
          "uk": "Варіанти тканини"
        },
        "caption": {
          "ru": "Варианты ткани",
          "es": "Opciones de tejido",
          "uk": "Варіанти тканини"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/ST-WB-F/616.webp",
        "originalSrc": "https://catsatelier.com/616-thickbox_default/copy-of-flat-cat-wall-step-st-w-f.jpg",
        "reference": true,
        "alt": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        },
        "caption": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        }
      }
    ],
    "manufacturerSku": "ST-WB-F",
    "ean": "5906546701058",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "ST-WB-F",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=72"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 37.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 37.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=72"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "wall"
  },
  {
    "id": "cats-atelier-rd-st",
    "name": "Cat’s Atelier - круглая ступенька из сизаля",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 38.0,
    "retailPrice": 38.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для стены",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Ступенька помогает кошке подниматься к настенным полкам. Подбирайте число и расстояние между ступенями под своего питомца.",
    "details": [
      "Монтаж: стена",
      "Артикул: RD-ST"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/RD-ST-studio-v1.webp",
      "alt": "Cat’s Atelier - круглая ступенька из сизаля",
      "generated": true,
      "originalSrc": "https://catsatelier.com/598/round-wall-mounted-cat-step.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/RD-ST/585.webp",
        "originalSrc": "https://catsatelier.com/585-thickbox_default/round-wall-mounted-cat-step.jpg",
        "reference": true,
        "alt": {
          "ru": "Ступенька и её крепление",
          "es": "Peldaño y su fijación",
          "uk": "Сходинка та її кріплення"
        },
        "caption": {
          "ru": "Ступенька и её крепление",
          "es": "Peldaño y su fijación",
          "uk": "Сходинка та її кріплення"
        }
      }
    ],
    "manufacturerSku": "RD-ST",
    "ean": "5906546701119",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "RD-ST",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=74"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 38.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 38.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=74"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "wall"
  },
  {
    "id": "cats-atelier-co-w-f60",
    "name": "Cat’s Atelier - чехол матраса для деревянной полки 60 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 52.0,
    "retailPrice": 52.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Сменный чехол",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Сменный чехол матраса для совместимой полки Cat’s Atelier. Матрас и полка продаются отдельно.",
    "details": [
      "Только чехол, без матраса и полки",
      "Длина: 60 см",
      "Артикул: CO-W-F60"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/CO-shared-studio-v1.webp",
      "alt": "Cat’s Atelier - чехол матраса для деревянной полки 60 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/601/extra-mattress-cover-for-wood-base-flat-shelf-60-cm-co-w-f60.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/CO-W-F60/599.webp",
        "originalSrc": "https://catsatelier.com/599-thickbox_default/extra-mattress-cover-for-wood-base-flat-shelf-60-cm-co-w-f60.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь съёмного чехла",
          "es": "Detalle de la funda extraíble",
          "uk": "Деталь знімного чохла"
        },
        "caption": {
          "ru": "Деталь съёмного чехла",
          "es": "Detalle de la funda extraíble",
          "uk": "Деталь знімного чохла"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/CO-W-F60/670.webp",
        "originalSrc": "https://catsatelier.com/670-thickbox_default/extra-mattress-cover-for-wood-base-flat-shelf-60-cm-co-w-f60.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      }
    ],
    "manufacturerSku": "CO-W-F60",
    "ean": "5906546701119",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "CO-W-F60",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=75"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 52.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 52.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=75"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "accessory"
  },
  {
    "id": "cats-atelier-co-w-f75",
    "name": "Cat’s Atelier - чехол матраса для деревянной полки 75 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 60.0,
    "retailPrice": 60.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Сменный чехол",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Сменный чехол матраса для совместимой полки Cat’s Atelier. Матрас и полка продаются отдельно.",
    "details": [
      "Только чехол, без матраса и полки",
      "Длина: 75 см",
      "Артикул: CO-W-F75"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/CO-shared-studio-v1.webp",
      "alt": "Cat’s Atelier - чехол матраса для деревянной полки 75 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/604/extra-mattress-cover-for-wood-base-shelf-75-cm-co-w-f75.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/CO-W-F75/602.webp",
        "originalSrc": "https://catsatelier.com/602-thickbox_default/extra-mattress-cover-for-wood-base-shelf-75-cm-co-w-f75.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь съёмного чехла",
          "es": "Detalle de la funda extraíble",
          "uk": "Деталь знімного чохла"
        },
        "caption": {
          "ru": "Деталь съёмного чехла",
          "es": "Detalle de la funda extraíble",
          "uk": "Деталь знімного чохла"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/CO-W-F75/671.webp",
        "originalSrc": "https://catsatelier.com/671-thickbox_default/extra-mattress-cover-for-wood-base-shelf-75-cm-co-w-f75.jpg",
        "reference": true,
        "alt": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        },
        "caption": {
          "ru": "Палитра ткани DOT",
          "es": "Paleta del tejido DOT",
          "uk": "Палітра тканини DOT"
        }
      }
    ],
    "manufacturerSku": "CO-W-F75",
    "ean": "5906546701133",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "CO-W-F75",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=76"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 60.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 60.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=76"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "accessory"
  },
  {
    "id": "cats-atelier-sh-m-a95",
    "name": "Cat’s Atelier - настенная полка Arc 95 см",
    "brand": "Cat’s Atelier",
    "category": "Окна и балконы",
    "pet": "cat",
    "price": 169.0,
    "retailPrice": 169.0,
    "priceStatus": "temporary",
    "purchasePrice": null,
    "purchasePriceStatus": "pending",
    "availabilityStatus": "source_on_demand",
    "saleStatus": "preorder",
    "isReal": true,
    "isNew": true,
    "tag": "Для стены",
    "line": "Cat’s Atelier",
    "sizes": [
      "1 шт"
    ],
    "optionLabel": "Комплектация",
    "description": "Настенная полка для отдыха и перемещения кошки по вертикали. Устанавливается на подходящую стену.",
    "details": [
      "Монтаж: стена",
      "Основа: металл",
      "Длина: 95 см",
      "Артикул: SH-M-A95"
    ],
    "image": {
      "src": "https://img.catmandog.es/assets/cats-atelier/SH-M-A95-studio-v1.webp",
      "alt": "Cat’s Atelier - настенная полка Arc 95 см",
      "generated": true,
      "originalSrc": "https://catsatelier.com/605/cat-wall-shelf-hanging-arch-95-cm-sh-m-a95.jpg"
    },
    "gallery": [
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A95/606.webp",
        "originalSrc": "https://catsatelier.com/606-thickbox_default/cat-wall-shelf-hanging-arch-95-cm-sh-m-a95.jpg",
        "reference": true,
        "alt": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        },
        "caption": {
          "ru": "Деталь конструкции",
          "es": "Detalle de construcción",
          "uk": "Деталь конструкції"
        }
      },
      {
        "src": "https://img.catmandog.es/assets/cats-atelier/specs/SH-M-A95/615.webp",
        "originalSrc": "https://catsatelier.com/615-thickbox_default/cat-wall-shelf-hanging-arch-95-cm-sh-m-a95.jpg",
        "reference": true,
        "alt": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        },
        "caption": {
          "ru": "Детали крепления",
          "es": "Detalles de fijación",
          "uk": "Деталі кріплення"
        }
      }
    ],
    "manufacturerSku": "SH-M-A95",
    "ean": "5906546701423",
    "supplier": {
      "name": "Cat’s Atelier",
      "sku": "SH-M-A95",
      "url": "https://catsatelier.com/en/index.php?controller=product&id_product=77"
    },
    "pricingBasis": {
      "kind": "exact_retail",
      "amount": 169.0,
      "checkedAt": "2026-11-18",
      "offers": [
        {
          "name": "Cat’s Atelier",
          "amount": 169.0,
          "url": "https://catsatelier.com/en/index.php?controller=product&id_product=77"
        }
      ]
    },
    "madeToOrder": true,
    "supplierLeadTime": "2-3 рабочих дня на изготовление, затем ориентировочно 2-3 рабочих дня на доставку из Польши",
    "productType": "wall"
  }
].map(product => {
  catsAtelierLegacyCopy.set(product.id, {
    name: product.name,
    description: product.description + ' Модель: '
      + product.name.replace('Cat’s Atelier - ', '') + ', артикул '
      + product.manufacturerSku + '.'
  });
  const name = correctedNames[product.manufacturerSku] || (
    /-(UL|UR)$/.test(product.manufacturerSku)
      ? product.name.replace('симметричная', 'асимметричная')
      : product.name
  );
  const corrected = { ...product, name };
  const supplierImage = atelierSupplierMain.get(product.manufacturerSku);
  if (!supplierImage) throw new Error(`Missing Cat's Atelier supplier image: ${product.manufacturerSku}`);
  return {
    ...corrected,
    image: {
      src: supplierImage, originalSrc: product.image.originalSrc, alt: name,
      reference: true, presentation: 'supplier'
    },
    gallery: [
      { ...product.image, alt: name, presentation: 'editorial', hiddenFromGallery: true, caption: {
        ru: 'Студийное фото CatManDog', es: 'Foto de estudio CatManDog', uk: 'Студійне фото CatManDog'
      } },
      ...(product.gallery || [])
    ],
    description: atelierDescription(corrected, 'ru').summary
  };
});
