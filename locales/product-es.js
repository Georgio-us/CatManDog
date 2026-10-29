import { catalogProducts } from '../data.js';

// Catalogue names keep registered brand/line names. Descriptions below are
// original Spanish copy based on the facts already present in each product.
const copy = {
  'rc-sterilised': [null, 'Pienso completo para gatos esterilizados adultos de 1 a 7 años. Su contenido de grasa adaptado ayuda a controlar el peso.'],
  'leonardo-poultry': [null, 'Pienso sin cereales con ave para gatos adultos. La receta utiliza amaranto en lugar de cereales.'],
  'hills-ster': [null, 'Pienso completo con pollo para gatos esterilizados adultos de 1 a 6 años. Una dieta equilibrada para el día a día.'],
  'acana-grasslands': [null, 'Pienso completo sin cereales para gatos y gatitos. Contiene una elevada proporción de ingredientes de origen animal.'],
  'advance-urinary': [null, 'Pienso dietético completo para gatos adultos. La gama Urinary tiene un contenido moderado de magnesio e ingredientes que acidifican la orina. Consulta con tu veterinario antes de utilizar una dieta veterinaria.'],
  'orijen-original': [null, 'Pienso completo sin cereales para gatos y gatitos, con pollo, pavo y pescado. La receta contiene una elevada proporción de ingredientes de origen animal.'],
  'rc-wet': [null, 'Comida húmeda completa para gatos esterilizados adultos. Bocaditos en salsa para la alimentación diaria.'],
  'leonardo-chicken': [null, 'Comida húmeda completa con pollo y trocitos adicionales de filete. Una receta cárnica en lata para gatos adultos.'],
  'hills-kitten': [null, 'Pienso completo con pollo para gatitos esterilizados. Formulado para la etapa de crecimiento hasta los 12 meses.'],
  'advance-wet': [null, 'Comida húmeda dietética completa con pollo para gatos con trastornos digestivos. Dieta veterinaria en sobre individual.'],
  'rc-kitten': [null, 'Pienso para gatitos esterilizados de 6 a 12 meses. Contenido de grasa adaptado y nutrientes equilibrados para la última etapa del crecimiento.'],
  'leonardo-salmon': [null, 'Pienso sin cereales con salmón para gatos adultos. Un envase pequeño para probar una receta nueva.'],
  'hills-wet': [null, 'Comida húmeda completa con pollo para gatos esterilizados adultos. Bocaditos en salsa en un sobre individual.'],
  'rc-digestive': [null, 'Pienso completo para gatos adultos con digestión sensible. Combina proteínas seleccionadas de fácil digestión y fibra para el día a día.'],
  'leonardo-turkey': [null, 'Comida húmeda completa con pavo y trocitos adicionales de filete. Otra opción de sabor para la alimentación diaria.'],
  'ownat-classic-kitten': [null, 'Pienso para gatitos de 1 a 12 meses. Receta con pollo para la etapa de crecimiento y desarrollo.'],
  'ownat-classic-daily-care': [null, 'Pienso completo para gatos adultos con actividad normal. Receta diaria con pollo y cereales.'],
  'ownat-classic-fish': [null, 'Pienso con pescado fresco para gatos adultos de todas las razas. Contiene cereales y fuentes de ácidos grasos omega 3 y omega 6.'],
  'ownat-classic-light': [null, 'Pienso para gatos adultos que necesitan una dieta con menos grasa. Receta con proteínas e ingredientes vegetales.'],
  'ownat-classic-hairball': [null, 'Pienso con pollo, extracto de malta y fibra vegetal. Formulado para ayudar a controlar la formación de bolas de pelo.'],
  'ownat-classic-sterilized': [null, 'Pienso para gatos esterilizados adultos. Receta con pollo, fibra y una cantidad moderada de grasa.'],
  'ownat-just-adult-chicken': [null, 'Pienso completo sin cereales con pollo para gatos adultos. La receta incluye guisantes, patata y mandioca.'],
  'ownat-just-sterilized': [null, 'Pienso sin cereales para gatos esterilizados. Receta con pollo y contenido reducido de grasa.'],
  'ownat-just-sterilized-fish': [null, 'Pienso sin cereales para gatos esterilizados adultos. Receta con pescado y pollo para la alimentación diaria.'],
  'ownat-author-fresh-oily-fish-poultry': [null, 'Pienso con pescado azul fresco, pollo y pato. Esta receta de la gama Author también contiene arroz, guisantes y manzana.'],
  'ownat-author-sterilized-fresh-chicken': [null, 'Pienso sin cereales para gatos esterilizados. Receta Author con pollo fresco, semillas de chía y calorías moderadas.'],
  'dog-rc-mini-puppy': [null, 'Pienso para cachorros de razas pequeñas.'],
  'dog-rc-mini-adult': [null, 'Pienso para perros adultos de razas pequeñas.'],
  'dog-rc-medium-adult': [null, 'Pienso para perros adultos de razas medianas.'],
  'dog-rc-maxi-adult': [null, 'Pienso para perros adultos de razas grandes.'],
  'dog-rc-mini-digestive': [null, 'Pienso para perros adultos de razas pequeñas con digestión sensible.'],
  'dog-ownat-classic-complet': [null, 'Pienso diario para perros adultos.'],
  'dog-ownat-ultra-medium': [null, 'Pienso Ownat Ultra para perros adultos de razas medianas.'],
  'dog-ownat-just-gf-chicken': [null, 'Pienso sin cereales con pollo para perros adultos.'],
  'dog-ownat-gf-prime': [null, 'Pienso sin cereales con pollo y pavo para perros adultos.'],
  'dog-ownat-author-duck': [null, 'Pienso Ownat Author con pato y pollo para perros adultos.'],
  'dog-ownat-wetline-chicken': [null, 'Comida húmeda con pollo y zanahoria para perros.'],
  'dog-orijen-original': [null, 'Pienso Orijen Original para perros.'],
  'dog-orijen-puppy': [null, 'Pienso Orijen Puppy para cachorros.'],
  'dog-orijen-six-fish': [null, 'Pienso Orijen Six Fish con pescado para perros.'],
  'dog-orijen-small-breed': [null, 'Pienso Orijen Small Breed para perros de razas pequeñas.'],
  'dog-orijen-fit-trim': [null, 'Pienso Orijen Fit & Trim para perros que necesitan controlar el peso.'],
  'dog-nutriplus-adult-chicken': [null, 'Pienso NutriPlus con pollo para perros adultos.'],
  'dog-nutriplus-wet-lamb': [null, 'Comida húmeda NutriPlus con cordero para perros.'],
  'dog-yagu-donut-turquoise': ['Yagu Cuna Donut Antiestrés Turquesa', 'Cama redonda y mullida de color turquesa con base antideslizante.'],
  'yagu-donut-neutral': ['Yagu Cuna Donut Antiestrés', 'Cama redonda de tejido mullido con borde suave y base antideslizante.'],
  'yagu-misi-pana': ['Yagu Cuna Misi Pana Ancha', 'Cama redonda y profunda de pana ancha.'],
  'yagu-donut-pana': ['Yagu Cuna Donut Pana Ancha', 'Cama redonda de pana ancha y tacto suave.'],
  'yagu-beti-prints': ['Yagu Cuna Beti', 'Cama con borde suave disponible en dos estampados discretos.'],
  'yagu-cubo-pana-green': ['Yagu Cubo Compacto Pana Green', 'Refugio compacto y cerrado de pana verde.'],
  'yagu-gulliver-pana-green': ['Yagu Cuna Gulliver Pana Green', 'Cama con paredes suaves de pana verde.'],
  'yagu-kubo-plus-pana': ['Yagu Colchón Kubo Plus Pana Ancha', 'Cama amplia con borde bajo y acolchado de pana ancha.'],
  'yagu-roma-prints': ['Yagu Colchoneta Roma', 'Colchoneta baja para perros en dos estampados discretos.'],
  'yagu-nico-cieza': ['Yagu Colchón Nico Cieza Beige', 'Colchón suave con estampado floral beige y funda extraíble.'],
  'yagu-sorolla-backpack': ['Yagu Mochila Sorolla', 'Mochila transportín de tejido bouclé para viajar con una mascota.'],
  'yagu-navy-louise-bag': ['Yagu Bolso Navy Louise', 'Bolso transportín de tejido gris con cojín interior suave.'],
  'yagu-duvo-balcony-net': ['Duvo+ red para balcones', 'Red transparente para cercar un balcón. Instálala según las instrucciones y revisa las fijaciones.'],
  'dog-yagu-harness-blue': ['Yagu Arnés Confort Acolchado Azul', 'Arnés azul y acolchado para pasear con comodidad.'],
  'dog-mp-sensibowl-slomo': ['MP Comedero Sensibowl Slomo', 'Comedero antideslizante diseñado para que los perros coman más despacio.'],
  'dog-duvo-huggi-rabbit': ['Duvo+ Peluche Huggi Conejo Lila', 'Peluche suave con forma de conejo para perros.'],
  'tc-4e50c58957': ['Churu - atún', 'Premio cremoso Churu de atún. Formato de 4 × 14 g.'],
  'tc-0707caf730': ['Churu - pollo', 'Premio cremoso Churu de pollo. Formato de 4 × 14 g.'],
  'tc-768abf17c2': ['Churu - atún con vieira', 'Premio cremoso Churu de atún con vieira. Formato de 4 × 14 g.'],
  'tc-dc3d6d94c2': ['Churu - pollo con queso', 'Premio cremoso Churu de pollo con queso. Formato de 4 × 14 g.'],
  'tc-713f42fb9a': ['Churu Kitten - pollo', 'Premio cremoso Churu Kitten de pollo. Formato de 4 × 14 g.'],
  'tc-4b391892b7': ['Churu Hairball Control - salmón', 'Premio cremoso Churu Hairball Control de salmón. Formato de 4 × 14 g.'],
  'tc-82b5e1f561': ['Catit Creamy - pollo con cordero', 'Premio cremoso Catit Creamy de pollo con cordero. Formato de 4 × 10 g.'],
  'tc-c4fc3a3e21': ['Catit Creamy - salmón con gambas', 'Premio cremoso Catit Creamy de salmón con gambas. Formato de 4 × 10 g.'],
  'tc-84ace3f3f7': ['GimCat Malt-Soft Extra', 'Pasta de malta GimCat Malt-Soft Extra. Formato de 20 g.'],
  'tc-0e0e3831a6': ['Catit Creamy - surtido', 'Surtido de premios cremosos Catit Creamy. Formato de 15 × 10 g.'],
  'tc-24dd160a68': ['Vitakraft Liquid Snack - pollo con taurina', 'Premio líquido de pollo con taurina. Formato de 6 × 15 g.'],
  'tc-b5a74b28d5': ['Beaphar - pasta de malta', 'Pasta de malta Beaphar. Formato de 100 g.'],
  'tc-636d6973f1': ['Vetoquinol Bezopet', 'Pasta Vetoquinol Bezopet. Formato de 120 g.'],
  'tc-629d7d8db7': ['GimCat Nutri Malt Bites', 'Premios GimCat Nutri Malt Bites. Formato de 40 g.'],
  'tc-0c0460f2f4': ['Pro Plan Skin & Coat+ - aceite de salmón', 'Aceite de salmón Pro Plan Skin & Coat+. Formato de 150 ml.'],
  'tc-0ed7b07305': ['Churu Bites - pollo', 'Premios Churu Bites de pollo. Formato de 3 × 10 g.'],
  'tc-f617e6e32b': ['Vitakraft Cat Yums - pollo', 'Premios Vitakraft Cat Yums de pollo. Formato de 40 g.'],
  'tc-7934eaf44b': ['Beaphar - aceite de salmón', 'Aceite de salmón Beaphar. Formato de 425 ml.'],
  'tc-06a4db0143': ['Kit Cat FreezeBites - pollo', 'Premios Kit Cat FreezeBites de pollo. Formato de 15 g.'],
  'tc-719843e78f': ['GimCat Nutri Pockets - queso', 'Premios GimCat Nutri Pockets de queso. Formato de 60 g.'],
  'tc-61ec2b29f1': ['Churu Broth - pollo con vieira', 'Caldo Churu Broth de pollo con vieira. Formato de 40 g.'],
  'tc-b121011ccc': ['Applaws - filete de atún', 'Filete de atún Applaws. Formato de 30 g.'],
  'tc-1877f4a340': ['Kit Cat FreezeBites - salmón', 'Premios Kit Cat FreezeBites de salmón. Formato de 15 g.'],
  'tc-db3fbe95f1': ['Churu Stew - pollo', 'Premio Churu Stew de pollo. Formato de 40 g.'],
  'tc-185b159101': ['Dashi Delights - pollo con salmón', 'Dashi Delights de pollo con salmón. Formato de 70 g.'],
  'tc-57f941fe4f': ['Ciao Broth - pollo con atún', 'Caldo Ciao Broth de pollo con atún. Formato de 40 g.'],
  'tc-5da4b0e874': ['Dashi Delights - pollo con copos de bonito', 'Dashi Delights de pollo con copos de bonito. Formato de 70 g.'],
  'tc-0206d66a70': ['Dashi Delights - atún', 'Dashi Delights de atún. Formato de 70 g.'],
  'tc-5477267745': ['GimCat - pasta con taurina', 'Pasta GimCat con taurina. Formato de 50 g.'],
  'tc-157b188bba': ['Pro Plan FortiFlora - probiótico', 'Probiótico Pro Plan FortiFlora. Formato de 30 × 1 g.'],
  'tc-ea417c8cdd': ['PlaqueOff - polvo para el cuidado dental', 'Polvo PlaqueOff para el cuidado dental. Formato de 60 g.'],
  'tc-2b64c192f5': ['Dentalife - snacks dentales de pollo', 'Snacks dentales Dentalife de pollo. Formato de 40 g.'],
  'tc-bfbb53d6d1': ['GimCat - hierba para gatos en bandeja', 'Bandeja GimCat para cultivar hierba para gatos.'],
  'tc-b85b72cc24': ['Beaphar - gel dental', 'Gel dental Beaphar. Formato de 100 g.'],
  'yagu-7500815': ['Duvo+ - hierba para gatos', 'Kit para cultivar hierba para gatos en una bandeja poco profunda. Una pequeña zona verde para tu gato en casa.'],
  'yagu-2170001': ['Sanicat Classic - arena absorbente', 'Arena mineral absorbente a base de sepiolita. Una opción sencilla para la higiene diaria del arenero.'],
  'yagu-2170004': ['Sanicat Clumping - arena aglomerante', 'Arena de bentonita que forma grumos al humedecerse. Facilita la limpieza con pala y la renovación regular del arenero.'],
  'yagu-2170005': ['Sanicat Ultra Gold - arena aglomerante', 'Arena aglomerante de bentonita de la línea Ultra Gold. Un formato compacto para el cuidado diario del arenero.'],
  'yagu-2170014': ['Sanicat Natura Activa - arena vegetal', 'Arena vegetal aglomerante elaborada con derivados reciclados del maíz. Según el catálogo, se presenta en envase de papel y no lleva perfumes añadidos.'],
  'yagu-9235142': ['Moderna Maryloo - arenero abierto', 'Arenero abierto Maryloo con borde blanco extraíble y base de color gris cálido. Facilita el acceso y la limpieza diaria.'],
  'yagu-9235121': ['Moderna Smart Cat - arenero cerrado', 'Arenero cerrado con tapa blanca, base gris cálido y puerta transparente. Un diseño discreto para el hogar.'],
  'yagu-9235036': ['Moderna CatConcept - arenero, cama y rascador', 'Módulo multifunción CatConcept con arenero cerrado, cojín superior para descansar y rascador con juguete.'],
  'yagu-9235123': ['Moderna Handy - pala para arenero', 'Pala gris Handy con ranuras para tamizar la arena. Un accesorio sencillo para limpiar el arenero a diario.'],
  'yagu-9235071': ['Moderna V Scoop - pala para arena', 'Pala V Scoop de gran capacidad con asa superior. Permite retirar los grumos sin tocar directamente el contenido.'],
  'yagu-9235038': ['Moderna Cats in Love - comedero para gatos', 'Comedero bajo con dibujos de gatos y un pequeño corazón violeta. Para una ración de comida o agua fresca.'],
  'yagu-9235044': ['Moderna Luxurious - comedero para gatos', 'Comedero bajo negro con un dibujo dorado. Un detalle discreto para la zona de alimentación.'],
  'yagu-7845778': ['EBI Cascade - fuente para mascotas', 'Fuente compacta Cascade con base blanca y parte superior beige. El agua circula por la superficie superior.'],
  'yagu-7815320': ['EBI Mango / Cascade - filtro de recambio', 'Filtro de carbón para las fuentes EBI Mango y Cascade. Repuesto para los modelos compatibles.'],
  'yagu-7502810': ['Duvo+ Tower - torre rascadora', 'Torre rascadora cilíndrica marrón con compartimentos interiores y plataforma superior mullida. Para descansar y afilarse las uñas cada día.'],
  'yagu-7515812': ['Duvo+ Sole - poste rascador', 'Poste rascador Sole con base redonda y suave y una pelota colgante. En color gris para un ambiente tranquilo.'],
  'yagu-7515817': ['Duvo+ Square - túnel rascador', 'Túnel compacto Square de color beige, con bordes suaves y superficie para rascar. Un pequeño refugio para el gato.'],
  'yagu-7515988': ['Duvo+ - alfombrilla para lamer', 'Alfombrilla lila con forma de gato y superficie en relieve. Para ofrecer una pequeña cantidad de premio húmedo adecuado.'],
  'yagu-7517019': ['Duvo+ - juego de ratones de juguete', 'Dos ratones pequeños para jugar en casa. Se pueden empujar, lanzar y perseguir.'],
  'yagu-7552371': ['Duvo+ - ratón sobre muelle', 'Ratón de juguete sobre un soporte flexible con base cuadrada marrón. Se mueve al tocarlo con la pata.'],
  'yagu-7517046': ['Duvo+ - caña de yute y plumas', 'Caña con mango de madera, cuerda, pieza de yute y plumas para jugar juntos.'],
  'yagu-7514634': ['Duvo+ Eco Hongo - caña para gatos', 'Caña de la línea Eco con mango de madera y juguete textil Hongo colgante en tonos azul grisáceo.'],
  'yagu-7514629': ['Duvo+ Eco - pez de juguete', 'Pequeño pez textil gris y azul para que el gato lo persiga y lo atrape con las patas.'],
  'yagu-7514626': ['Duvo+ Eco - ratón de juguete', 'Ratón textil gris y azul con una cola larga. Un juguete compacto para cada día.'],
  'heybopet-faucet-fountain': ['Heybo Pet - fuente con grifo', 'Fuente de acero con grifo curvado e indicador azul del nivel de agua.'],
  'heybopet-induction-fountain': ['Heybo Pet - fuente de inducción cuadrada', 'Fuente cuadrada de acero con alimentación por inducción y filtro de carbón.'],
  'heybopet-app-fountain': ['Heybo Pet - fuente con aplicación', 'Fuente de acero con triple filtración y control del nivel de agua mediante Tuya Smart.'],
  'heybopet-feeder': ['Heybo Pet - comedero automático sin cámara', 'Comedero automático con programación en Tuya Smart y recipiente de acero.'],
  'heybopet-camera-feeder': ['Heybo Pet - comedero automático con cámara', 'Comedero con cámara HD integrada para seguir la alimentación desde la aplicación.'],
  'heybopet-dual-feeder': ['Heybo Pet - comedero automático con dos recipientes', 'Comedero automático que reparte la comida en dos recipientes y se programa desde la aplicación.'],
  'heybopet-open-litter-box': ['Heybo Pet - arenero automático', 'Arenero automático abierto con control mediante Tuya Smart y vaciado con un botón.'],
  'heybopet-hair-removal-litter-box': ['Heybo Pet - arenero cerrado con cepillos', 'Arenero cerrado con cepillos en la entrada y escalón para recoger la arena que salga.'],
  'heybopet-protective-liner': ['Heybo Pet - protector para arenero', 'Protector para el arenero Heybo Pet.'],
  'heybopet-drying-cabinet': ['Heybo Pet - cabina de secado', 'Cabina para secar a la mascota después del aseo.'],
  'heybopet-fresh-food-cooker': ['Heybo Pet - preparador de comida', 'Aparato para triturar, mezclar y cocinar alimentos.'],
  'halloween-bandana': ['Bandana Pumpkin Mood', 'Bandana suave de tono calabaza apagado con un pequeño estampado de temporada. Para una foto breve o para decorar un regalo.'],
  'elf-hat': ['Gorro festivo Little Elf', 'Pequeño gorro suave de color salvia con ribete crema. Para la primera foto de Año Nuevo del gato; puedes dejarlo a su lado sin ponérselo.'],
  'birthday-bandana': ['Bandana Birthday Star', 'Bandana de color crema con pequeñas estrellas verde salvia. Para cumpleaños, aniversarios y otros días que quieras celebrar con tu mascota.'],
  'gift-visit': ['Caja «Una visita con regalo»', '¿Vas a visitar a alguien que vive con un gato? Lleva también un regalo para el pequeño anfitrión: dos juguetes suaves, premios cremosos y una tarjeta en una bonita caja.'],
  'gift-season': ['Caja «Una fiesta con patas»', 'Una pequeña fiesta para un gran compañero. Elige Halloween o reserva la caja de Año Nuevo: ambas incluyen un juguete, premios para gatos y un accesorio de temporada para una foto breve.'],
  'gift-personal': ['Caja «Su día especial»', 'Su primer cumpleaños, un año juntos o una fecha importante para vosotros. Prepara una caja a su medida con un juguete, un premio adecuado y, si quieres, un accesorio festivo.']
};

