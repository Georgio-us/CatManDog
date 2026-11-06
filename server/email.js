export function emailReady() {
  try {
    return !!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM &&
      new URL(process.env.PUBLIC_BASE_URL).protocol === 'https:';
  } catch { return false; }
}

async function sendEmail(to, subject, message, fetcher = fetch) {
  if (!emailReady()) throw new Error('Почтовая отправка не настроена');
  const response = await fetcher('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.RESEND_FROM, to: [to], subject,
      text: message, reply_to: 'support@catmandog.es' }),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Почтовый сервис не принял письмо');
}

export async function notifyServiceRequest(request, fetcher = fetch) {
  const kind = request.kind === 'return' ? 'возврат' : request.kind === 'availability' ? 'поступление товара' : 'вопрос';
  const order = request.orderNumber ? `Заказ: ${request.orderNumber}\n` : '';
  const subject = `Новое обращение CatManDog - ${kind}`;
  const inbox = process.env.SUPPORT_INBOX || 'support@catmandog.es';
  const notifications = await Promise.allSettled([sendEmail(inbox, subject,
    `Новое обращение ${request.id}\nEmail: ${request.email}\n${request.name ? `Имя: ${request.name}\n` : ''}${request.phone ? `Телефон: ${request.phone}\n` : ''}${order}Сообщение:\n${request.message}\n\nОтветьте клиенту из панели управления`, fetcher),
  sendEmail(request.email,
    request.locale === 'es' ? 'Hemos recibido tu consulta - CatManDog'
      : request.locale === 'uk' ? 'Ми отримали ваше звернення - CatManDog'
        : 'Мы получили ваше обращение - CatManDog',
    request.locale === 'es'
      ? `Hola:\n\n${request.kind === 'availability' ? 'Hemos recibido tu solicitud. Te avisaremos cuando podamos ofrecerte este producto.' : `Hemos recibido tu consulta${request.orderNumber ? ` sobre el pedido ${request.orderNumber}` : ''}. Te responderemos a este correo.`}\n\nNúmero de consulta: ${request.id}\n\nCatManDog`
      : request.locale === 'uk'
        ? `Вітаємо! ${request.kind === 'availability' ? 'Ми отримали ваш запит і повідомимо, коли зможемо запропонувати цей товар.' : `Ми отримали ваше звернення${request.orderNumber ? ` щодо замовлення ${request.orderNumber}` : ''} і відповімо на цей email.`}\n\nНомер звернення: ${request.id}\n\nCatManDog`
        : `Здравствуйте! ${request.kind === 'availability' ? 'Мы получили ваш запрос и сообщим, когда сможем предложить этот товар.' : `Мы получили ваше обращение${request.orderNumber ? ` по заказу ${request.orderNumber}` : ''} и ответим на этот email.`}\n\nНомер обращения: ${request.id}\n\nCatManDog`, fetcher)
  ]);
  if (notifications.some(result => result.status === 'rejected'))
    throw new Error('Не удалось отправить одно или несколько писем об обращении');
}

export async function sendServiceReply(to, requestId, message, fetcher = fetch, language = 'ru') {
  const spanish = language === 'es';
  const ukrainian = language === 'uk';
  await sendEmail(to,
    spanish ? `Respuesta de CatManDog a tu consulta ${requestId.slice(0, 8)}`
      : ukrainian ? `Відповідь CatManDog на звернення ${requestId.slice(0, 8)}`
        : `Ответ CatManDog по обращению ${requestId.slice(0, 8)}`,
    spanish ? `Hola:\n\n${message}\n\nSi tienes más preguntas, responde a este correo.\n\nCatManDog`
      : ukrainian ? `Вітаємо!\n\n${message}\n\nЯкщо у вас залишилися запитання, дайте відповідь на цей лист.\n\nCatManDog`
        : `Здравствуйте!\n\n${message}\n\nЕсли у вас остались вопросы, ответьте на это письмо.\n\nCatManDog`, fetcher);
}

export async function sendAccountLink(to, kind, token, fetcher = fetch, language = 'ru', returnTo = '') {
  if (!emailReady()) throw new Error('Почтовая отправка не настроена');
  const base = new URL(process.env.PUBLIC_BASE_URL);
  base.hash = `/account/${kind === 'verify' ? 'verify' : 'reset'}?token=${token}${['pet', 'checkout'].includes(returnTo) ? '&return=' + returnTo : ''}`;
  const url = base.toString();
  const spanish = language === 'es';
  const ukrainian = language === 'uk';
  const title = spanish ? (kind === 'verify' ? 'Confirma tu email - CatManDog' : 'Restablece tu contraseña - CatManDog')
    : ukrainian ? (kind === 'verify' ? 'Підтвердьте email CatManDog' : 'Відновлення пароля CatManDog')
      : (kind === 'verify' ? 'Подтвердите email CatManDog' : 'Восстановление пароля CatManDog');
  const instruction = spanish ? (kind === 'verify' ? 'Confirmar email' : 'Crear una nueva contraseña')
    : ukrainian ? (kind === 'verify' ? 'Підтвердити email' : 'Створити новий пароль')
      : (kind === 'verify' ? 'Подтвердить email' : 'Создать новый пароль');
  const reminder = spanish ? 'Si no solicitaste este mensaje, puedes ignorarlo.'
    : ukrainian ? 'Якщо ви не запитували цей лист, просто не переходьте за посиланням.'
      : 'Если вы не запрашивали это письмо, просто не переходите по ссылке';
  const response = await fetcher('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.RESEND_FROM, to: [to], subject: title,
      html: `<p>${title}</p><p><a href="${url}">${instruction}</a></p><p>${reminder}</p>`,
      text: `${title}\n\n${instruction}: ${url}\n\n${reminder}` }),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Почтовый сервис не принял письмо');
}
