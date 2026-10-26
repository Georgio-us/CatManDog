const entries = [
  {
    id: 'home', section: 'Hogar y seguridad', title: 'Un hogar cómodo para todos',
    summary: 'Pequeños cambios para que tu casa resulte cómoda para ti y segura para tu mascota',
    intro: 'Un buen hogar para una mascota rara vez empieza con una gran compra. Suele construirse con recorridos sencillos, lugares tranquilos y la posibilidad de elegir si quiere acercarse o estar sola. Recorre la casa a la altura de un gato o un perro. ¿Puede llegar al agua sin pasar por un pasillo ruidoso? ¿Dónde puede refugiarse si vienen visitas? ¿Qué ventanas quedan a su alcance? Responder a estas preguntas ayuda más que cambiar toda la casa de golpe.',
    sections: [
      { id: 'routes', title: 'Observa sus recorridos habituales', paragraphs: [
        'Fíjate en tu mascota durante un día normal. Un gato puede tener su ruta favorita hasta la ventana, un lugar elevado para dormir y un camino corto desde su cama hasta el agua. Un perro necesita llegar sin obstáculos a su zona de descanso y no tumbarse donde todo el mundo tenga que rodearlo o pasar por encima. Si el comedero está junto a la puerta de entrada y la cama al lado de un aparato ruidoso, los objetos pueden ser buenos, pero estar mal colocados.',
        'No obligues a un animal a usar un lugar solo porque queda bonito. Pon la cama donde ya le gusta descansar y muévela poco a poco si hace falta. Para un gato es especialmente valioso poder subir a un lugar alto o esconderse; para un perro, disponer de un rincón tranquilo donde niños y visitas no lo molesten. Una regla sencilla para toda la familia: cuando la mascota se retira a su sitio, se respeta su descanso.'
      ] },
      { id: 'resources', title: 'Distribuye los recursos importantes', paragraphs: [
        'La comida, el agua, el arenero y el descanso no deberían concentrarse en un rincón pequeño. Es mejor colocar el arenero en un lugar tranquilo y accesible, separado de los comederos. También conviene ofrecer agua donde el gato pueda beber sin sobresaltos; a algunos les resulta más cómodo que el recipiente no esté pegado a la pared. Si conviven varios animales, un único rincón puede generar competencia. Más puntos de agua y lugares de descanso les dan opciones.',
        'No hace falta comprar lo mismo para todas las habitaciones. A veces basta con mover un comedero que ya tienes o despejar el acceso al arenero. Observa no solo si usa un objeto, sino también si puede acercarse con tranquilidad. Un animal puede soportar una incomodidad durante años porque no tiene otra opción. Una buena señal es que llega al agua, la comida y su zona de descanso sin prisas ni necesidad de esquivar a otro animal.'
      ] },
      { id: 'safety', title: 'Revisa los riesgos fáciles de pasar por alto', paragraphs: [
        'Las ventanas abiertas y los balcones requieren una revisión específica. Una mosquitera corriente no equivale a una protección segura para un gato: importan la resistencia del material, la fijación en todo el perímetro y la ausencia de huecos. Las ventanas abatibles también son peligrosas porque el animal puede quedar atrapado en la abertura. Hasta que una solución esté instalada y revisada, no dejes ese acceso abierto sin supervisión. Incluso con una red en el balcón, vigila al gato y asegúrate de que puede volver al interior.',
        'Haz una segunda revisión de los productos de limpieza, los medicamentos, los cables, los hilos y las plantas. Guarda los productos químicos en un armario cerrado, comprueba el acceso a los cables y averigua si cada planta es segura para la especie de tu mascota. Si sospechas que ha ingerido una sustancia peligrosa o parte de un objeto, no esperes a que aparezcan síntomas: contacta con un veterinario. Este artículo no sustituye la atención profesional.'
      ] },
      { id: 'change', title: 'Cambia una cosa cada vez y observa', paragraphs: [
        'Si cambias a la vez los comederos, la arena y la cama, será difícil saber qué le gusta a tu mascota y qué le causa estrés. Empieza por un cambio sencillo, como mover el agua del pasillo a un lugar tranquilo. Dale unos días para acostumbrarse y observa si bebe con más facilidad. Después podrás pasar al siguiente cambio.',
        'Si en casa conviven un gato y un perro, puede ayudar que el gato tenga lugares a los que solo él llegue y que el perro disponga de su propio espacio de descanso. No se trata de separarlos estrictamente, sino de permitirles evitar el contacto cuando lo necesiten. La calidad de un hogar se aprecia menos por la cantidad de objetos que por la calma con la que los animales se mueven, comen, descansan y vuelven a ti.'
      ] }
    ],
    takeaway: { title: 'Qué revisar hoy', items: [
      '¿Tiene cada mascota un lugar tranquilo donde nadie la moleste?',
      '¿Puede llegar al agua y al arenero sin obstáculos ni estrés?',
      '¿Están protegidas las ventanas y el balcón a los que puede acceder?',
      '¿Están guardados los medicamentos, los productos de limpieza y los objetos pequeños peligrosos?'
    ] },
    sources: [
      { label: 'International Cat Care - distribución de recursos en casa', url: 'https://icatcare.org/resources/encouraging-your-cat-to-drink_caregiver_guide.pdf' },
      { label: 'Cats Protection - seguridad en casa y en el balcón', url: 'https://www.cats.org.uk/help-and-advice/caring-for-your-cat/home-and-environment/indoor-cats' },
      { label: 'ASPCA - sustancias domésticas y mascotas', url: 'https://www.aspca.org/pet-care/aspca-poison-control/poisonous-household-products' }
    ]
  },
  {
    id: 'play', section: 'Vida juntos', title: 'Jugar también es cuidar',
    summary: 'Por qué importa jugar juntos y cómo convertir el juego en una parte segura del día',
    intro: 'El juego no consiste en agotar a la mascota a cualquier precio. Le permite moverse, explorar, tomar decisiones y pasar tiempo contigo. Gatos y perros juegan de manera distinta, y tampoco existe una única forma de jugar dentro de cada especie. Un gato sigue fascinado una pluma; otro prefiere esconderse y dar un salto breve. Un perro disfruta tirando de una cuerda; otro se entretiene mucho más buscando un juguete escondido. Antes de comprar nada, observa qué despierta ya su interés.',
    sections: [
      { id: 'cat', title: 'Para el gato importa el desarrollo del juego', paragraphs: [
        'Una caña con plumas resulta más interesante cuando se mueve como una posible presa: aparece, desaparece tras una esquina, se detiene un momento y vuelve a moverse. No hace falta agitarla continuamente delante de su cara. Dale tiempo para observar, acechar, saltar y atraparla. Si nunca puede coger la presa, el interés puede convertirse en frustración.',
        'Las sesiones cortas también cuentan. Unos minutos de atención suelen ser más útiles que una larga maratón, sobre todo para un gato mayor o uno que se cansa pronto. Repite lo que funciona, pero cambia el ritmo, el lugar o el juguete. Una caja de cartón puede servir de escondite y una pelota, de excusa para una pequeña persecución. Los juguetes con cuerdas o piezas pequeñas deben usarse bajo supervisión y guardarse después fuera de su alcance.'
      ] },
      { id: 'dog', title: 'Ofrece al perro opciones, no solo carreras', paragraphs: [
        'Jugar con un perro no tiene por qué consistir en lanzarle una pelota sin parar. Puedes esconder un juguete adecuado en una habitación y animarlo a buscarlo, jugar con una cuerda o alternar tareas sencillas con pausas. A muchos perros les gusta precisamente ese ritmo compartido: propones una acción, esperas su respuesta y observas cuándo conviene parar. Elige el tamaño y la resistencia del juguete pensando en ese perro concreto, no solo en su raza.',
        'Para jugar a tirar de una cuerda ayudan unas reglas claras: el juego empieza con una invitación, las manos se mantienen lejos de la boca y cualquiera puede hacer una pausa. Si el perro se excita demasiado, baja el ritmo y ofrece una actividad más tranquila. Revisa después de cada uso los juguetes que suenan o tienen cuerdas o piezas desmontables. Retira los que estén dañados antes de que pueda romperlos y tragarse una parte.'
      ] },
      { id: 'signals', title: 'Presta atención a su respuesta', paragraphs: [
        'Un buen juego permite al animal participar o marcharse. Si el gato aparta la mirada y deja de seguir el juguete, o el perro pierde el interés o busca esconderse, no lo fuerces a continuar. A veces basta con cambiar el ritmo; otras, es mejor terminar y dejarlo descansar. La edad, la salud y sus costumbres también condicionan la actividad. Si tiene dolor o limitaciones de movimiento, consulta con un veterinario qué juegos le convienen.',
        'Jugar con las manos puede parecer cómodo, pero a menudo enseña al cachorro a morder a la persona en lugar de al juguete. Es mejor mantener desde el principio un límite claro: pasar tiempo contigo es divertido, pero la presa o el objeto del que tirar es un juguete. Así el juego resulta agradable para la mascota y para toda la familia.'
      ] },
      { id: 'routine', title: 'Incorpora el juego a la rutina', paragraphs: [
        'Elige un momento que ya se repita cada día: al volver del trabajo, antes del descanso nocturno o entre paseos. Prepara dos o tres juguetes y ofrécelos por turnos en vez de dejarlos siempre en el suelo. Así conservan el interés durante más tiempo. Al empezar bastan unos minutos y toda tu atención, sin teléfono ni otras tareas a la vez.',
        'Después de un momento activo, deja que el juego termine poco a poco. Permite que el gato atrape el juguete o que el perro suelte la cuerda y descanse. No es obligatorio acabar con un premio ni con una compra nueva. Lo valioso es el tiempo compartido: tu mascota sabe que durante el día habrá un momento solo para ella.'
      ] }
    ],
    takeaway: { title: 'Una comprobación rápida antes de jugar', items: [
      '¿Tiene el juguete el tamaño y el estado adecuados para tu mascota?',
      '¿Puede atraparlo o hacer una pausa cuando quiera?',
      '¿Has guardado después las cuerdas y los juguetes con piezas pequeñas?',
      '¿Le quedan ganas de volver a jugar mañana?'
    ] },
    sources: [
      { label: 'Cats Protection - cómo jugar con un gato', url: 'https://www.cats.org.uk/help-and-advice/cat-behaviour/cats-and-play' },
      { label: 'Blue Cross - juguetes y seguridad para perros', url: 'https://www.bluecross.org.uk/advice/dog/behaviour-and-training/five-best-puppy-and-dog-toys' }
    ]
  },
  {
    id: 'travel', section: 'Paseos y viajes', title: 'Viajar con tu compañero',
    summary: 'Cómo preparar el primer viaje con calma: transportín, trayecto, paradas y objetos familiares',
    intro: 'Un viaje empieza mucho antes de salir de casa. Para una persona, un transportín o un coche forman parte de la rutina; para un animal implican sonidos nuevos, movimiento y menos control sobre el entorno. Por eso lo primero es preguntarse si de verdad necesita acompañarte. Para muchos gatos, un desplazamiento innecesario es estresante y quedarse en casa con alguien de confianza puede ser la mejor opción. Si el viaje es necesario, una preparación gradual ayudará: transportín conocido, sujeción segura en el coche y objetos con olor a casa.',
    sections: [
      { id: 'before', title: 'Presenta primero el transportín', paragraphs: [
        'No saques el transportín solo cinco minutos antes de salir. Déjalo abierto en casa, en un lugar donde la mascota pueda acercarse, olerlo y alejarse con calma. Pon dentro una manta conocida. A un gato puedes dejarle ocasionalmente un premio cerca o dentro, sin cerrar la puerta ni empujarlo. Cuando entre por sí mismo y permanezca tranquilo, prueba a cerrar la puerta unos segundos y, más adelante, a levantar el transportín. Da cada paso solo cuando el anterior ya le resulte cómodo.',
        'El transportín debe permitir al gato tumbarse y cambiar de postura, tener ventilación y cerrar de forma segura. Comprueba cierres, asas y base antes de viajar. Para un perro puede servir un transportín u otro sistema de sujeción adecuado, según su tamaño y el vehículo. No pruebes un equipo nuevo por primera vez ya en camino: necesita acostumbrarse antes.'
      ] },
      { id: 'route', title: 'Piensa en todo el trayecto, no solo en el destino', paragraphs: [
        'En un coche, el animal no debe moverse libremente por el habitáculo ni viajar en brazos de un pasajero. Utiliza un sistema de retención adecuado y colócalo donde no moleste al conductor ni se desplace durante la marcha. La DGT española ofrece indicaciones específicas para transportar animales pequeños en transportín. Antes de salir, consulta las recomendaciones actuales según el tamaño de tu mascota y el tipo de vehículo.',
        'Reserva tiempo para subir al coche sin prisas, hacer paradas y afrontar posibles retrasos. Lleva agua, un recipiente, su comida habitual, correa para el perro, bolsas para recoger y una manta. Para el gato conviene llevar un empapador de recambio para el transportín. Si el viaje es largo, localiza con antelación lugares seguros para parar. Nunca dejes al animal solo en un coche aparcado, aunque pienses volver enseguida: la temperatura interior puede cambiar peligrosamente rápido.'
      ] },
      { id: 'bag', title: 'Prepara una bolsa práctica', paragraphs: [
        'Puedes dividir las cosas para el viaje en dos grupos. Ten a mano agua, recipiente, toallitas, bolsas, correa y lo que puedas necesitar en una parada. Guarda aparte comida de reserva, manta y documentos. Para un gato lleva un empapador de recambio y una bolsa para el usado; para un perro, su equipo habitual y lo necesario para recoger durante los paseos. Este orden importa más que una lista larga de compras: cuando necesites agua, no tendrás que buscarla en el fondo de una maleta.',
        'No cambies su alimentación justo antes de viajar ni des por hecho que un premio desconocido lo calmará. Si sigue una dieta veterinaria o toma medicación prescrita, comprueba que tiene suficiente para el trayecto y los primeros días. Guarda el contacto de su veterinario y la dirección de una clínica cerca del destino. Para un viaje largo, consulta cómo organizar las comidas y el agua, especialmente si se ha mareado otras veces.',
        'Con el calor de València, planifica paradas con sombra y acceso a agua. El animal debe poder beber, pero abrir el transportín de un gato en una gasolinera cualquiera puede ser peligroso. Piensa dónde podrás hacerlo en un espacio cerrado o cómo ofrecer agua sin riesgo de fuga. Para un perro, elige una parada donde pueda caminar con correa lejos del tráfico. Guarda a mano la dirección de destino y el teléfono de tu acompañante por si falla la conexión o el navegador.'
      ] },
      { id: 'day', title: 'El día del viaje, mantén una rutina conocida', paragraphs: [
        'Prepara el equipaje con tiempo para evitar prisas de última hora. Antes de salir, revisa el collar o arnés, la identificación y las puertas del transportín. Lleva al gato en el transportín cerrado hasta una habitación segura del destino; abrirlo en un aparcamiento o junto a la carretera entraña riesgos. Si encaja con su rutina, deja que el perro dé un paseo tranquilo antes de subir al coche.',
        'En el coche evita la música alta y los movimientos bruscos. No dirijas el aire acondicionado directamente hacia el animal. Si se marea o lo pasa mal viajando, habla antes con un veterinario; no le des medicación por una recomendación de internet. Para salir de España, comprueba además los requisitos actuales de documentación, identificación y vacunación. En tren o avión, revisa las normas de la compañía concreta.'
      ] },
      { id: 'arrival', title: 'Dale tiempo para adaptarse al llegar', paragraphs: [
        'Al llegar, prepara primero un rincón pequeño y seguro con agua, su manta y la posibilidad de salir del transportín con calma. No dejes que el gato explore inmediatamente todo el alojamiento, sobre todo si aún no has revisado ventanas, puertas y posibles escondites. Permite que decida cuándo salir. Al perro también le viene bien olfatear primero el entorno cercano sin una multitud de personas saludándolo.',
        'Observa cómo se encuentra después del trayecto. Cierta cautela es normal, pero un empeoramiento evidente, dificultad para respirar, vómitos repetidos o debilidad intensa requieren atención veterinaria. Un viaje tranquilo no significa que tenga que alegrarse enseguida por estar en un lugar nuevo. Basta con que esté seguro, reconozca algunos objetos y pueda acostumbrarse a su ritmo.'
      ] }
    ],
    takeaway: { title: 'Antes de salir de casa', items: [
      '¿Conoce ya el transportín o sistema de sujeción y está en buen estado?',
      '¿Llevas agua, su manta y todo lo necesario para el trayecto?',
      '¿Has comprobado la ruta, las paradas y las normas de transporte?',
      '¿Tendrá un espacio seguro para adaptarse al llegar?'
    ] },
    sources: [
      { label: 'Cats Protection - elegir y acostumbrar al gato al transportín', url: 'https://www.cats.org.uk/help-and-advice/getting-a-cat/how-to-choose-and-use-a-cat-carrier' },
      { label: 'DGT - viajar con tu mascota de forma segura', url: 'https://www.dgt.es/muevete-con-seguridad/viaja-seguro/con-tu-mascota/' }
    ]
  }
];

const wordCount = article => [article.title, article.summary, article.intro,
  ...article.sections.flatMap(section => [section.title, ...section.paragraphs]),
  ...article.takeaway.items].join(' ').trim().split(/\s+/u).length;

export const articlesEs = entries.map(article => ({ ...article, wordCount: wordCount(article),
  time: `${Math.max(1, Math.ceil(wordCount(article) / 160))} min de lectura` }));
