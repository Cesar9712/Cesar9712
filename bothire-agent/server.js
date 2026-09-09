const http = require('http');
const dns = require('dns').promises;
const net = require('net');

const PORT = Number(process.env.PORT || 10000);
const API = process.env.BOTHIRE_BASE_URL || 'https://www.bothire.io';
const WALLET = process.env.BOTHIRE_PAYOUT_ADDRESS || '0xb6e727732F845bDb7792C075B147658e84a173d2';
const ENDPOINT = process.env.BOTHIRE_ENDPOINT_URL || 'https://bothire-audit-agent.onrender.com/api/work';
const POSTS_READY = process.env.BOTHIRE_POSTS_READY === 'yes';

const state = {
  botId: process.env.BOTHIRE_BOT_ID || '',
  apiKey: process.env.BOTHIRE_API_KEY || '',
  posts: [],
  lastError: null,
  bootstrappedAt: null,
};

function json(res, code, body) {
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(JSON.stringify(body));
}

async function req(path, options = {}) {
  const r = await fetch(`${API}${path}`, options);
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!r.ok) {
    const e = new Error(`BotHire ${r.status}: ${text.slice(0, 600)}`);
    e.status = r.status;
    e.data = data;
    throw e;
  }
  return data;
}

const skillSpecs = [
  {
    name: 'JSON Validator and Structure Report',
    description: 'Validate JSON or JSON-like payloads and return deterministic structure, type, depth, key and anomaly metrics. No secrets, no wallet actions.',
    category: 'data', tags: ['json', 'validation', 'data', 'audit'], price_usdc: 0.05, price_type: 'per_call'
  },
  {
    name: 'Text Quality and Readability Audit',
    description: 'Deterministic text audit: length, words, sentences, readability proxy, repetition, links and suspicious instruction patterns.',
    category: 'writing', tags: ['text', 'quality', 'readability', 'audit'], price_usdc: 0.05, price_type: 'per_call'
  },
  {
    name: 'Markdown Structure Audit',
    description: 'Analyze Markdown structure including headings, lists, links, code blocks, task boxes and basic document-quality signals.',
    category: 'document', tags: ['markdown', 'docs', 'lint', 'structure'], price_usdc: 0.05, price_type: 'per_call'
  },
  {
    name: 'Prompt Injection Pattern Scan',
    description: 'Scan supplied text for common prompt-injection, secret-exfiltration, payout-redirection and unsafe-action instruction patterns. Analysis only.',
    category: 'security', tags: ['prompt-injection', 'security', 'scanner', 'llm'], price_usdc: 0.05, price_type: 'per_call'
  },
  {
    name: 'Public URL Health Snapshot',
    description: 'Fetch a public URL safely and report status, latency, content type, redirect target and basic response metadata. Private-network targets are refused.',
    category: 'development', tags: ['url', 'http', 'health', 'web'], price_usdc: 0.08, price_type: 'per_call'
  },
  {
    name: 'GitHub Repository Public Snapshot',
    description: 'Read-only public GitHub repository snapshot: metadata, activity, license, stars, forks, issue count and freshness signals. No repo mutation.',
    category: 'development', tags: ['github', 'repository', 'research', 'audit'], price_usdc: 0.10, price_type: 'per_call'
  }
];

