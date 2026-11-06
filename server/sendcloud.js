const API_URL = 'https://panel.sendcloud.sc/api/v3/shipping-options';

export function sendcloudReady(env = process.env) {
  return Boolean(env.SENDCLOUD_PUBLIC_KEY && env.SENDCLOUD_SECRET_KEY);
}

export function shippingQuoteInput({ postalCode, parcels }) {
  const destination = String(postalCode || '').trim();
  if (!/^[0-9]{5}$/.test(destination)) throw new Error('Укажите почтовый индекс Испании');
  if (!Array.isArray(parcels) || !parcels.length || parcels.length > 10)
    throw new Error('Укажите от 1 до 10 посылок');
  return {
    from_address: { country_code: 'ES', postal_code: '46024', city: 'València' },
    to_address: { country_code: 'ES', postal_code: destination },
    parcels: parcels.map(parcel => {
      const numbers = ['weightKg', 'lengthCm', 'widthCm', 'heightCm'].map(key => Number(parcel?.[key]));
      if (numbers.some(value => !Number.isFinite(value) || value <= 0) ||
        numbers[0] > 30 || numbers.slice(1).some(value => value > 150))
        throw new Error('Проверьте вес и размеры посылки');
      const [weight, length, width, height] = numbers;
      return {
        dimensions: { length: String(length), width: String(width), height: String(height), unit: 'cm' },
        weight: { value: String(weight), unit: 'kg' }
      };
    }),
    calculate_quotes: true
  };
}

export async function sendcloudShippingOptions(input, fetcher = fetch, env = process.env) {
  if (!sendcloudReady(env)) throw new Error('Ключи Sendcloud не настроены');
  const payload = shippingQuoteInput(input);
  const credentials = Buffer.from(`${env.SENDCLOUD_PUBLIC_KEY}:${env.SENDCLOUD_SECRET_KEY}`).toString('base64');
  const response = await fetcher(API_URL, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error(`Sendcloud вернул HTTP ${response.status}`);
  const result = await response.json();
  if (!Array.isArray(result?.data)) throw new Error('Неожиданный ответ Sendcloud');
  return result.data;
}
