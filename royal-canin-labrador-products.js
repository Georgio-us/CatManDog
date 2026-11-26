const imageBase = 'https://img.catmandog.es/assets/food/editorial';

const families = {
  puppy: {
    source: 'https://www.royalcanin.com/es/dogs/products/retail-products/labrador-retriever-puppy-2491',
    image: 'rc-labrador-puppy-studio-v1.webp', foodType: 'dry'
  },
  adult: {
    source: 'https://www.royalcanin.com/es/dogs/products/retail-products/labrador-retriever-adult-2487',
    image: 'rc-labrador-adult-studio-v1.webp', foodType: 'dry'
  },
  sterilised: {
    source: 'https://www.royalcanin.com/es/dogs/products/retail-products/labrador-retriever-sterilised-3996',
    image: 'rc-labrador-sterilised-studio-v1.webp', foodType: 'dry'
  },
  adult5: {
    source: 'https://www.royalcanin.com/es/dogs/products/retail-products/labrador-retriever-5%2B-1339',
    image: 'rc-labrador-adult5-studio-v1.webp', foodType: 'dry'
  },
  wet: {
    source: 'https://www.royalcanin.com/es/dogs/products/retail-products/labrador-retriever-1259',
    image: 'rc-labrador-wet-studio-v1.webp', foodType: 'wet'
  }
};