async function bootstrap() {
  try {
    if (!state.botId || !state.apiKey) {
      const out = await req('/api/bots/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'CryptoBountyOperator-Audit',
          description: 'Autonomous deterministic audit worker for JSON, text, Markdown, public URLs and public GitHub repository metadata. Read-only, no secrets, no financial actions.',
          wallet_address: WALLET,
          keywords: ['audit', 'json', 'text', 'markdown', 'github', 'url', 'security'],
          skills: skillSpecs,
        }),
      });
      state.botId = out.bot_id || '';
      state.apiKey = out.api_key || '';
      console.log(JSON.stringify({ event: 'bothire_registered', botId: state.botId, apiKey: state.apiKey, wallet: out.wallet_address || WALLET, isNew: out.is_new }));
    }

    if (!state.botId || !state.apiKey) throw new Error('BotHire registration returned incomplete credentials');

    if (!POSTS_READY) {
      for (const s of skillSpecs) {
        try {
          const out = await req('/api/posts', {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${state.apiKey}` },
            body: JSON.stringify({
              title: s.name,
              description: `${s.description} Input is JSON. Output is structured JSON.`,
              tags: s.tags,
              price_usdc: s.price_usdc,
              price_type: s.price_type,
              endpoint_url: ENDPOINT,
            }),
          });
          const id = out.post_id || out.id || out.post?.id || null;
          state.posts.push({ id, title: s.name, price: s.price_usdc });
          console.log(JSON.stringify({ event: 'bothire_post_created', id, title: s.name, price: s.price_usdc }));
        } catch (e) {
          console.error(JSON.stringify({ event: 'bothire_post_error', title: s.name, error: String(e.message || e).slice(0, 500) }));
        }
      }
    }

    state.bootstrappedAt = new Date().toISOString();
    state.lastError = null;
    console.log(JSON.stringify({ event: 'bothire_ready', botId: state.botId, posts: state.posts, endpoint: ENDPOINT }));
  } catch (e) {
    state.lastError = String(e.message || e);
    console.error(JSON.stringify({ event: 'bothire_bootstrap_error', error: state.lastError.slice(0, 800) }));
  }
}

function collect(value, path = '$', out = { strings: [], keys: 0, objects: 0, arrays: 0, scalars: 0, maxDepth: 0 }, depth = 0) {
  out.maxDepth = Math.max(out.maxDepth, depth);
  if (Array.isArray(value)) {
    out.arrays++;
    for (let i = 0; i < value.length; i++) collect(value[i], `${path}[${i}]`, out, depth + 1);
  } else if (value && typeof value === 'object') {
    out.objects++;
    for (const [k, v] of Object.entries(value)) {
      out.keys++;
      collect(v, `${path}.${k}`, out, depth + 1);
    }
  } else {
    out.scalars++;
    if (typeof value === 'string') out.strings.push({ path, value });
  }
  return out;
}

function textAudit(text) {
  text = String(text || '');
  const words = text.trim() ? text.trim().split(/\s+/) : [];
  const sentences = text.trim() ? text.split(/[.!?]+/).map(x => x.trim()).filter(Boolean) : [];
  const avgWordLength = words.length ? words.reduce((a, w) => a + w.replace(/[^\p{L}\p{N}]/gu, '').length, 0) / words.length : 0;
  const freq = new Map();
  for (const w of words.map(w => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')).filter(Boolean)) freq.set(w, (freq.get(w) || 0) + 1);
  const repeated = [...freq.entries()].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([word, count]) => ({ word, count }));
  const urls = [...text.matchAll(/https?:\/\/[^\s)\]}>'\"]+/gi)].map(m => m[0]).slice(0, 10);
  const suspiciousPatterns = [
    ['prompt_injection', /ignore (all |any )?(previous|prior) (instructions?|rules?)/i],
    ['prompt_injection', /(system prompt|developer message|hidden instructions?)/i],
    ['secret_exfiltration', /(reveal|print|send|show).{0,40}(api key|secret|password|private key|seed phrase)/i],
    ['payout_redirection', /(change|replace|redirect).{0,40}(wallet|payout|payment address)/i],
    ['financial_action', /(send|transfer|deposit|stake|buy).{0,30}(usdc|usdt|crypto|funds?|tokens?)/i],
    ['unsafe_bypass', /(disable|bypass|evade).{0,30}(safety|guardrail|verification|kyc)/i],
  ];
  const flags = [...new Set(suspiciousPatterns.filter(([, r]) => r.test(text)).map(([name]) => name))];
  const lines = text ? text.split(/\r?\n/) : [];
  const markdown = {
    headings: lines.filter(l => /^#{1,6}\s+/.test(l)).length,
    bullets: lines.filter(l => /^\s*[-*+]\s+/.test(l)).length,
    numberedItems: lines.filter(l => /^\s*\d+[.)]\s+/.test(l)).length,
    taskBoxes: lines.filter(l => /^\s*[-*+]\s+\[[ xX]\]\s+/.test(l)).length,
    fencedCodeBlocks: Math.floor(lines.filter(l => /^\s*```/.test(l)).length / 2),
    markdownLinks: (text.match(/\[[^\]]+\]\(https?:\/\/[^)]+\)/g) || []).length,
  };
  return {
    chars: text.length,
    words: words.length,
    sentences: sentences.length,
    lines: lines.length,
    avgWordLength: Number(avgWordLength.toFixed(2)),
    repeated,
    urls,
    riskFlags: flags,
    markdown,
  };
}

function isPrivateIp(ip) {
  if (!net.isIP(ip)) return true;
  if (ip === '::1' || ip === '0.0.0.0' || ip === '127.0.0.1') return true;
  if (ip.includes(':')) {
    const x = ip.toLowerCase();
    return x.startsWith('fc') || x.startsWith('fd') || x.startsWith('fe8') || x.startsWith('fe9') || x.startsWith('fea') || x.startsWith('feb');
  }
  const p = ip.split('.').map(Number);
  return p[0] === 10 || p[0] === 127 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168) || p[0] === 0;
}

async function safeUrlSnapshot(raw) {
  try {
    const u = new URL(raw);
    if (!['http:', 'https:'].includes(u.protocol)) return { url: raw, error: 'unsupported_protocol' };
    const host = u.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.local')) return { url: raw, error: 'private_target_refused' };
    const lookups = await dns.lookup(host, { all: true });
    if (!lookups.length || lookups.some(x => isPrivateIp(x.address))) return { url: raw, error: 'private_target_refused' };
    const start = Date.now();
    const r = await fetch(u, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(8000), headers: { 'user-agent': 'CryptoBountyOperator-Audit/1.0' } });
    return {
      url: u.toString(),
      status: r.status,
      ok: r.ok,
      latencyMs: Date.now() - start,
      contentType: r.headers.get('content-type'),
      contentLength: r.headers.get('content-length'),
      location: r.headers.get('location'),
      server: r.headers.get('server'),
    };
  } catch (e) {
    return { url: raw, error: String(e.name || e.message || e).slice(0, 120) };
  }
}

