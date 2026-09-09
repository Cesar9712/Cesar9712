const http = require('http');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 10000);
const BASE = process.env.FRANTIC_BASE_URL || 'https://gofrantic.com';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const GITHUB_HANDLE = process.env.FRANTIC_GITHUB_HANDLE || 'Cesar9712';
const CONTACT_EMAIL = process.env.FRANTIC_CONTACT_EMAIL || 'cesargp9712@gmail.com';
const AGENT_NAME = process.env.FRANTIC_AGENT_NAME || 'CryptoBountyOperator';
const PAYOUT_ADDRESS = process.env.FRANTIC_PAYOUT_ADDRESS || '';
const AUTO_BOOTSTRAP = process.env.FRANTIC_AUTO_BOOTSTRAP !== 'no';

const state = {
  agentKid: process.env.FRANTIC_AGENT_KID || '',
  agentToken: process.env.FRANTIC_AGENT_TOKEN || '',
  operatorToken: process.env.FRANTIC_OPERATOR_TOKEN || '',
  operatorId: process.env.FRANTIC_OPERATOR_ID || '',
  signupAt: null,
  lastScanAt: null,
  lastError: null,
  lastClaim: null,
  opportunities: [],
};

function send(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(JSON.stringify(body, null, 2));
}

function isAdmin(url) {
  return Boolean(ADMIN_TOKEN) && url.searchParams.get('token') === ADMIN_TOKEN;
}

async function request(path, options = {}) {
  const r = await fetch(`${BASE}${path}`, options);
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!r.ok) {
    const e = new Error(`Frantic ${r.status}: ${text.slice(0, 500)}`);
    e.status = r.status;
    e.data = data;
    throw e;
  }
  return data;
}

function findDeep(obj, keys) {
  if (!obj || typeof obj !== 'object') return '';
  for (const key of keys) {
    if (typeof obj[key] === 'string' && obj[key]) return obj[key];
  }
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object') {
      const found = findDeep(value, keys);
      if (found) return found;
    }
  }
  return '';
}

async function signup() {
  if (state.agentToken && state.agentKid) {
    return { alreadyConfigured: true, agentKid: state.agentKid, operatorId: state.operatorId || null };
  }
  const data = await request('/v1/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      github_handle: GITHUB_HANDLE,
      contact: CONTACT_EMAIL,
      agent_name: AGENT_NAME,
      role: 'OSS bounty operator',
      lane: 'managed',
      runtime: 'Render web service',
      bio: 'AI-assisted bounty operator that finds funded public work, verifies scope, ships evidence-backed deliverables, and never handles private keys or seed phrases.'
    }),
  });

  state.agentKid = findDeep(data, ['agent_kid', 'agentKid', 'kid']);
  state.agentToken = findDeep(data, ['agent_token', 'agentToken']);
  state.operatorToken = findDeep(data, ['operator_token', 'operatorToken']);
  state.operatorId = findDeep(data, ['operator_id', 'operatorId', 'operator_ref', 'operatorRef']);
  state.signupAt = new Date().toISOString();

  if (!state.agentKid || !state.agentToken) {
    const e = new Error('Signup succeeded but agent credentials were not returned in a recognized shape');
    e.data = { keys: Object.keys(data || {}) };
    throw e;
  }

  return {
    configured: true,
    agentKid: state.agentKid,
    operatorId: state.operatorId || null,
    emailChallengeAccepted: Boolean(data.email_verification_challenge_accepted),
    emailVerificationSent: Boolean(data.email_verification_sent),
    credentialFieldsPresent: {
      agentToken: Boolean(state.agentToken),
      operatorToken: Boolean(state.operatorToken),
    }
  };
}

async function agentStatus() {
  if (!state.agentKid) throw new Error('Agent not configured');
  return request(`/v1/agents/${encodeURIComponent(state.agentKid)}/status`);
}

async function registerPayout() {
  if (!state.agentKid || !state.agentToken) throw new Error('Agent credentials missing');
  if (!/^0x[0-9a-fA-F]{40}$/.test(PAYOUT_ADDRESS)) throw new Error('FRANTIC_PAYOUT_ADDRESS must be a valid 0x EVM address');
  const data = await request(`/v1/agents/${encodeURIComponent(state.agentKid)}/payout`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      agent_token: state.agentToken,
      rail: 'x402',
      target: PAYOUT_ADDRESS,
    }),
  });
  return {
    ok: Boolean(data.ok),
    rail: data.rail || 'x402',
    hint: data.hint || null,
    receipt_ref: data.receipt_ref || null,
  };
}

async function bounty(id) {
  return request(`/v1/bounties/${encodeURIComponent(String(id))}`);
}

function bountyRow(x) {
  const s = JSON.stringify(x).toLowerCase();
  const price = Number(x.price_cents ?? x.priceCents ?? x.worker_price_cents ?? x.workerPriceCents ?? 0);
  const openish = !s.includes('"claim gate closed"') && !s.includes('"work":"closed"') && !s.includes('"status":"closed"');
  const funded = s.includes('funded') || s.includes('settled') || price > 0;
  const risky = ['deposit', 'bond', 'stake', 'trading', 'private key', 'seed phrase', 'payment required to claim'].some(k => s.includes(k));
  return { price, openish, funded, risky };
}