const words = value => String(value || '').replace(/ - в соусе$/, ' - en salsa')
  .replace(/ - соус$/, ' - en salsa').replace(/ - желе$/, ' - en gelatina')
  .replace(/ - паштет$/, ' - paté').replace(/ - мусс$/, ' - mousse');

const text = {};
for (const product of catalogProducts) {
  const translated = copy[product.id];
  if (translated) {
    if (translated[0]) text[product.name] = translated[0];
    text[product.description] = translated[1];
    for (const variant of product.variants || []) {
      if (translated[0] && variant.name === product.name) text[variant.name] = translated[0];
      if (variant.description === product.description) text[variant.description] = translated[1];
    }
  } else if (product.category === 'Корм') {
    const name = words(product.name);
    if (/^Полнорационный сухой корм Royal Canin /u.test(product.description))
      text[product.description] = `Pienso completo ${product.description.slice('Полнорационный сухой корм '.length)}.`;
    else if (/^Влажный корм Royal Canin /u.test(product.description))
      text[product.description] = `Comida húmeda ${words(product.description.slice('Влажный корм '.length))}.`;
    else if (/^Сухой корм для кошек /u.test(product.description))
      text[product.description] = `Pienso seco para gatos ${name}.`;
    else if (/^Влажный корм для кошек /u.test(product.description))
      text[product.description] = `Comida húmeda para gatos ${name}.`;
  }
}

export const esProductText = text;