async function githubSnapshot(raw) {
  try {
    const u = new URL(raw);
    if (u.hostname.toLowerCase() !== 'github.com') return null;
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const owner = parts[0], repo = parts[1].replace(/\.git$/i, '');
    const r = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
      headers: { accept: 'application/vnd.github+json', 'user-agent': 'CryptoBountyOperator-Audit/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    const j = await r.json();
    if (!r.ok) return { repository: `${owner}/${repo}`, status: r.status, error: j.message || 'github_api_error' };
    return {
      repository: j.full_name,
      htmlUrl: j.html_url,
      description: j.description,
      createdAt: j.created_at,
      updatedAt: j.updated_at,
      pushedAt: j.pushed_at,
      defaultBranch: j.default_branch,
      stars: j.stargazers_count,
      forks: j.forks_count,
      openIssues: j.open_issues_count,
      archived: j.archived,
      disabled: j.disabled,
      visibility: j.visibility,
      license: j.license?.spdx_id || null,
      language: j.language,
      topics: j.topics || [],
    };
  } catch {
    return null;
  }
}

async function auditPayload(payload) {
  const collected = collect(payload);
  const textReports = collected.strings.slice(0, 40).map(s => ({ path: s.path, audit: textAudit(s.value) }));
  const explicitUrls = [];
  for (const s of collected.strings) {
    for (const m of s.value.matchAll(/https?:\/\/[^\s)\]}>'\"]+/gi)) explicitUrls.push(m[0]);
  }
  const urls = [...new Set(explicitUrls)].slice(0, 5);
  const urlReports = [];
  for (const url of urls) {
    const gh = await githubSnapshot(url);
    if (gh) urlReports.push({ kind: 'github', ...gh });
    else urlReports.push({ kind: 'url', ...(await safeUrlSnapshot(url)) });
  }
  return {
    service: 'CryptoBountyOperator-Audit',
    processedAt: new Date().toISOString(),
    structure: {
      rootType: Array.isArray(payload) ? 'array' : payload === null ? 'null' : typeof payload,
      objects: collected.objects,
      arrays: collected.arrays,
      keys: collected.keys,
      scalars: collected.scalars,
      stringFields: collected.strings.length,
      maxDepth: collected.maxDepth,
    },
    textReports,
    urlReports,
    note: 'Read-only deterministic analysis. No credentials, wallet actions, private-network fetches, or destructive operations are performed.'
  };
}

async function readBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > 1024 * 1024) throw Object.assign(new Error('payload_too_large'), { status: 413 });
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return { text: raw }; }
}

function accessToken(req, url, body) {
  const auth = req.headers.authorization || '';
  if (/^Bearer\s+/i.test(auth)) return auth.replace(/^Bearer\s+/i, '').trim();
  return req.headers['x-access-token'] || url.searchParams.get('access_token') || body.access_token || body.token || '';
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/health') return json(res, 200, { status: 'ok', botId: state.botId || null, ready: Boolean(state.botId), endpoint: ENDPOINT, lastError: state.lastError });
    if (url.pathname !== '/api/work') return json(res, 404, { error: 'not_found' });
    if (!['POST', 'PUT'].includes(req.method)) return json(res, 405, { error: 'method_not_allowed' });

    const body = await readBody(req);
    const token = accessToken(req, url, body);
    if (!token || !String(token).startsWith('hire_')) return json(res, 401, { error: 'missing_or_invalid_access_token' });
    const check = await reqApiCheck(token);
    if (!check.valid) return json(res, 403, { error: 'access_denied' });

    const payload = body.payload !== undefined ? body.payload : Object.fromEntries(Object.entries(body).filter(([k]) => !['access_token', 'token'].includes(k)));
    const result = await auditPayload(payload);
    return json(res, 200, { success: true, hire_id: check.hire_id || null, result });
  } catch (e) {
    state.lastError = String(e.message || e);
    return json(res, e.status || 500, { error: state.lastError.slice(0, 500) });
  }
}).listen(PORT, () => {
  console.log(JSON.stringify({ event: 'bothire_service_started', port: PORT, endpoint: ENDPOINT }));
  setTimeout(bootstrap, 1200);
});

async function reqApiCheck(token) {
  const r = await fetch(`${API}/api/hires/check-access?token=${encodeURIComponent(token)}`, { signal: AbortSignal.timeout(8000) });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = {}; }
  if (!r.ok) return { valid: false };
  return data;
}