async function scan() {
  const data = await request('/v1/board');
  const rows = Array.isArray(data?.bounties) ? data.bounties : Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  state.opportunities = rows.map(x => ({ raw: x, gate: bountyRow(x) }))
    .filter(x => x.gate.openish && x.gate.funded && !x.gate.risky)
    .sort((a, b) => (b.gate.price || 0) - (a.gate.price || 0));
  state.lastScanAt = new Date().toISOString();
  return state.opportunities.slice(0, 30);
}

async function claim(id) {
  if (!state.agentKid || !state.agentToken) throw new Error('Agent credentials missing');
  const data = await request('/v1/claims', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      bounty: Number.isFinite(Number(id)) ? Number(id) : String(id),
      agent_kid: state.agentKid,
      agent_token: state.agentToken,
    }),
  });
  if (data.ok) {
    state.lastClaim = {
      bounty: id,
      claim_id: data.claim_id || null,
      claim_ref: data.claim_ref || null,
      fuse_expires_at: data.fuse_expires_at || null,
      at: new Date().toISOString(),
    };
  }
  return data;
}

async function deliver(claimId, refs) {
  if (!state.agentKid || !state.agentToken) throw new Error('Agent credentials missing');
  if (!claimId) throw new Error('claimId required');
  if (!Array.isArray(refs) || !refs.length) throw new Error('artifact refs required');
  return request('/v1/deliveries', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      claim_id: claimId,
      agent_kid: state.agentKid,
      agent_token: state.agentToken,
      artifact_refs: refs,
    }),
  });
}

async function autoBootstrap() {
  try {
    const s = await signup();
    console.log(JSON.stringify({
      event: 'frantic_signup_ready',
      agentKid: state.agentKid,
      emailVerificationSent: Boolean(s.emailVerificationSent),
      emailChallengeAccepted: Boolean(s.emailChallengeAccepted),
    }));
    try {
      const p = await registerPayout();
      console.log(JSON.stringify({ event: 'frantic_payout_registered', ok: p.ok, rail: p.rail, hint: p.hint, receipt_ref: p.receipt_ref }));
    } catch (e) {
      console.log(JSON.stringify({ event: 'frantic_payout_pending', message: String(e.message || e).slice(0, 300) }));
    }
    try {
      const status = await agentStatus();
      console.log(JSON.stringify({ event: 'frantic_status', agentKid: state.agentKid, status }));
    } catch (e) {
      console.log(JSON.stringify({ event: 'frantic_status_pending', message: String(e.message || e).slice(0, 300) }));
    }
  } catch (e) {
    state.lastError = String(e.message || e);
    console.error(JSON.stringify({ event: 'frantic_bootstrap_error', message: state.lastError.slice(0, 500) }));
  }
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === '/health') {
      return send(res, 200, {
        status: 'ok',
        service: 'frantic-bounty-operator',
        configured: Boolean(state.agentKid && state.agentToken),
        agentKid: state.agentKid || null,
        payoutConfiguredLocally: /^0x[0-9a-fA-F]{40}$/.test(PAYOUT_ADDRESS),
        lastScanAt: state.lastScanAt,
        lastClaim: state.lastClaim,
        lastError: state.lastError,
      });
    }

    if (!url.pathname.startsWith('/admin/')) return send(res, 404, { error: 'not found' });
    if (!isAdmin(url)) return send(res, 401, { error: 'unauthorized' });

    if (url.pathname === '/admin/signup') return send(res, 200, await signup());
    if (url.pathname === '/admin/status') return send(res, 200, await agentStatus());
    if (url.pathname === '/admin/payout') return send(res, 200, await registerPayout());
    if (url.pathname === '/admin/scan') return send(res, 200, await scan());
    if (url.pathname === '/admin/bounty') return send(res, 200, await bounty(url.searchParams.get('id') || ''));
    if (url.pathname === '/admin/claim') return send(res, 200, await claim(url.searchParams.get('id') || ''));
    if (url.pathname === '/admin/deliver') {
      const claimId = url.searchParams.get('claimId') || '';
      const refs = url.searchParams.getAll('ref');
      return send(res, 200, await deliver(claimId, refs));
    }

    if (url.pathname === '/admin/credential-export') {
      return send(res, 200, {
        agentKid: state.agentKid || null,
        agentToken: state.agentToken || null,
        operatorToken: state.operatorToken || null,
        operatorId: state.operatorId || null,
      });
    }

    return send(res, 404, { error: 'unknown admin route' });
  } catch (e) {
    state.lastError = String(e.message || e);
    return send(res, e.status || 500, { error: state.lastError, data: e.data || null });
  }
}).listen(PORT, () => {
  console.log(JSON.stringify({ event: 'frantic_operator_started', port: PORT, agent: AGENT_NAME }));
  if (AUTO_BOOTSTRAP) setTimeout(autoBootstrap, 1500);
});
