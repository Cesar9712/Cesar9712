const http = require('http');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 10000);
const BASE = process.env.SUPERTEAM_BASE_URL || 'https://superteam.fun';
const NAME = process.env.SUPERTEAM_AGENT_NAME || 'CryptoBountyOperator';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

const state = {
  apiKey: process.env.SUPERTEAM_API_KEY || '',
  claimCode: process.env.SUPERTEAM_CLAIM_CODE || '',
  agentId: process.env.SUPERTEAM_AGENT_ID || '',
  username: process.env.SUPERTEAM_AGENT_USERNAME || '',
  lastScanAt: null,
  lastError: null,
  opportunities: [],
  submitted: new Set(),
};

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body, null, 2));
}

function auth(url) {
  return Boolean(ADMIN_TOKEN) && url.searchParams.get('token') === ADMIN_TOKEN;
}

async function request(path, options = {}, useAuth = true) {
  const headers = { ...(options.headers || {}) };
  if (useAuth && state.apiKey) headers.Authorization = `Bearer ${state.apiKey}`;
  const r = await fetch(`${BASE}${path}`, { ...options, headers });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!r.ok) {
    const e = new Error(`Superteam ${r.status}: ${text.slice(0, 500)}`);
    e.status = r.status;
    e.data = data;
    throw e;
  }
  return data;
}

async function bootstrap() {
  if (state.apiKey) return;
  const d = await request('/api/agents', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: NAME }),
  }, false);
  state.apiKey = d.apiKey || '';
  state.claimCode = d.claimCode || '';
  state.agentId = d.agentId || '';
  state.username = d.username || '';
  if (!state.apiKey) throw new Error('Registration returned no apiKey');
  console.log(JSON.stringify({ event: 'agent_registered', agentId: state.agentId, username: state.username }));
}

function deadlineOf(l) {
  return l.deadline || l.submissionDeadline || l.endTime || l.endsAt || l.expiry || null;
}

function score(l) {
  const t = JSON.stringify(l).toLowerCase();
  const deadline = deadlineOf(l);
  if (deadline) {
    const ms = Date.parse(deadline);
    if (Number.isFinite(ms) && ms <= Date.now()) {
      return { score: -1000, classification: 'DESCARTADA', reason: 'Vencida', deadline };
    }
  }

  const risky = [
    'minimum deposit', 'trade volume', 'trading activity', 'perps', 'leverage',
    'seed phrase', 'private key', 'token sale', 'buy token', 'stake funds',
    'deposit funds', 'provide liquidity'
  ].some(x => t.includes(x));
  if (risky) return { score: -999, classification: 'DESCARTADA', reason: 'Requiere capital o acceso sensible', deadline };

  let s = 50;
  if (t.includes('agent_only')) s += 25;
  if (t.includes('agent_allowed')) s += 15;
  if (t.includes('global')) s += 8;
  if (t.includes('usdc') || t.includes('usdg')) s += 8;
  if (t.includes('content') || t.includes('research') || t.includes('documentation')) s += 10;
  if (t.includes('github') || t.includes('open source')) s += 6;
  if (t.includes('twitter') || t.includes('tweet') || t.includes('telegram')) s -= 10;
  if (t.includes('video') || t.includes('loom')) s -= 5;
  if (t.includes('wallet') || t.includes('sign transaction')) s -= 12;

  return {
    score: s,
    classification: s >= 80 ? 'CONFIANZA ALTA' : s >= 65 ? 'CONFIANZA MEDIA' : s >= 45 ? 'CONFIANZA BAJA' : 'DESCARTADA',
    reason: 'Filtro coste/riesgo/automatización',
    deadline,
  };
}

async function scan() {
  await bootstrap();
  const paths = [
    '/api/agents/listings/live?take=20',
    '/api/agents/listings/live?take=20&type=bounty',
    '/api/agents/listings/live?take=50'
  ];
  let data = null;
  let last = null;
  for (const p of paths) {
    try { data = await request(p); break; }
    catch (e) {
      last = e;
      console.error(JSON.stringify({ event: 'scan_attempt_failed', path: p, message: e.message }));
    }
  }
  if (!data) throw last || new Error('All listing endpoints failed');

  const raw = Array.isArray(data) ? data : (data.listings || data.data || data.items || []);
  state.opportunities = raw
    .map(x => ({ ...x, operatorScore: score(x) }))
    .sort((a, b) => b.operatorScore.score - a.operatorScore.score);
  state.lastScanAt = new Date().toISOString();
  state.lastError = null;

  const active = state.opportunities.filter(x => x.operatorScore.classification !== 'DESCARTADA');
  const top = active.slice(0, 12).map(x => ({
    id: x.id || x.listingId || null,
    slug: x.slug || x.listingSlug || null,
    title: x.title || x.name || null,
    type: x.type || x.listingType || null,
    agentAccess: x.agentAccess || null,
    deadline: deadlineOf(x),
    compensation: x.compensation || x.reward || x.totalReward || null,
    score: x.operatorScore,
  }));
  console.log(JSON.stringify({ event: 'scan_complete', rawCount: raw.length, activeCount: active.length, at: state.lastScanAt, top }));
  return { active, discarded: state.opportunities.filter(x => x.operatorScore.classification === 'DESCARTADA') };
}

