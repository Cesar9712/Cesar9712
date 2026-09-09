const http = require('http');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 10000);
const BASE = process.env.AGENTHANSA_BASE_URL || 'https://www.agenthansa.com';
const NAME = process.env.AGENTHANSA_NAME || 'CryptoBountyOperator';
const DESCRIPTION = process.env.AGENTHANSA_DESCRIPTION || 'Autonomous research, coding, documentation, data analysis and safety-audit agent. Performs only legitimate, verifiable work and never handles private keys or seed phrases.';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

const state = {
  apiKey: process.env.AGENTHANSA_API_KEY || '',
  agentId: process.env.AGENTHANSA_AGENT_ID || '',
  lastRunAt: null,
  lastCheckin: null,
  lastEarnings: null,
  lastTransfers: null,
  lastError: null,
  feed: null,
  quests: null,
  community: null,
  collective: null,
};

function send(res, code, body) {
  res.writeHead(code, {'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});
  res.end(JSON.stringify(body, null, 2));
}
function isAdmin(url) { return Boolean(ADMIN_TOKEN) && url.searchParams.get('token') === ADMIN_TOKEN; }
async function req(path, options={}) {
  const headers = {...(options.headers||{})};
  if (state.apiKey) headers.Authorization = `Bearer ${state.apiKey}`;
  const r = await fetch(`${BASE}${path}`, {...options, headers, signal: AbortSignal.timeout(20000)});
  const text = await r.text();
  let data; try { data = JSON.parse(text); } catch { data = {raw:text}; }
  if (!r.ok) { const e = new Error(`AgentHansa ${r.status}: ${text.slice(0,700)}`); e.status=r.status; e.data=data; throw e; }
  return data;
}
function deep(obj, keys) {
  if (!obj || typeof obj !== 'object') return '';
  for (const k of keys) if (typeof obj[k] === 'string' && obj[k]) return obj[k];
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') {
      const found = deep(v, keys);
      if (found) return found;
    }
  }
  return '';
}

function solveChallenge(question) {
  const q = String(question||'').toLowerCase();
  const nums = [...q.matchAll(/-?\d+/g)].map(m=>Number(m[0]));
  if (!nums.length) return null;
  let value = nums[0];
  const parts = q.split(/[,.?;]/).map(x=>x.trim()).filter(Boolean);
  let firstSeen = false;
  for (const p of parts) {
    const ns = [...p.matchAll(/-?\d+/g)].map(m=>Number(m[0]));
    if (!ns.length) continue;
    const n = ns[ns.length-1];
    if (!firstSeen) { firstSeen = true; continue; }
    if (/(gains?|gets?|receives?|adds?|finds?|earns?|is given|are added|more|joins?)/.test(p)) value += n;
    else if (/(loses?|spends?|gives?|removes?|drops?|uses?|are taken|fewer|leaves?)/.test(p)) value -= n;
    else if (/(doubles?|twice)/.test(p)) value *= 2;
    else if (/(triples?)/.test(p)) value *= 3;
    else if (/(half|halves?)/.test(p)) value = Math.floor(value/2);
  }
  return Number.isFinite(value) ? Math.trunc(value) : null;
}

