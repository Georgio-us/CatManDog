// Publish product URLs gradually after their content has been reviewed.
export const seoProducts = [
  {
    id: 'rc-sterilised',
    path: '/producto/royal-canin-sterilised-37',
    categoryPath: '/catalogo/gatos/pienso-seco',
    title: 'Royal Canin Sterilised 37 - pienso seco para gatos',
    description: 'Pienso completo para gatos esterilizados adultos de 1 a 7 años. Compara los formatos de Royal Canin Sterilised 37 en CatManDog.'
  }
];

export const seoProductForPath = pathname => seoProducts.find(product => product.path === pathname) || null;
export const seoProductForId = id => seoProducts.find(product => product.id === id) || null;
export const productHref = id => seoProductForId(id)?.path || `#/product/${encodeURIComponent(id)}`;
