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
  const kind = request.kind === 'return' ? 'возврат' : 'вопрос';
  const order = request.orderNumber ? `Заказ: ${request.orderNumber}\n` : '';
  const subject = `Новое обращение CatManDog - ${kind}`;
  const inbox = process.env.SUPPORT_INBOX || 'support@catmandog.es';
  const notifications = await Promise.allSettled([sendEmail(inbox, subject,
    `Новое обращение ${request.id}\nEmail: ${request.email}\n${order}Сообщение:\n${request.message}\n\nОтветьте клиенту из панели управления`, fetcher),
  sendEmail(request.email,
    request.locale === 'es' ? 'Hemos recibido tu consulta - CatManDog' : 'Мы получили ваше обращение - CatManDog',
    request.locale === 'es'
      ? `Hola:\n\nHemos recibido tu consulta${request.orderNumber ? ` sobre el pedido ${request.orderNumber}` : ''}. Te responderemos a este correo.\n\nNúmero de consulta: ${request.id}\n\nCatManDog`
      : `Здравствуйте! Мы получили ваше обращение${request.orderNumber ? ` по заказу ${request.orderNumber}` : ''} и ответим на этот email.\n\nНомер обращения: ${request.id}\n\nCatManDog`, fetcher)
  ]);
  if (notifications.some(result => result.status === 'rejected'))
    throw new Error('Не удалось отправить одно или несколько писем об обращении');
}

export async function sendServiceReply(to, requestId, message, fetcher = fetch) {
  await sendEmail(to, `Ответ CatManDog по обращению ${requestId.slice(0, 8)}`,
    `Здравствуйте!\n\n${message}\n\nЕсли у вас остались вопросы, ответьте на это письмо.\n\nCatManDog`, fetcher);
}

export async function sendAccountLink(to, kind, token, fetcher = fetch, language = 'ru') {
  if (!emailReady()) throw new Error('Почтовая отправка не настроена');
  const base = new URL(process.env.PUBLIC_BASE_URL);
  base.hash = `/account/${kind === 'verify' ? 'verify' : 'reset'}?token=${token}`;
  const url = base.toString();
  const spanish = language === 'es';
  const title = spanish ? (kind === 'verify' ? 'Confirma tu email - CatManDog' : 'Restablece tu contraseña - CatManDog')
    : (kind === 'verify' ? 'Подтвердите email CatManDog' : 'Восстановление пароля CatManDog');
  const instruction = spanish ? (kind === 'verify' ? 'Confirmar email' : 'Crear una nueva contraseña')
    : (kind === 'verify' ? 'Подтвердить email' : 'Создать новый пароль');
  const reminder = spanish ? 'Si no solicitaste este mensaje, puedes ignorarlo.'
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
