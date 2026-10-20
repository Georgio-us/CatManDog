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
  sendEmail(request.email, 'Мы получили ваше обращение - CatManDog',
    `Здравствуйте! Мы получили ваше обращение${request.orderNumber ? ` по заказу ${request.orderNumber}` : ''} и ответим на этот email.\n\nНомер обращения: ${request.id}\n\nCatManDog`, fetcher)
  ]);
  if (notifications.some(result => result.status === 'rejected'))
    throw new Error('Не удалось отправить одно или несколько писем об обращении');
}

export async function sendServiceReply(to, requestId, message, fetcher = fetch) {
  await sendEmail(to, `Ответ CatManDog по обращению ${requestId.slice(0, 8)}`,
    `Здравствуйте!\n\n${message}\n\nЕсли у вас остались вопросы, ответьте на это письмо.\n\nCatManDog`, fetcher);
}

export async function sendAccountLink(to, kind, token, fetcher = fetch) {
  if (!emailReady()) throw new Error('Почтовая отправка не настроена');
  const base = new URL(process.env.PUBLIC_BASE_URL);
  base.hash = `/account/${kind === 'verify' ? 'verify' : 'reset'}?token=${token}`;
  const url = base.toString();
  const title = kind === 'verify' ? 'Подтвердите email CatManDog' : 'Восстановление пароля CatManDog';
  const instruction = kind === 'verify' ? 'Подтвердить email' : 'Создать новый пароль';
  const response = await fetcher('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.RESEND_FROM, to: [to], subject: title,
      html: `<p>${title}</p><p><a href="${url}">${instruction}</a></p><p>Если вы не запрашивали это письмо, просто не переходите по ссылке</p>`,
      text: `${title}\n\n${instruction}: ${url}\n\nЕсли вы не запрашивали это письмо, просто не переходите по ссылке` }),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Почтовый сервис не принял письмо');
}