async function details(slug) {
  await bootstrap();
  return request(`/api/agents/listings/details/${encodeURIComponent(slug)}`);
}

async function submit(q) {
  await bootstrap();
  let listingId = q.listingId || '';
  if (!listingId && q.slug) {
    const d = await details(q.slug);
    listingId = d.listingId || d.id || (d.listing && d.listing.id) || '';
  }
  if (!listingId) throw new Error('Missing listingId');
  if (!q.link && !q.otherInfo) throw new Error('Real public link or detailed otherInfo required');
  if (state.submitted.has(String(listingId))) throw new Error('Already submitted in this runtime');
  const payload = {
    listingId,
    link: q.link || '',
    tweet: q.tweet || '',
    otherInfo: q.otherInfo || '',
    eligibilityAnswers: q.eligibilityAnswers || [],
    ask: q.ask == null || q.ask === '' ? null : Number(q.ask),
    telegram: q.telegram || undefined,
  };
  const out = await request('/api/agents/submissions/create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  state.submitted.add(String(listingId));
  console.log(JSON.stringify({ event: 'submission_created', listingId, slug: q.slug || null }));
  return out;
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/health') return send(res, 200, {
      status: 'ok', agentConfigured: Boolean(state.apiKey), agentId: state.agentId || null,
      username: state.username || null, lastScanAt: state.lastScanAt,
      activeCount: state.opportunities.filter(x => x.operatorScore?.classification !== 'DESCARTADA').length,
      lastError: state.lastError,
    });
    if (!url.pathname.startsWith('/admin/')) return send(res, 404, { error: 'not found' });
    if (!auth(url)) return send(res, 401, { error: 'unauthorized' });
    if (url.pathname === '/admin/bootstrap') {
      await bootstrap();
      return send(res, 200, { configured: Boolean(state.apiKey), claimCode: state.claimCode, agentId: state.agentId, username: state.username });
    }
    if (url.pathname === '/admin/scan' || url.pathname === '/admin/opportunities') return send(res, 200, await scan());
    if (url.pathname.startsWith('/admin/details/')) return send(res, 200, await details(decodeURIComponent(url.pathname.slice('/admin/details/'.length))));
    if (url.pathname === '/admin/submit') {
      let eligibilityAnswers = [];
      const raw = url.searchParams.get('eligibilityAnswers');
      if (raw) eligibilityAnswers = JSON.parse(raw);
      const out = await submit({
        slug: url.searchParams.get('slug') || '', listingId: url.searchParams.get('listingId') || '',
        link: url.searchParams.get('link') || '', tweet: url.searchParams.get('tweet') || '',
        otherInfo: url.searchParams.get('otherInfo') || '', telegram: url.searchParams.get('telegram') || '',
        ask: url.searchParams.get('ask'), eligibilityAnswers,
      });
      return send(res, 200, { status: 'submitted', result: out });
    }
    return send(res, 404, { error: 'unknown admin route' });
  } catch (e) {
    state.lastError = String(e.message || e);
    console.error(JSON.stringify({ event: 'error', message: state.lastError }));
    return send(res, e.status || 500, { error: state.lastError, data: e.data || null });
  }
}).listen(PORT, async () => {
  console.log(JSON.stringify({ event: 'server_started', port: PORT, agentName: NAME }));
  try { await bootstrap(); await scan(); }
  catch (e) {
    state.lastError = String(e.message || e);
    console.error(JSON.stringify({ event: 'startup_error', message: state.lastError }));
  }
});

setInterval(() => scan().catch(e => {
  state.lastError = String(e.message || e);
  console.error(JSON.stringify({ event: 'scheduled_scan_error', message: state.lastError }));
}), 10 * 60 * 1000);
