const campaigns = [
  ['tg-vlc-01-w1', 'paid_social'],
  ['tg-vlc-02-w1', 'paid_social'],
  ['tg-vlc-03-w1', 'organic_social'],
  ['tg-vlc-04-w1', 'organic_social'],
  ['tg-es-01-w1', 'organic_social']
];

const destinations = new Map([...campaigns.flatMap(([campaign, medium]) => [
  [`/go/${campaign}-site`, {
    id: campaign, destination: 'site',
    url: `/?utm_source=telegram&utm_medium=${medium}&utm_campaign=${campaign}`
  }],
  [`/go/${campaign}-instagram`, {
    id: campaign, destination: 'instagram',
    url: 'https://www.instagram.com/catmandog.es/'
  }]
]),
  ['/go/tiktok-profile-site', {
    id: 'tiktok-profile', destination: 'site',
    url: '/?utm_source=tiktok&utm_medium=organic_social&utm_campaign=tiktok-profile'
  }],
  ['/go/tiktok-profile-instagram', {
    id: 'tiktok-profile', destination: 'instagram',
    url: 'https://www.instagram.com/catmandog.es/'
  }]
]);

export function campaignLink(pathname) {
  return destinations.get(pathname) || null;
}

export async function recordCampaignClick(db, link) {
  if (!db || !link) return;
  await db.query('INSERT INTO campaign_link_clicks(campaign_id,destination) VALUES($1,$2)',
    [link.id, link.destination]);
}

export async function listCampaignClicks(db) {
  const { rows } = await db.query(`SELECT campaign_id,destination,count(*)::integer AS clicks
    FROM campaign_link_clicks GROUP BY campaign_id,destination ORDER BY campaign_id,destination`);
  return rows;
}

export async function serveCampaignLink(db, req, res, pathname) {
  const link = campaignLink(pathname);
  if (!link) return false;
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' });
    res.end();
    return true;
  }
  // Preview crawlers and HEAD probes are not people opening the ad.
  const bot = /bot|crawler|spider|preview|facebookexternalhit/i.test(req.headers['user-agent'] || '');
  if (req.method === 'GET' && !bot) {
    try { await recordCampaignClick(db, link); }
    catch (error) { console.error('Campaign click record failed:', error.message); }
  }
  res.writeHead(302, { Location: link.url, 'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow' });
  res.end();
  return true;
}