// The seven formats are separate catalog products so each has its own stable URL,
// price, inventory identity and search listing. Images may be reused within a formula.
const formats = [
  {
    id: 'rc-labrador-puppy-3kg', family: 'puppy', size: '3 кг', kg: 3,
    name: 'Royal Canin Labrador Retriever Puppy 3 кг', price: 29.79,
    supplierCode: '2491400', ean: '3182550725507', quote: 20.21,
    description: 'Royal Canin Labrador Retriever Puppy 3 кг - сухой полнорационный корм для щенков лабрадора до 15 месяцев. Формула рассчитана на период активного роста; размер и форма гранул адаптированы к челюсти щенка. Фасовка 3 кг удобна, чтобы познакомить питомца с рационом и оценить расход корма.',
    es: 'Royal Canin Labrador Retriever Puppy 3 kg es un pienso completo para cachorros de labrador de hasta 15 meses. La receta se adapta a la etapa de crecimiento y la forma de la croqueta está pensada para su mandíbula. El saco de 3 kg permite probar la alimentación y calcular su consumo.',
    uk: 'Royal Canin Labrador Retriever Puppy 3 кг - повнораціонний сухий корм для цуценят лабрадора віком до 15 місяців. Рецептура розрахована на період активного росту, а форма гранул пристосована до щелепи цуценяти. Фасування 3 кг зручне для знайомства з раціоном і оцінки витрати корму.',
    details: ['Для щенков лабрадора до 15 месяцев', 'Гранулы адаптированы к челюсти щенка', 'Мешок 3 кг'],
    esDetails: ['Para cachorros de labrador de hasta 15 meses', 'Croquetas adaptadas a la mandíbula del cachorro', 'Saco de 3 kg'],
    ukDetails: ['Для цуценят лабрадора віком до 15 місяців', 'Гранули пристосовані до щелепи цуценяти', 'Мішок 3 кг']
  },
  {
    id: 'rc-labrador-puppy-12kg', family: 'puppy', size: '12 кг', kg: 12,
    name: 'Royal Canin Labrador Retriever Puppy 12 кг', price: 77.49,
    supplierCode: '2491800', ean: '3182550725514', quote: 64.67,
    description: 'Royal Canin Labrador Retriever Puppy 12 кг - сухой полнорационный рацион для щенков лабрадора до 15 месяцев. Он разработан с учётом роста крупной породы и содержит гранулы, адаптированные к челюсти щенка. Большой мешок подходит для регулярного кормления; суточную порцию подбирают по возрасту и весу питомца.',
    es: 'Royal Canin Labrador Retriever Puppy 12 kg es un pienso completo para cachorros de labrador de hasta 15 meses. Está formulado para el crecimiento de esta raza grande y sus croquetas se adaptan a la mandíbula del cachorro. El saco grande sirve para la alimentación habitual; ajusta la ración diaria según la edad y el peso.',
    uk: 'Royal Canin Labrador Retriever Puppy 12 кг - повнораціонний сухий корм для цуценят лабрадора віком до 15 місяців. Рецептура враховує ріст великої породи, а гранули пристосовані до щелепи цуценяти. Великий мішок підходить для постійного годування; добову порцію добирають за віком і вагою собаки.',
    details: ['Для щенков лабрадора до 15 месяцев', 'Для регулярного кормления в период роста', 'Мешок 12 кг'],
    esDetails: ['Para cachorros de labrador de hasta 15 meses', 'Para la alimentación habitual durante el crecimiento', 'Saco de 12 kg'],
    ukDetails: ['Для цуценят лабрадора віком до 15 місяців', 'Для щоденного годування в період росту', 'Мішок 12 кг']
  },
  {
    id: 'rc-labrador-adult-3kg', family: 'adult', size: '3 кг', kg: 3,
    name: 'Royal Canin Labrador Retriever Adult 3 кг', price: 28.09,
    supplierCode: '2487400', ean: '3182550715614', quote: 19.05,
    description: 'Royal Canin Labrador Retriever Adult 3 кг - сухой полнорационный корм для лабрадоров старше 15 месяцев. Рецептура учитывает склонность породы к набору веса и помогает поддерживать оптимальную форму при правильном размере порции. Специальная гранула предназначена для челюсти лабрадора; компактный мешок удобен для первой покупки.',
    es: 'Royal Canin Labrador Retriever Adult 3 kg es un pienso completo para labradores mayores de 15 meses. Su fórmula tiene en cuenta la tendencia de la raza a ganar peso y ayuda a mantener su condición corporal con una ración adecuada. La croqueta está adaptada a su mandíbula; el saco pequeño resulta práctico para una primera compra.',
    uk: 'Royal Canin Labrador Retriever Adult 3 кг - повнораціонний сухий корм для лабрадорів віком понад 15 місяців. Рецептура враховує схильність породи до набору ваги й допомагає підтримувати форму за правильної порції. Форма гранул пристосована до щелепи лабрадора; невеликий мішок зручний для першої покупки.',
    details: ['Для лабрадоров старше 15 месяцев', 'Формула для поддержания оптимального веса', 'Мешок 3 кг'],
    esDetails: ['Para labradores mayores de 15 meses', 'Fórmula para mantener el peso adecuado', 'Saco de 3 kg'],
    ukDetails: ['Для лабрадорів віком понад 15 місяців', 'Формула для підтримання належної ваги', 'Мішок 3 кг']
  },
  {
    id: 'rc-labrador-adult-12kg', family: 'adult', size: '12 кг', kg: 12,
    name: 'Royal Canin Labrador Retriever Adult 12 кг', price: 68.99,
    supplierCode: '2487800', ean: '3182550715645', quote: 60,
    description: 'Royal Canin Labrador Retriever Adult 12 кг - сухой полнорационный рацион для взрослых лабрадоров старше 15 месяцев. Формула учитывает особенности породы: контроль массы тела, состояние суставов и кожи. Крупный мешок рассчитан на регулярное кормление; дневную норму следует соотносить с весом и активностью собаки.',
    es: 'Royal Canin Labrador Retriever Adult 12 kg es un pienso completo para labradores adultos de más de 15 meses. La receta tiene en cuenta las necesidades de la raza, incluida la condición corporal, las articulaciones y la piel. El saco grande es adecuado para la alimentación habitual; ajusta la ración al peso y la actividad del perro.',
    uk: 'Royal Canin Labrador Retriever Adult 12 кг - повнораціонний сухий корм для дорослих лабрадорів віком понад 15 місяців. Рецептура враховує особливості породи, зокрема підтримання ваги, суглобів і шкіри. Великий мішок підходить для постійного годування; денну норму добирають за вагою та активністю собаки.',
    details: ['Для лабрадоров старше 15 месяцев', 'Рацион для веса, суставов и кожи', 'Мешок 12 кг'],
    esDetails: ['Para labradores mayores de 15 meses', 'Receta para la condición corporal, las articulaciones y la piel', 'Saco de 12 kg'],
    ukDetails: ['Для лабрадорів віком понад 15 місяців', 'Раціон для ваги, суглобів і шкіри', 'Мішок 12 кг']
  },
  {
    id: 'rc-labrador-sterilised-12kg', family: 'sterilised', size: '12 кг', kg: 12,
    name: 'Royal Canin Labrador Retriever Sterilised 12 кг', price: 68.99,
    supplierCode: '3996800', ean: '3182550787581', quote: 60,
    description: 'Royal Canin Labrador Retriever Sterilised 12 кг - сухой полнорационный корм для стерилизованных лабрадоров старше 15 месяцев. Рецептура отличается от обычной Adult: она разработана для контроля аппетита и веса после стерилизации. Содержание жира снижено, а размер гранул адаптирован к породе; порцию следует подбирать с учётом активности собаки.',
    es: 'Royal Canin Labrador Retriever Sterilised 12 kg es un pienso completo para labradores esterilizados mayores de 15 meses. A diferencia de Adult, la fórmula está pensada para ayudar a controlar el apetito y el peso tras la esterilización. Tiene menos grasa y croquetas adaptadas a la raza; ajusta la ración según la actividad.',
    uk: 'Royal Canin Labrador Retriever Sterilised 12 кг - повнораціонний сухий корм для стерилізованих лабрадорів віком понад 15 місяців. На відміну від звичайного Adult, рецептура призначена для контролю апетиту й ваги після стерилізації. Вміст жиру знижений, а гранули пристосовані до породи; порцію добирають за активністю собаки.',
    details: ['Для стерилизованных лабрадоров старше 15 месяцев', 'Пониженное содержание жира', 'Мешок 12 кг'],
    esDetails: ['Para labradores esterilizados mayores de 15 meses', 'Contenido reducido de grasa', 'Saco de 12 kg'],
    ukDetails: ['Для стерилізованих лабрадорів віком понад 15 місяців', 'Знижений вміст жиру', 'Мішок 12 кг']
  },
  {
    id: 'rc-labrador-adult5-12kg', family: 'adult5', size: '12 кг', kg: 12,
    name: 'Royal Canin Labrador Retriever Adult 5+ 12 кг', price: 89.99,
    supplierCode: '1339800', ean: '3182550908412', quote: 64.20,
    description: 'Royal Canin Labrador Retriever Adult 5+ 12 кг - сухой полнорационный корм для лабрадоров от пяти лет. Эта формула предназначена для зрелого возраста и отличается от обычного Adult адаптированным минеральным составом и комплексом антиоксидантов. Рацион рассчитан на поддержание формы и подвижности; размер порции зависит от веса и активности собаки.',
    es: 'Royal Canin Labrador Retriever Adult 5+ 12 kg es un pienso completo para labradores a partir de los cinco años. Frente a Adult, esta receta para la madurez incorpora un contenido mineral adaptado y un complejo de antioxidantes. Está pensada para mantener la condición corporal y la movilidad; ajusta la ración al peso y la actividad.',
    uk: 'Royal Canin Labrador Retriever Adult 5+ 12 кг - повнораціонний сухий корм для лабрадорів віком від п’яти років. Порівняно зі звичайним Adult, ця рецептура для зрілого віку має адаптований мінеральний склад і комплекс антиоксидантів. Раціон спрямований на підтримання форми й рухливості; порцію добирають за вагою та активністю собаки.',
    details: ['Для лабрадоров от 5 лет', 'Адаптированный минеральный состав и антиоксиданты', 'Мешок 12 кг'],
    esDetails: ['Para labradores a partir de 5 años', 'Minerales adaptados y antioxidantes', 'Saco de 12 kg'],
    ukDetails: ['Для лабрадорів від 5 років', 'Адаптований мінеральний склад і антиоксиданти', 'Мішок 12 кг']
  },
  {
    id: 'rc-labrador-adult-wet-140g', family: 'wet', size: '140 г', kg: 0.14,
    name: 'Royal Canin Labrador Retriever Adult в соусе 140 г', price: 1.78,
    supplierCode: '1259000', quote: 13.90, quoteUnit: 'box-10',
    description: 'Royal Canin Labrador Retriever Adult 140 г - полнорационный влажный корм для взрослых лабрадоров старше 15 месяцев. Мягкие кусочки в соусе можно давать отдельно или сочетать с сухим рационом, соблюдая общую суточную норму. Цена указана за один пауч 140 г, а не за транспортный блок из десяти штук.',
    es: 'Royal Canin Labrador Retriever Adult 140 g es un alimento húmedo completo para labradores mayores de 15 meses. Los trocitos en salsa se pueden servir solos o combinar con pienso seco, respetando la ración diaria total. El precio corresponde a un sobre de 140 g, no a la caja de transporte de diez unidades.',
    uk: 'Royal Canin Labrador Retriever Adult 140 г - повнораціонний вологий корм для дорослих лабрадорів віком понад 15 місяців. М’які шматочки в соусі можна давати окремо або поєднувати із сухим кормом, дотримуючись загальної добової норми. Ціна вказана за один пауч 140 г, а не за транспортний блок із десяти штук.',
    details: ['Для лабрадоров старше 15 месяцев', 'Кусочки в соусе', 'Один пауч 140 г'],
    esDetails: ['Para labradores mayores de 15 meses', 'Trocitos en salsa', 'Un sobre de 140 g'],
    ukDetails: ['Для лабрадорів віком понад 15 місяців', 'Шматочки в соусі', 'Один пауч 140 г']
  }
];

