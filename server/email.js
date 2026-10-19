export function emailReady() {
  try {
    return !!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM &&
      new URL(process.env.PUBLIC_BASE_URL).protocol === 'https:';
  } catch { return false; }
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
