export const seoPicks = [
  {
    pet: 'cat', path: '/selecciones/gatos',
    title: 'Selección para gatos',
    description: 'Pienso, comida húmeda, premios, fuentes y accesorios para gatos elegidos por CatManDog',
    intro: 'Una selección para empezar por lo que necesita tu gato: alimentación, agua, higiene y juego'
  },
  {
    pet: 'dog', path: '/selecciones/perros',
    title: 'Selección para perros',
    description: 'Pienso para perros adultos y cachorros, premios para masticar y juguetes elegidos por CatManDog',
    intro: 'Alimentación, premios para masticar y objetos para jugar con tu perro'
  }
];

export const seoPickForPath = path => seoPicks.find(page => page.path === path) || null;
export const pickHref = pet => seoPicks.find(page => page.pet === pet)?.path || '/selecciones/gatos';
