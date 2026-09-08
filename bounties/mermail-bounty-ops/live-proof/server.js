const http = require('http');
const { URL } = require('url');
const { execFile } = require('child_process');

const PORT = Number(process.env.PORT || 10000);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const MAX_BUFFER = 1024 * 1024;

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body, null, 2));
}

function authorized(url) {
  return Boolean(ADMIN_TOKEN) && url.searchParams.get('token') === ADMIN_TOKEN;
}

function configured() {
  return Boolean(process.env.MERMAIL_API_KEY);
}

function run(args, timeout = 45000) {
  return new Promise((resolve, reject) => {
    execFile('mermail', args, {
      timeout,
      maxBuffer: MAX_BUFFER,
      env: process.env,
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
      resolve({ data, diagnostics: err || null });
    });
  });
}

function scalar(value, max = 160) {
  if (value == null) return null;
  const s = String(value);
  return s.length > max ? s.slice(0, max) + '…' : s;
}

function sanitizeMailboxList(value) {
  const rows = Array.isArray(value) ? value : (value?.data || value?.mailboxes || value?.items || []);
  if (!Array.isArray(rows)) return value;
  return rows.map(m => ({
    id: m.public_id || m.publicId || m.id || null,
    email: m.email || m.address || null,
    name: m.name || null,
    status: m.status || null,
  }));
}

function sanitizeEmails(value) {
  const rows = Array.isArray(value) ? value : (value?.data || value?.emails || value?.items || []);
  if (!Array.isArray(rows)) return value;
  return rows.slice(0, 20).map(e => ({
    id: e.id || e.public_id || null,
    from: scalar(e.from || e.sender),
    to: scalar(e.to),
    subject: scalar(e.subject),
    received_at: e.received_at || e.receivedAt || e.created_at || null,
    scan_status: e.scan_status || e.scanStatus || null,
    body_preview: scalar(e.text || e.body || e.preview, 500),
  }));
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === '/health') {
      return send(res, 200, {
        status: 'ok',
        mermailConfigured: configured(),
        purpose: 'Mermail Bounty Ops live proof; no wallet tools and no autonomous sends',
      });
    }

    if (!url.pathname.startsWith('/admin/')) return send(res, 404, { error: 'not found' });
    if (!authorized(url)) return send(res, 401, { error: 'unauthorized' });
    if (!configured()) return send(res, 412, { error: 'MERMAIL_API_KEY is not configured in the service environment' });

    if (url.pathname === '/admin/probe') {
      const doctor = await run(['doctor']);
      const auth = await run(['auth', 'check']);
      const mailboxResult = await run(['mailboxes', 'list', '--format', 'json']);
      const mcp = await run(['mcp', 'check']);
      return send(res, 200, {
        status: 'verified',
        doctor: doctor.data,
        auth: auth.data,
        mailboxes: sanitizeMailboxList(mailboxResult.data),
        mcp: mcp.data,
      });
    }

    if (url.pathname === '/admin/mailboxes') {
      const result = await run(['mailboxes', 'list', '--format', 'json']);
      return send(res, 200, { mailboxes: sanitizeMailboxList(result.data) });
    }

    if (url.pathname === '/admin/search') {
      const mailboxId = url.searchParams.get('mailboxId') || '';
      const query = url.searchParams.get('query') || '';
      if (!mailboxId || !query) return send(res, 400, { error: 'mailboxId and query are required' });
      const result = await run([
        'emails', 'search', '--mailbox-id', mailboxId,
        '--query', query, '--agent-safe-content', '--format', 'json'
      ]);
      return send(res, 200, { emails: sanitizeEmails(result.data) });
    }

    if (url.pathname === '/admin/get') {
      const mailboxId = url.searchParams.get('mailboxId') || '';
      const emailId = url.searchParams.get('emailId') || '';
      if (!mailboxId || !emailId) return send(res, 400, { error: 'mailboxId and emailId are required' });
      const result = await run([
        'emails', 'get', '--mailbox-id', mailboxId, '--email-id', emailId,
        '--agent-safe-content', '--max-body-chars', '12000', '--format', 'json'
      ]);
      return send(res, 200, { email: sanitizeEmails([result.data])[0] || result.data });
    }

    return send(res, 404, { error: 'unknown admin route' });
  } catch (e) {
    return send(res, 500, { error: String(e.message || e), exitCode: e.exitCode || null });
  }
}).listen(PORT, () => {
  console.log(JSON.stringify({
    event: 'mermail_live_proof_started',
    port: PORT,
    configured: configured(),
  }));
});
