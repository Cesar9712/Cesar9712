const http = require('http');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 10000);
const BASE_URL = process.env.SUPERTEAM_BASE_URL || 'https://superteam.fun';
const AGENT_NAME = process.env.SUPERTEAM_AGENT_NAME || 'CryptoBountyOperator';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

let runtime = {
  apiKey: process.env.SUPERTEAM_API_KEY || '',
  claimCode: process.env.SUPERTEAM_CLAIM_CODE || '',
  agentId: process.env.SUPERTEAM_AGENT_ID || '',
  username: process.env.SUPERTEAM_AGENT_USERNAME || '',
  bootstrappedAt: null,
  lastScanAt: null,
  lastError: null,
  opportunities: [],
  submitted: new Set(),
};

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body, null, 2));
}

function authorized(url) {
  return ADMIN_TOKEN && url.searchParams.get('token') === ADMIN_TOKEN;
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (runtime.apiKey) headers.Authorization = `Bearer ${runtime.apiKey}`;
  const r = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!r.ok) {
    const err = new Error(`Superteam ${r.status}: ${text.slice(0, 500)}`);
    err.status = r.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function bootstrapAgent() {
  if (runtime.apiKey) return runtime;
  const data = await api('/api/agents', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: AGENT_NAME }),
  });
  runtime.apiKey = data.apiKey || '';
  runtime.claimCode = data.claimCode || '';
  runtime.agentId = data.agentId || '';
  runtime.username = data.username || '';
  runtime.bootstrappedAt = new Date().toISOString();
  if (!runtime.apiKey) throw new Error('Superteam registration did not return an apiKey');
  console.log(JSON.stringify({ event: 'agent_registered', agentId: runtime.agentId, username: runtime.username, claimCode: runtime.claimCode }));
  return runtime;
}

function textOf(listing) {
  return JSON.stringify(listing).toLowerCase();
}

function scoreListing(listing) {
  const t = textOf(listing);
  const hardReject = [
    'deposit', 'minimum deposit', 'trade volume', 'trading activity', 'perps', 'leverage',
    'seed phrase', 'private key', 'kyc bypass', 'evade kyc', 'whitelist sale', 'token sale',
    'buy token', 'stake funds', 'liquidity provider with real funds'
  ].some(x => t.includes(x));
  if (hardReject) return { score: -999, classification: 'DESCARTADA', reason: 'Requires capital/risky financial activity or sensitive access' };

  let score = 50;
  if (t.includes('agent_only')) score += 25;
  if (t.includes('agent_allowed')) score += 15;
  if (t.includes('global')) score += 8;
  if (t.includes('usdc') || t.includes('usdg')) score += 8;
  if (t.includes('content') || t.includes('research') || t.includes('documentation')) score += 10;
  if (t.includes('github') || t.includes('open source')) score += 6;
  if (t.includes('twitter') || t.includes(' x ') || t.includes('tweet')) score -= 10;
  if (t.includes('video') || t.includes('loom')) score -= 5;
  if (t.includes('wallet') || t.includes('sign transaction')) score -= 12;
  const classification = score >= 80 ? 'CONFIANZA ALTA' : score >= 65 ? 'CONFIANZA MEDIA' : score >= 45 ? 'CONFIANZA BAJA' : 'DESCARTADA';
  return { score, classification, reason: 'Heuristic zero-cost/automation/risk score' };
}

async function scan() {
  await bootstrapAgent();
  const data = await api('/api/agents/listings/live?take=50&deadline=2026-12-31');
  const raw = Array.isArray(data) ? data : (data.listings || data.data || data.items || []);
  runtime.opportunities = raw.map(l => ({ ...l, operatorScore: scoreListing(l) }))
    .sort((a, b) => b.operatorScore.score - a.operatorScore.score);
  runtime.lastScanAt = new Date().toISOString();
  runtime.lastError = null;
  console.log(JSON.stringify({ event: 'scan_complete', count: runtime.opportunities.length, at: runtime.lastScanAt }));
  return runtime.opportunities;
}

async function details(slug) {
  await bootstrapAgent();
  return api(`/api/agents/listings/details/${encodeURIComponent(slug)}`);
}

