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

async function register() {
  if (state.apiKey) return {configured:true, agentId:state.agentId || null};
  const out = await req('/api/agents/register', {
    method:'POST', headers:{'content-type':'application/json'},
    body:JSON.stringify({name:NAME, description:DESCRIPTION})
  });
  state.apiKey = out.api_key || out.apiKey || '';
  state.agentId = out.id || out.agent_id || out.agentId || '';
  if (!state.apiKey) throw new Error('Registration returned no api_key');
  console.log(JSON.stringify({event:'agenthansa_registered', agentId:state.agentId, apiKey:state.apiKey, referralCode:out.referral_code||null}));
  return {configured:true, agentId:state.agentId||null};
}

function solveChallenge(question) {
  const q = String(question||'').toLowerCase();
  const nums = [...q.matchAll(/-?\d+/g)].map(m=>Number(m[0]));
  if (!nums.length) return null;
  // Prefer clause-by-clause arithmetic for common word-problem challenge templates.
  let value = nums[0], used = 1;
  const parts = q.split(/[,.?;]/).map(x=>x.trim()).filter(Boolean);
  for (const p of parts) {
    const ns = [...p.matchAll(/-?\d+/g)].map(m=>Number(m[0]));
    if (!ns.length) continue;
    const n = ns[ns.length-1];
    if (used===1 && p.includes(String(nums[0]))) { used++; continue; }
    if (/(gains?|gets?|receives?|adds?|finds?|earns?|buys?|is given|are added|more)/.test(p)) value += n;
    else if (/(loses?|spends?|gives?|removes?|drops?|uses?|sells?|are taken|fewer|left after)/.test(p)) value -= n;
    else if (/(doubles?|twice)/.test(p)) value *= 2;
    else if (/(triples?)/.test(p)) value *= 3;
    else if (/(half|halves?)/.test(p)) value = Math.floor(value/2);
    used++;
  }
  if (Number.isFinite(value)) return Math.trunc(value);
  return null;
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
  try {
    const out = await req('/api/agents/alliance', {
      method:'PATCH', headers:{'content-type':'application/json'}, body:JSON.stringify({alliance:'blue'})
    });
    console.log(JSON.stringify({event:'agenthansa_alliance', result:out}));
    return out;
  } catch (e) {
    console.log(JSON.stringify({event:'agenthansa_alliance_skip', message:String(e.message||e).slice(0,300)}));
    return null;
  }
}

async function scan() {
  const tasks = [
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
    if (url.pathname==='/admin/credential-export') return send(res,200,{agentId:state.agentId||null,apiKey:state.apiKey||null});
    return send(res,404,{error:'unknown_admin_route'});
  } catch(e) { return send(res,e.status||500,{error:String(e.message||e).slice(0,700),data:e.data||null}); }
}).listen(PORT,()=>{
  console.log(JSON.stringify({event:'agenthansa_operator_started',port:PORT,name:NAME}));
  setTimeout(()=>cycle().catch(()=>{}),1500);
});

setInterval(()=>cycle().catch(()=>{}), 8*60*60*1000);
