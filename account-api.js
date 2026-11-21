import { locale, translate } from './locale.js?v=litter-photos-20261121';

function requestError(message, status) {
  if (status >= 500) return translate('Сервис временно недоступен. Попробуйте ещё раз позже');
  const translated = translate(message || 'Не удалось выполнить запрос. Попробуйте ещё раз');
  return locale() !== 'ru' && translated === message
    ? translate('Не удалось выполнить запрос. Попробуйте ещё раз') : translated;
}

export function createAccountApi(fetcher = fetch) {
  async function request(path, method = 'GET', body) {
    let response;
    try {
      response = await fetcher(path, { method, credentials: 'same-origin',
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body) });
    } catch {
      throw new Error(translate('Не удалось связаться с сервером'));
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(requestError(data.error, response.status)),
      { status: response.status });
    return data;
  }
  return {
    config: () => request('/api/config'),
    me: () => request('/api/auth/me'),
    register: body => request('/api/auth/register', 'POST', { ...body, locale: locale() }),
    login: body => request('/api/auth/login', 'POST', body),
    googleSignIn: credential => request('/api/auth/google', 'POST', { credential }),
    linkGoogle: credential => request('/api/auth/google/link', 'POST', { credential }),
    verify: token => request('/api/auth/verify', 'POST', { token }),
    resendVerification: (email, returnTo = '') => request('/api/auth/resend-verification', 'POST',
      { email, locale: locale(), returnTo }),
    recover: (email, returnTo = '') => request('/api/auth/recover', 'POST',
      { email, locale: locale(), returnTo }),
    reset: (token, password) => request('/api/auth/reset', 'POST', { token, password }),
    logout: () => request('/api/auth/logout', 'POST', {}),
    promo: () => request('/api/me/promo'),
    claimPromo: code => request('/api/me/promo', 'POST', { code }),
    activateCoupon: code => request('/api/coupon/activate', 'POST', { code }),
    couponHelp: body => request('/api/coupon/help', 'POST', { ...body, locale: locale() }),
    cabinet: () => request('/api/me/cabinet'),
    orders: () => request('/api/me/orders'),
    recurringOrders: () => request('/api/me/recurring-orders'),
    createRecurringOrder: body => request('/api/me/recurring-orders', 'POST', body),
    updateRecurringOrder: (id, body) => request(`/api/me/recurring-orders/${encodeURIComponent(id)}`, 'PATCH', body),
    saveCabinet: (cabinet, revision) => request('/api/me/cabinet', 'PUT', { cabinet, revision })
  };
}