const imageFor = format => ({
  src: `${imageBase}/${families[format.family].image}`,
  presentation: 'editorial', generated: true, alt: format.name
});

export const royalCaninLabradorProducts = formats.map(format => {
  const family = families[format.family];
  const variant = {
    id: format.id, label: format.size, weight: format.size,
    packageWeightKg: format.kg, sizes: [format.size],
    description: format.description, details: format.details,
    price: format.price, priceStatus: 'confirmed',
    retailPrice: { amount: format.price, currency: 'EUR', status: 'confirmed',
      sourceName: 'Решение владельца', checkedAt: '2026-11-26', shippingIncluded: false },
    supplierCode: format.supplierCode,
    ...(format.ean ? { ean: format.ean } : {}),
    image: imageFor(format), saleStatus: 'available',
    availabilityStatus: 'source_on_demand',
    purchasePrice: null, purchasePriceStatus: 'pending',
    purchaseQuote: { amountExVat: format.quote, currency: 'EUR', supplier: 'Royal Canin',
      supplierCode: format.supplierCode, checkedAt: '2026-10-31', taxRatePercent: 10,
      ...(format.quoteUnit ? { unit: format.quoteUnit } : {}) }
  };
  return {
    id: format.id, name: format.name, brand: 'Royal Canin',
    category: 'Корм', pet: 'dog', foodType: family.foodType,
    isReal: true, isNew: true, tag: format.family === 'puppy' ? 'Для щенков' : 'Для лабрадоров',
    description: format.description, details: format.details,
    optionLabel: 'Фасовка', weight: format.size, sizes: [format.size],
    image: imageFor(format),
    imageSource: { name: 'Royal Canin', pageUrl: family.source, url: family.source },
    productSource: { name: 'Royal Canin', url: family.source, kind: 'manufacturer' },
    defaultVariantId: format.id, variants: [variant]
  };
});

export const royalCaninLabradorTranslations = formats.flatMap(format => [
  [format.name, [format.name.replace(' кг', ' kg').replace('в соусе', 'en salsa').replace('140 г', '140 g'),
    format.name.replace('в соусе', 'у соусі')]],
  [format.description, [format.es, format.uk]],
  ...format.details.map((detail, index) => [detail, [format.esDetails[index], format.ukDetails[index]]])
]).concat([
  ['Для лабрадоров', ['Para labradores', 'Для лабрадорів']]
]);
