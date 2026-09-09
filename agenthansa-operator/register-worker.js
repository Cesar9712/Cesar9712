const http = require('http');
const BASE = 'https://www.agenthansa.com';
const PORT = Number(process.env.PORT || 10000);
const NAME = process.env.AGENTHANSA_NAME || 'CryptoBountyOperator-Cesar9712';
const WALLET = process.env.AGENTHANSA_WALLET || '0xb6e727732F845bDb7792C075B147658e84a173d2';
let apiKey = '';
let agentId = '';
let last = {};

async function req(path, options={}) {
  const headers = {...(options.headers||{})};
  if (apiKey) headers.authorization = `Bearer ${apiKey}`;
  const r = await fetch(BASE+path,{...options,headers,signal:AbortSignal.timeout(15000)});
  const text = await r.text(); let j; try{j=JSON.parse(text)}catch{j={raw:text}};
  if(!r.ok){const e=new Error(`${r.status}: ${text.slice(0,500)}`);e.status=r.status;e.data=j;throw e} return j;
}
function nums(q){return [...String(q).matchAll(/-?\d+(?:\.\d+)?/g)].map(m=>Number(m[0]))}
function solve(question){
  const q=String(question||'').toLowerCase(); const n=nums(q); if(!n.length)return null;
  let m=q.match(/from\s+(-?\d+)\s+to\s+(-?\d+)\s+inclusive/); if(m)return Math.abs(Number(m[2])-Number(m[1]))+1;
  m=q.match(/between\s+(-?\d+)\s+and\s+(-?\d+)\s+inclusive/); if(m)return Math.abs(Number(m[2])-Number(m[1]))+1;
  if(/how many.*inclusive/.test(q)&&n.length>=2)return Math.abs(n[1]-n[0])+1;
  if(/\b(sum|plus|add|added|altogether|total)\b/.test(q)&&n.length>=2)return n.reduce((a,b)=>a+b,0);
  if(/\b(product|times|multipl)/.test(q)&&n.length>=2)return n.reduce((a,b)=>a*b,1);
  if(/\b(minus|subtract|difference)\b/.test(q)&&n.length>=2)return n[0]-n[1];
  if(/\bhalf of\b/.test(q))return n[0]/2;
  let v=n[0];
  const events=[...q.matchAll(/(gains?|gets?|receives?|adds?|finds?|earns?|joins?|loses?|spends?|gives?|removes?|drops?|uses?|leaves?)\D{0,30}(-?\d+)/g)];
  if(events.length){for(const e of events){const x=Number(e[2]); if(/lose|spend|give|remove|drop|use|leave/.test(e[1]))v-=x;else v+=x}return v}
  if(n.length===2&&/how many/.test(q)) return Math.abs(n[1]-n[0])+1;
  return n[0];
}
async function run(){
  try{
    let r=await req('/api/agents/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:NAME,description:'Autonomous research, coding, QA, documentation and public-data worker.'})});
    if(r.challenge_id&&r.question){
      const answer=solve(r.question);
      console.log(JSON.stringify({event:'hansa_challenge',question:r.question,answer}));
      r=await req('/api/agents/register/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({challenge_id:r.challenge_id,challenge_answer:answer})});
    }
    apiKey=r.api_key||r.agent?.api_key||r.data?.api_key||''; agentId=r.id||r.agent_id||r.agent?.id||r.data?.id||'';
    if(!apiKey)throw new Error('No API key after verification: '+JSON.stringify(Object.keys(r||{})));
    console.log(JSON.stringify({event:'hansa_registered',agentId,balance:r.balance||r.agent?.balance||null}));
    try{const w=await req('/api/agents/wallet',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({wallet_address:WALLET})});console.log(JSON.stringify({event:'hansa_wallet',ok:true,result:w}))}catch(e){console.log(JSON.stringify({event:'hansa_wallet_error',message:e.message}))}
    try{let c=await req('/api/agents/checkin',{method:'POST'}); if(c.challenge_id&&c.question){const a=solve(c.question);console.log(JSON.stringify({event:'hansa_checkin_challenge',question:c.question,answer:a}));c=await req('/api/agents/checkin/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({challenge_id:c.challenge_id,challenge_answer:a})})}console.log(JSON.stringify({event:'hansa_checkin',result:c}))}catch(e){console.log(JSON.stringify({event:'hansa_checkin_error',message:e.message}))}
    try{last.earnings=await req('/api/agents/earnings');console.log(JSON.stringify({event:'hansa_earnings',result:last.earnings}))}catch(e){console.log(JSON.stringify({event:'hansa_earnings_error',message:e.message}))}
    try{last.transfers=await req('/api/agents/transfers');console.log(JSON.stringify({event:'hansa_transfers',result:last.transfers}))}catch(e){console.log(JSON.stringify({event:'hansa_transfers_error',message:e.message}))}
    try{last.payout=await req('/api/agents/request-payout',{method:'POST'});console.log(JSON.stringify({event:'hansa_payout_request',result:last.payout}))}catch(e){console.log(JSON.stringify({event:'hansa_payout_error',message:e.message}))}
  }catch(e){last.error=e.message;console.log(JSON.stringify({event:'hansa_worker_error',message:e.message}))}
}
http.createServer((q,s)=>{s.writeHead(200,{'content-type':'application/json'});s.end(JSON.stringify({ok:true,registered:!!apiKey,agentId,last}))}).listen(PORT,()=>setTimeout(run,1000));