async function submit({ slug, listingId, link, tweet, otherInfo, telegram, ask, eligibilityAnswers }) {
  await bootstrapAgent();
  if (!listingId && slug) {
    const d = await details(slug);
    listingId = d.listingId || d.id || d.listing?.id;
  }
  if (!listingId) throw new Error('Missing listingId');
  if (!link && !otherInfo) throw new Error('A real public link or detailed otherInfo is required');
  if (runtime.submitted.has(String(listingId))) throw new Error('This runtime already submitted this listing');

  const payload = {
    listingId,
    link: link || '',
    tweet: tweet || '',
    otherInfo: otherInfo || '',
    eligibilityAnswers: Array.isArray(eligibilityAnswers) ? eligibilityAnswers : [],
    ask: ask === '' || ask == null ? null : Number(ask),
    telegram: telegram || undefined,
  };

  const result = await api('/api/agents/submissions/create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  runtime.submitted.add(String(listingId));
  console.log(JSON.stringify({ event: 'submission_created', listingId, slug: slug || null }));
  return result;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/health') {
      return json(res, 200, {
        status: 'ok',
        agentConfigured: Boolean(runtime.apiKey),
        bootstrappedAt: runtime.bootstrappedAt,
        lastScanAt: runtime.lastScanAt,
        opportunityCount: runtime.opportunities.length,
        lastError: runtime.lastError,
      });
    }

    if (!url.pathname.startsWith('/admin/')) return json(res, 404, { error: 'not found' });
    if (!authorized(url)) return json(res, 401, { error: 'unauthorized' });

    if (url.pathname === '/admin/bootstrap') {
      await bootstrapAgent();
      return json(res, 200, {
        apiKey: runtime.apiKey,
        claimCode: runtime.claimCode,
        agentId: runtime.agentId,
        username: runtime.username,
        bootstrappedAt: runtime.bootstrappedAt,
      });
    }

    if (url.pathname === '/admin/scan') {
      const opportunities = await scan();
      return json(res, 200, { count: opportunities.length, opportunities });
    }

    if (url.pathname === '/admin/opportunities') {
      if (!runtime.opportunities.length) await scan();
      return json(res, 200, { lastScanAt: runtime.lastScanAt, opportunities: runtime.opportunities });
    }

    if (url.pathname.startsWith('/admin/details/')) {
      const slug = decodeURIComponent(url.pathname.slice('/admin/details/'.length));
      return json(res, 200, await details(slug));
    }

    if (url.pathname === '/admin/submit') {
      const eligibilityRaw = url.searchParams.get('eligibilityAnswers');
      let eligibilityAnswers = [];
      if (eligibilityRaw) {
        try { eligibilityAnswers = JSON.parse(eligibilityRaw); } catch { throw new Error('eligibilityAnswers must be valid JSON'); }
      }
      const result = await submit({
        slug: url.searchParams.get('slug') || '',
        listingId: url.searchParams.get('listingId') || '',
        link: url.searchParams.get('link') || '',
        tweet: url.searchParams.get('tweet') || '',
        otherInfo: url.searchParams.get('otherInfo') || '',
        telegram: url.searchParams.get('telegram') || '',
        ask: url.searchParams.get('ask'),
        eligibilityAnswers,
      });
      return json(res, 200, { status: 'submitted', result });
    }

    return json(res, 404, { error: 'unknown admin route' });
  } catch (err) {
    runtime.lastError = String(err.message || err);
    console.error(JSON.stringify({ event: 'error', message: runtime.lastError }));
    return json(res, err.status || 500, { error: runtime.lastError, data: err.data || null });
  }
});

server.listen(PORT, async () => {
  console.log(JSON.stringify({ event: 'server_started', port: PORT, agentName: AGENT_NAME }));
  try {
    await bootstrapAgent();
    await scan();
  } catch (err) {
    runtime.lastError = String(err.message || err);
    console.error(JSON.stringify({ event: 'startup_error', message: runtime.lastError }));
  }
});

setInterval(() => {
  scan().catch(err => {
    runtime.lastError = String(err.message || err);
    console.error(JSON.stringify({ event: 'scheduled_scan_error', message: runtime.lastError }));
  });
}, 10 * 60 * 1000);
