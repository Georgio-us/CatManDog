import { validCartId } from './cart-activity.js';

const platforms = new Set(['instagram', 'facebook', 'tiktok', 'youtube', 'pinterest']);
const sources = new Set(['direct', 'internal', 'search', 'social', 'other']);

export function visitAttribution(body) {
  const platform = platforms.has(body?.platform) ? body.platform : null;
  return platform || (sources.has(body?.source) ? body.source : 'unknown');
}

export async function recordSiteVisit(db, body) {
  if (!validCartId(body?.cartId) || !validCartId(body?.visitId)) return null;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    // Serialize visitor numbering and daily totals across concurrent requests.
    await client.query('SELECT pg_advisory_xact_lock(1043327)');
    const duplicate = await client.query('SELECT 1 FROM site_visit_events WHERE visit_id=$1', [body.visitId]);
    if (duplicate.rows.length) { await client.query('COMMIT'); return null; }
    const source = visitAttribution(body);
    const visitor = await client.query(`INSERT INTO site_visitors(cart_id) VALUES($1)
      ON CONFLICT(cart_id) DO UPDATE SET visit_count=site_visitors.visit_count+1,last_seen_at=now()
      RETURNING visitor_number,visit_count`, [body.cartId]);
    await client.query(`INSERT INTO site_visit_events(visit_id,cart_id,source) VALUES($1,$2,$3)`,
      [body.visitId, body.cartId, source]);
    const totals = await client.query(`SELECT count(*)::integer AS visits_today,
      count(DISTINCT cart_id)::integer AS visitors_today,
      count(*) FILTER (WHERE source='instagram')::integer AS instagram_today
      FROM site_visit_events
      WHERE created_at >= (date_trunc('day',now() AT TIME ZONE 'Europe/Madrid') AT TIME ZONE 'Europe/Madrid')`);
    await client.query('COMMIT');
    return { source, visitorNumber: Number(visitor.rows[0].visitor_number),
      visitCount: visitor.rows[0].visit_count, ...totals.rows[0] };
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

export async function deleteSiteVisitor(db, cartId) {
  if (!validCartId(cartId)) return false;
  const result = await db.query('DELETE FROM site_visitors WHERE cart_id=$1', [cartId]);
  return result.rowCount > 0;
}
