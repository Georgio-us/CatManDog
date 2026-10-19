export function createAccountApi(fetcher = fetch) {
  async function request(path, method = 'GET', body) {
    const response = await fetcher(path, { method, credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data.error || 'Не удалось связаться с сервером'),
      { status: response.status });
    return data;
  }
  return {
    config: () => request('/api/config'),
    me: () => request('/api/auth/me'),
    register: body => request('/api/auth/register', 'POST', body),
    login: body => request('/api/auth/login', 'POST', body),
    verify: token => request('/api/auth/verify', 'POST', { token }),
    resendVerification: email => request('/api/auth/resend-verification', 'POST', { email }),
    recover: email => request('/api/auth/recover', 'POST', { email }),
    reset: (token, password) => request('/api/auth/reset', 'POST', { token, password }),
    logout: () => request('/api/auth/logout', 'POST', {}),
    cabinet: () => request('/api/me/cabinet'),
    saveCabinet: (cabinet, revision) => request('/api/me/cabinet', 'PUT', { cabinet, revision })
  };
}