async function register() {
  if (state.apiKey) return {configured:true, agentId:state.agentId || null};
  let out = await req('/api/agents/register', {
    method:'POST', headers:{'content-type':'application/json'},
    body:JSON.stringify({name:NAME, description:DESCRIPTION})
  });

  if (out?.status === 'challenge_required' || (out?.challenge_id && out?.question && !deep(out,['api_key','apiKey','agent_api_key','agentApiKey']))) {
    const answer = solveChallenge(out.question);
    console.log(JSON.stringify({event:'agenthansa_register_challenge', challengeId:out.challenge_id, question:out.question, derivedAnswer:answer, instructions:out.instructions||null}));
    if (!Number.isInteger(answer)) throw new Error(`Unable to solve registration challenge: ${out.question}`);
    const payloads = [
      {challenge_id:out.challenge_id, challenge_answer:answer},
      {challenge_id:out.challenge_id, answer},
    ];
    const endpoints = ['/api/agents/register/verify','/api/agents/register/challenge','/api/agents/verify'];
    let verified = null, last = null;
    outer: for (const endpoint of endpoints) {
      for (const payload of payloads) {
        try {
          verified = await req(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
          break outer;
        } catch (e) { last=e; if (![404,405,422].includes(e.status)) break; }
      }
    }
    if (!verified) throw last || new Error('Registration challenge verification failed');
    out = verified;
  }

  state.apiKey = deep(out, ['api_key','apiKey','agent_api_key','agentApiKey']);
  state.agentId = deep(out, ['agent_id','agentId','id']);
  if (!state.apiKey) {
    console.log(JSON.stringify({event:'agenthansa_registration_shape', topKeys:Object.keys(out||{}), nestedAgentKeys:out?.agent&&typeof out.agent==='object'?Object.keys(out.agent):[], nestedDataKeys:out?.data&&typeof out.data==='object'?Object.keys(out.data):[]}));
    throw new Error('Registration returned no recognizable api_key');
  }
  console.log(JSON.stringify({event:'agenthansa_registered', agentId:state.agentId, referralCode:deep(out,['referral_code','referralCode'])||null}));
  return {configured:true, agentId:state.agentId||null};
}

async function checkin() {
  let out = await req('/api/agents/checkin', {method:'POST'});
  if (out?.status === 'challenge_required') {
    const answer = solveChallenge(out.question);
    console.log(JSON.stringify({event:'agenthansa_checkin_challenge', challengeId:out.challenge_id, question:out.question, derivedAnswer:answer}));
    if (!Number.isInteger(answer)) throw new Error(`Unable to solve checkin challenge: ${out.question}`);
    out = await req('/api/agents/checkin/verify', {
      method:'POST', headers:{'content-type':'application/json'},
      body:JSON.stringify({challenge_id:out.challenge_id, challenge_answer:answer})
    });
  }
  state.lastCheckin = out;
  console.log(JSON.stringify({event:'agenthansa_checkin_result', result:out}));
  return out;
}

async function chooseAlliance() {
  try {
    const a = await req('/api/agents/alliance');
    if (a?.alliance || a?.current_alliance) return a;
  } catch {}
  for (const alliance of ['royal','heavenly','terra','blue']) {
    try {
      const out = await req('/api/agents/alliance', {
        method:'PATCH', headers:{'content-type':'application/json'}, body:JSON.stringify({alliance})
      });
      console.log(JSON.stringify({event:'agenthansa_alliance', alliance, result:out}));
      return out;
    } catch {}
  }
  return null;
}

async function scan() {
  const tasks = [
    ['profile','/api/agents/me'],
    ['feed','/api/agents/feed'],
    ['earnings','/api/agents/earnings'],
    ['transfers','/api/agents/transfers'],
    ['daily','/api/agents/daily-quests'],
    ['quests','/api/alliance-war/quests'],
    ['community','/api/community/tasks'],
    ['collective','/api/collective/bounties'],
    ['tournaments','/api/arena/tournaments/upcoming'],
  ];
  const out = {};
  for (const [key,path] of tasks) {
    try { out[key] = await req(path); }
    catch (e) { out[key] = {error:String(e.message||e).slice(0,350)}; }
  }
  state.feed=out.feed; state.lastEarnings=out.earnings; state.lastTransfers=out.transfers;
  state.quests=out.quests; state.community=out.community; state.collective=out.collective;
  console.log(JSON.stringify({event:'agenthansa_scan', data:out}));
  return out;
}

async function cycle() {
  try {
    await register();
    await chooseAlliance();
    try { await checkin(); } catch (e) { console.log(JSON.stringify({event:'agenthansa_checkin_skip', message:String(e.message||e).slice(0,500)})); }
    const out = await scan();
    state.lastRunAt = new Date().toISOString(); state.lastError=null;
    return out;
  } catch (e) {
    state.lastError = String(e.message||e);
    console.error(JSON.stringify({event:'agenthansa_cycle_error', message:state.lastError.slice(0,700)}));
    throw e;
  }
}

http.createServer(async (req,res)=>{
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname==='/health') return send(res,200,{status:'ok',service:'agenthansa-operator',configured:Boolean(state.apiKey),agentId:state.agentId||null,lastRunAt:state.lastRunAt,lastError:state.lastError});
    if (!url.pathname.startsWith('/admin/')) return send(res,404,{error:'not_found'});
    if (!isAdmin(url)) return send(res,401,{error:'unauthorized'});
    if (url.pathname==='/admin/cycle') return send(res,200,await cycle());
    if (url.pathname==='/admin/scan') return send(res,200,await scan());
    if (url.pathname==='/admin/earnings') return send(res,200,await req('/api/agents/earnings'));
    if (url.pathname==='/admin/transfers') return send(res,200,await req('/api/agents/transfers'));
    return send(res,404,{error:'unknown_admin_route'});
  } catch(e) { return send(res,e.status||500,{error:String(e.message||e).slice(0,700),data:e.data||null}); }
}).listen(PORT,()=>{
  console.log(JSON.stringify({event:'agenthansa_operator_started',port:PORT,name:NAME}));
  setTimeout(()=>cycle().catch(()=>{}),1500);
});

setInterval(()=>cycle().catch(()=>{}), 8*60*60*1000);
