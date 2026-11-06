const copy = {
  ru: { title:'Сообщить о поступлении', intro:'Оставьте контакты, и мы сообщим, когда сможем предложить этот товар',
    name:'Имя', phone:'Телефон', consent:'Согласен на обработку контактов для ответа на этот запрос',
    send:'Отправить запрос', sent:'Запрос получен', thanks:'Мы свяжемся с вами, когда товар станет доступен',
    back:'К товару', error:'Не удалось отправить запрос. Попробуйте ещё раз' },
  es: { title:'Avísame cuando esté disponible', intro:'Déjanos tus datos y te avisaremos cuando podamos ofrecer este producto',
    name:'Nombre', phone:'Teléfono', consent:'Acepto el tratamiento de mis datos para responder a esta solicitud',
    send:'Enviar solicitud', sent:'Solicitud recibida', thanks:'Te avisaremos cuando el producto esté disponible',
    back:'Volver al producto', error:'No se pudo enviar la solicitud. Inténtalo de nuevo' },
  uk: { title:'Повідомити про надходження', intro:'Залиште контакти, і ми повідомимо, коли зможемо запропонувати цей товар',
    name:'Ім’я', phone:'Телефон', consent:'Погоджуюся на обробку контактів для відповіді на цей запит',
    send:'Надіслати запит', sent:'Запит отримано', thanks:'Ми зв’яжемося з вами, коли товар стане доступним',
    back:'До товару', error:'Не вдалося надіслати запит. Спробуйте ще раз' }
};

export function availabilityRequestPage(product, variant, { language = 'ru', escape, icon, defaults = {}, sent = false, error = '' }) {
  const t = copy[language] || copy.ru;
  const privacy = language === 'es' ? '/privacy-es.html' : language === 'uk' ? '/privacy-uk.html' : '/privacy.html';
  const productUrl = `#/product/${encodeURIComponent(product.id)}?variant=${encodeURIComponent(variant.id)}`;
  const image = variant.image?.src || variant.image || product.image?.src || product.image;
  return `<div class="page checkout-page availability-request-page"><a class="rc-flow-back" href="${productUrl}">${icon('arrow')} ${t.back}</a>
    <div class="rc-flow-heading"><h1>${t.title}</h1><p>${t.intro}</p></div>
    <div class="availability-request-product">${typeof image === 'string' && image ? `<img src="${escape(image)}" alt="">` : ''}<div><strong>${escape(product.name)}</strong><span>${escape(variant.label)}</span></div></div>
    ${sent ? `<div class="checkout-preview-notice" role="status">${icon('check')}<div><strong>${t.sent}</strong><p>${t.thanks}</p></div></div>` :
    `<form class="checkout-form availability-request-form" data-availability-request="${escape(variant.id)}"><div class="checkout-fields">
      <label>${t.name}<input name="name" required maxlength="100" autocomplete="name" value="${escape(defaults.name || '')}"></label>
      <label>Email<input name="email" type="email" required maxlength="160" autocomplete="email" value="${escape(defaults.email || '')}"></label>
      <label>${t.phone}<input name="phone" type="tel" required minlength="6" maxlength="24" autocomplete="tel" value="${escape(defaults.phone || '')}"></label>
      <label class="checkout-check checkout-wide"><input name="consent" type="checkbox" required><span>${t.consent} · <a href="${privacy}" target="_blank" rel="noopener noreferrer">${language === 'es' ? 'Privacidad' : language === 'uk' ? 'Конфіденційність' : 'Конфиденциальность'}</a></span></label>
    </div><p class="checkout-error" role="alert">${escape(error)}</p><button class="button" type="submit">${t.send} ${icon('arrow')}</button></form>`}</div>`;
}
