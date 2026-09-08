const { execFile } = require('child_process');

const configured = Boolean(process.env.MERMAIL_API_KEY);
const MAX_BUFFER = 1024 * 1024;

function run(args, timeout = 120000) {
  return new Promise((resolve, reject) => {
    execFile('npx', ['--yes', 'mermail-cli', ...args], {
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
      resolve(data);
    });
  });
}

function sanitizeMailboxes(value) {
  const rows = Array.isArray(value) ? value : (value?.data || value?.mailboxes || value?.items || []);
  if (!Array.isArray(rows)) return { rawType: typeof value, ok: Boolean(value) };
  return rows.map(m => ({
    id: m.public_id || m.publicId || m.id || null,
    email: m.email || m.address || null,
    name: m.name || m.display_name || null,
    status: m.status || null,
  }));
}

async function probe() {
  if (!configured) {
    console.error(JSON.stringify({ event: 'mermail_probe', status: 'missing_key' }));
    return;
  }

  console.log(JSON.stringify({ event: 'mermail_probe', status: 'starting' }));
  try {
    const auth = await run(['auth', 'check']);
    console.log(JSON.stringify({ event: 'mermail_auth_verified', ok: true, result: auth }));

    const mailboxes = await run(['mailboxes', 'list', '--format', 'json']);
    console.log(JSON.stringify({ event: 'mermail_mailboxes_verified', ok: true, mailboxes: sanitizeMailboxes(mailboxes) }));

    const mcp = await run(['mcp', 'check']);
    console.log(JSON.stringify({ event: 'mermail_mcp_verified', ok: true, result: mcp }));

    console.log(JSON.stringify({ event: 'mermail_probe', status: 'verified' }));
  } catch (e) {
    console.error(JSON.stringify({ event: 'mermail_probe', status: 'failed', message: String(e.message || e), exitCode: e.exitCode || null }));
  }
}

setTimeout(() => {
  probe().catch(e => console.error(JSON.stringify({ event: 'mermail_probe', status: 'failed', message: String(e.message || e) })));
}, 1500);
