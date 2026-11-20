const page = location.pathname.match(/^\/(legal|privacy|purchase-terms)(?:-(es|uk))?\.html$/u);
if (page) {
  const [, section, suffix] = page;
  const current = suffix || 'ru';
  let preferred;
  try { preferred = localStorage.getItem('catmandog-language'); } catch { /* Storage may be disabled */ }
  const pathFor = language => `/${section}${language === 'ru' ? '' : `-${language}`}.html`;
  if (['es', 'ru', 'uk'].includes(preferred) && preferred !== current) {
    location.replace(`${pathFor(preferred)}${location.search}${location.hash}`);
  } else {
    const header = document.querySelector('header');
    const nav = document.createElement('nav');
    nav.className = 'legal-language';
    nav.setAttribute('aria-label', { es: 'Idioma del sitio', ru: 'Язык сайта', uk: 'Мова сайту' }[current]);
    for (const [language, label] of [['es', 'Español'], ['ru', 'Русский'], ['uk', 'Українська']]) {
      const link = document.createElement('a');
      link.href = pathFor(language);
      link.lang = language;
      link.textContent = label;
      if (language === current) link.setAttribute('aria-current', 'page');
      link.addEventListener('click', () => {
        try { localStorage.setItem('catmandog-language', language); } catch { /* Storage may be disabled */ }
      });
      nav.append(link);
    }
    header?.insertBefore(nav, header.lastElementChild);
  }
}
