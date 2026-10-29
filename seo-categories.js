// Category pages are prepared for navigation but stay out of the sitemap until
// the assortment, prices and availability are approved for real orders.
export const seoCategories = [
  {
    path: '/catalogo/gatos/pienso-seco', pet: 'cat', group: 'dry-food',
    title: 'Pienso seco para gatos',
    description: 'Explora el pienso seco para gatos en CatManDog: formatos, marcas y opciones para distintas etapas de vida',
    intro: 'Compara formatos y características de los alimentos secos para gatos antes de elegir el que mejor encaje con tu compañero'
  },
  {
    path: '/catalogo/gatos/comida-humeda', pet: 'cat', group: 'wet-food',
    title: 'Comida húmeda para gatos',
    description: 'Descubre comida húmeda para gatos y compara recetas, formatos y necesidades en CatManDog',
    intro: 'Encuentra distintas recetas y formatos de comida húmeda para gatos y revisa cada opción con calma'
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
    title: 'Pienso seco para perros',
    description: 'Compara pienso seco para perros por formato, marca y necesidades en CatManDog',
    intro: 'Explora alimentos secos para perros y compara formatos y necesidades antes de elegir'
  }
];

export const seoCategoryForPath = pathname => seoCategories.find(category => category.path === pathname) || null;
export const seoCategoryPath = (pet, group) => seoCategories.find(category => category.pet === pet && category.group === group)?.path || null;
