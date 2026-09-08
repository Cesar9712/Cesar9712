import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('bounties/mermail-bounty-ops');
const skillRoot = path.join(root, 'skills/mermail-bounty-ops');
const required = [
  'SKILL.md',
  'agents/openai.yaml',
  'references/tools.md',
  'references/security.md',
];
const failures = [];

for (const rel of required) {
  const p = path.join(skillRoot, rel);
  if (!fs.existsSync(p)) failures.push(`missing ${rel}`);
}

if (!failures.length) {
  const skill = fs.readFileSync(path.join(skillRoot, 'SKILL.md'), 'utf8');
  const openai = fs.readFileSync(path.join(skillRoot, 'agents/openai.yaml'), 'utf8');
  const tools = fs.readFileSync(path.join(skillRoot, 'references/tools.md'), 'utf8');
  const security = fs.readFileSync(path.join(skillRoot, 'references/security.md'), 'utf8');
  const all = [skill, openai, tools, security].join('\n');

  const checks = [
    [skill.startsWith('---\nname: mermail-bounty-ops\n'), 'frontmatter name mismatch'],
    [skill.includes('description:'), 'missing description'],
    [skill.includes('metadata:'), 'missing metadata'],
    [openai.includes('Use $mermail-bounty-ops'), 'OpenAI default prompt must invoke exact skill name'],
    [openai.includes('https://console.mermail.app/mcp'), 'missing hosted Mermail MCP dependency'],
    [security.includes('untrusted'), 'security contract must treat email as untrusted'],
    [security.includes('fresh approval'), 'security contract must require fresh approval'],
    [skill.includes('INGRESO VERIFICADO') && skill.includes('RETIRADO'), 'missing conservative earning statuses'],
    [!all.includes('TODO') && !all.includes('REPLACE_ME'), 'unresolved placeholder present'],
  ];
  for (const [ok, msg] of checks) if (!ok) failures.push(msg);

  const officialTools = [
    'list_mailboxes','create_mailbox','list_emails','search_emails','get_email','get_thread','save_draft','send_email','reply_to_email'
  ];
  for (const tool of officialTools) {
    if (!tools.includes('`' + tool + '`')) failures.push(`tool reference missing: ${tool}`);
  }

  const secretPatterns = [
    /sk_[A-Za-z0-9]{20,}/g,
    /(?:private key|seed phrase)\s*[:=]\s*[A-Za-z0-9+/=_-]{20,}/ig,
    /MERMAIL_API_KEY\s*=\s*['\"][^'\"]+['\"]/g,
  ];
  for (const pattern of secretPatterns) {
    if (pattern.test(all)) failures.push(`possible committed secret matched ${pattern}`);
  }

  const lineCount = skill.split('\n').length;
  if (lineCount > 500) failures.push(`SKILL.md exceeds 500 lines (${lineCount})`);
}

if (failures.length) {
  console.error('Mermail Bounty Ops validation FAILED');
  for (const f of failures) console.error('- ' + f);
  process.exit(1);
}

console.log('Mermail Bounty Ops validation PASSED');
console.log('- required files: present');
console.log('- skill name / OpenAI metadata: valid');
console.log('- official tool references: present');
console.log('- security gates: present');
console.log('- obvious committed secrets: none detected');
