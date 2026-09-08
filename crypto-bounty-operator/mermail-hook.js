const { execFile } = require('child_process');

const configured = Boolean(process.env.MERMAIL_API_KEY);
const MAX_BUFFER = 1024 * 1024;
const isChild = process.env.MERMAIL_HOOK_CHILD === '1';
const DEMO_MARKER = 'MBO-DEMO-2026-09-08';

function childEnv() {
  const env = { ...process.env, MERMAIL_HOOK_CHILD: '1' };
  delete env.NODE_OPTIONS;
  return env;
}

function run(args, timeout = 120000) {
  return new Promise((resolve, reject) => {
    execFile('npx', ['--yes', 'mermail-cli', ...args], {
      timeout,
      maxBuffer: MAX_BUFFER,
      env: childEnv(),
    }, (error, stdout, stderr) => {
      const out = String(stdout || '').trim();
      const err = String(stderr || '').trim();
      if (error) {
        const e = new Error(err || out || error.message);
        e.exitCode = error.code;
        return reject(e);
      }
      let data = out;
      try { data = JSON.parse(out); } catch {}
      resolve(data);
    });
  });
}

function rowsOf(value, keys = []) {
  if (Array.isArray(value)) return value;
  for (const key of keys) if (Array.isArray(value?.[key])) return value[key];
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function mailboxSummary(value) {
  return rowsOf(value, ['mailboxes', 'items']).map(m => ({
    id: m.public_id || m.publicId || m.id || null,
    email: m.email || m.address || null,
    name: m.name || m.display_name || null,
    status: m.status || null,
  }));
}

function emailSummary(value) {
  return rowsOf(value, ['emails', 'items']).slice(0, 10).map(e => ({
    id: e.public_id || e.publicId || e.id || null,
    from: e.from || e.sender || null,
    to: e.to || null,
    subject: e.subject || null,
    receivedAt: e.received_at || e.receivedAt || e.created_at || null,
    scanStatus: e.scan_status || e.scanStatus || null,
    senderAuth: e.sender_authentication?.status || e.senderAuthentication?.status || null,
  }));
}

function riskFlagsFrom(value) {
  const text = JSON.stringify(value || '').toLowerCase();
  const checks = [
    ['prompt_injection', ['ignore previous instructions', 'ignore all previous']],
    ['secret_exfiltration', ['reveal the mermail_api_key', 'api key', 'seed phrase', 'private key', 'recovery phrase']],
    ['payout_redirection', ['change the payout wallet', 'change payout', 'new payout address']],
    ['upfront_payment', ['send funds to unlock', 'pay to unlock', 'deposit to unlock']],
  ];
  return checks.filter(([, needles]) => needles.some(n => text.includes(n))).map(([name]) => name);
}

async function searchDemo(mailboxId) {
  const attempts = [
    ['--query', 'Mermail Bounty Ops'],
    ['--subject', 'Mermail Bounty Ops'],
    ['--query', 'DEMO'],
  ];
  let last = [];
  for (const selector of attempts) {
    try {
      const data = await run([
        'emails', 'search', '--mailbox-id', mailboxId,
        ...selector, '--include-held', '--agent-safe-content', '--format', 'json',
      ]);
      last = emailSummary(data);
      if (last.length) return last;
    } catch (e) {
      console.error(JSON.stringify({ event: 'mermail_demo_search_attempt_failed', selector, message: String(e.message || e) }));
    }
  }
  return last;
}

async function liveDemo(mailbox) {
  if (!mailbox?.id) return { status: 'no_mailbox' };

  const candidates = await searchDemo(mailbox.id);
  console.log(JSON.stringify({
    event: 'mermail_bounty_ops_demo_search', marker: DEMO_MARKER,
    candidateCount: candidates.length, candidates,
  }));

  const matching = candidates.filter(c => String(c.subject || '').toLowerCase().includes('mermail bounty ops'));
  if (matching.length !== 1 || !matching[0].id) {
    return { status: matching.length === 0 ? 'pending' : 'ambiguous', candidateCount: matching.length };
  }
  const selected = matching[0];

  const full = await run([
    'emails', 'get', '--mailbox-id', mailbox.id, '--email-id', selected.id,
    '--agent-safe-content', '--max-body-chars', '10000', '--format', 'json',
  ]);

  const riskFlags = riskFlagsFrom(full);
  const result = {
    status: riskFlags.length ? 'quarantined_demo' : 'validated_demo',
    messageId: selected.id,
    subject: selected.subject,
    scanStatus: selected.scanStatus,
    senderAuth: selected.senderAuth,
    riskFlags,
    externalActionTaken: false,
    secretsExposed: false,
    financialActionTaken: false,
  };
  console.log(JSON.stringify({ event: 'mermail_bounty_ops_demo_result', ...result }));
  return result;
}

async function probe() {
  if (!configured) {
    console.error(JSON.stringify({ event: 'mermail_probe', status: 'missing_key' }));
    return;
  }

  console.log(JSON.stringify({ event: 'mermail_probe', status: 'starting' }));
  try {
    const auth = await run(['auth', 'check']);
    console.log(JSON.stringify({ event: 'mermail_auth_verified', ok: true, authenticated: Boolean(auth?.authenticated ?? true) }));

    const mailboxRaw = await run(['mailboxes', 'list', '--format', 'json']);
    const mailboxes = mailboxSummary(mailboxRaw);
    console.log(JSON.stringify({ event: 'mermail_mailboxes_verified', ok: true, mailboxes }));

    const mcp = await run(['mcp', 'check']);
    console.log(JSON.stringify({ event: 'mermail_mcp_verified', ok: true, connected: Boolean(mcp?.connected ?? true), toolCount: mcp?.tools || null, profile: mcp?.profile || null }));

    const target = mailboxes.find(m => String(m.email || '').toLowerCase() === 'cryptobountyoperator@mermail.app') || mailboxes[0];
    const demo = await liveDemo(target);
    console.log(JSON.stringify({ event: 'mermail_probe', status: 'verified', demo }));
  } catch (e) {
    console.error(JSON.stringify({ event: 'mermail_probe', status: 'failed', message: String(e.message || e), exitCode: e.exitCode || null }));
  }
}

if (!isChild) {
  setTimeout(() => {
    probe().catch(e => console.error(JSON.stringify({ event: 'mermail_probe', status: 'failed', message: String(e.message || e) })));
  }, 1500);
}
