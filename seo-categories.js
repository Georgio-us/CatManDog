// Release category pages once their linked assortment has passed the SEO audit.
export const seoCategories = [
  {
    path: '/catalogo/gatos/pienso-seco', pet: 'cat', group: 'dry-food',
    indexable: true,
    title: 'Pienso seco para gatos',
    description: 'Explora el pienso seco para gatos en CatManDog: formatos, marcas y opciones para distintas etapas de vida',
    intro: 'Compara formatos y características de los alimentos secos para gatos antes de elegir el que mejor encaje con tu compañero'
  },
  {
    path: '/catalogo/gatos/comida-humeda', pet: 'cat', group: 'wet-food',
    indexable: true,
    title: 'Comida húmeda para gatos',
    description: 'Descubre comida húmeda para gatos y compara recetas, formatos y necesidades en CatManDog',
    intro: 'Encuentra distintas recetas y formatos de comida húmeda para gatos y revisa cada opción con calma'
  },
  {
    path: '/catalogo/gatos/premios', pet: 'cat', group: 'treats',
    indexable: true,
    title: 'Premios para gatos',
    description: 'Explora los premios cremosos Churu para gatos y gatitos: pollo, atún y combinaciones con queso o vieira',
    intro: 'Compara los ingredientes de cada sabor Churu y elige entre un tubo, una caja de cuatro o un formato mayor'
  },
  {
    path: '/catalogo/gatos/arena', pet: 'cat', group: 'litter',
    title: 'Arena para gatos',
    description: 'Compara tipos de arena para gatos, materiales y formatos en el catálogo de CatManDog',
    intro: 'Explora materiales y formatos de arena para encontrar una opción cómoda para tu gato y para tu casa'
  },
  {
    path: '/catalogo/gatos/areneros', pet: 'cat', group: 'trays',
    title: 'Areneros para gatos',
    description: 'Explora areneros para gatos: modelos abiertos, cerrados y automáticos en CatManDog',
    intro: 'Compara areneros abiertos, cerrados y automáticos según el espacio y las costumbres de tu gato'
  },
  {
    path: '/catalogo/perros/pienso-seco', pet: 'dog', group: 'dry-food',
    indexable: true,
    title: 'Pienso seco para perros',
    description: 'Compara pienso seco para perros por formato, marca y necesidades en CatManDog',
    intro: 'Explora alimentos secos para perros y compara formatos y necesidades antes de elegir'
  },
  {
    path: '/catalogo/perros/premios', pet: 'dog', group: 'treats',
    indexable: true,
    title: 'Premios para perros',
    description: 'Descubre los premios Churu para perros: tubos cremosos de pollo, atún, salmón o queso y bocaditos con relleno suave',
    intro: 'Compara sabores, ingredientes y formatos de Churu DOG. Hay tubos cremosos de 14 o 20 g y bocaditos blandos en porciones individuales'
  }
];

export const seoCategoryForPath = pathname => seoCategories.find(category => category.path === pathname) || null;
export const seoCategoryPath = (pet, group) => seoCategories.find(category => category.pet === pet && category.group === group)?.path || null;
