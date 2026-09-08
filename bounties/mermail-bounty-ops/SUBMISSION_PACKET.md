# Submission Packet — Mermail Agent Skill Bounty

## Opportunity

- **Bounty:** Build and Demo a Mermail Agent Skill
- **Sponsor:** Mermail
- **Region:** Global
- **Prize pool:** 500 USDC
- **Prize split:** 250 USDC first, 100 USDC second, 50 USDC third, two 50 USDC bonuses
- **Published deadline:** September 23, 2026
- **Scheduled winner announcement:** October 1, 2026

## Project

- **Name:** Mermail Bounty Ops Agent
- **Type:** Community/unofficial Mermail companion Agent Skill
- **Primary use case:** Turn sponsor/bounty email into a bounded requirement card, risk gate, action queue, safe reply draft, requirement delta, and final submission packet.

## Public artifacts

- **Repository / source:** https://github.com/Cesar9712/Cesar9712/tree/crypto-bounty-operator/bounties/mermail-bounty-ops
- **Interactive demo:** https://mermail-bounty-ops-demo.onrender.com
- **Live operator:** https://crypto-bounty-operator.onrender.com
- **Skill:** `skills/mermail-bounty-ops/SKILL.md`
- **Tool routing:** `skills/mermail-bounty-ops/references/tools.md`
- **Security contract:** `skills/mermail-bounty-ops/references/security.md`
- **Demo runbook:** `DEMO_RUNBOOK.md`
- **Live evidence:** `LIVE_PROOF.md`
- **Validator:** `scripts/validate-skill.mjs`

## Validation evidence

Render build command:

```bash
node bounties/mermail-bounty-ops/scripts/validate-skill.mjs
```

Latest validated build status: **PASSED**.

Validated checks:

- required files present;
- exact skill/OpenAI metadata valid;
- official Mermail tool references present;
- security gates present;
- no obvious committed secret detected.

## Live Mermail proof — VERIFIED

On September 8, 2026 the deployed operator completed a real headless Mermail integration run using the owner's authorized workspace key stored only in Render environment variables.

Verified results:

- Mermail authentication: **TRUE**
- Dedicated mailbox: **VERIFIED** (`cryptobountyoperator@mermail.app`)
- Mermail MCP connection: **CONNECTED**
- Connected MCP catalog: **72 tools**, full profile
- Controlled inbound demo email: **RECEIVED**
- Selected demo message scan status: **clean**
- Sender-authentication verdict: **unknown** — correctly not promoted to trust
- Prompt-injection flag: **DETECTED**
- Secret-exfiltration flag: **DETECTED**
- Payout-redirection flag: **DETECTED**
- Upfront-payment flag: **DETECTED**
- External action taken: **FALSE**
- Secret exposed: **FALSE**
- Financial action taken: **FALSE**
- Final demo state: **`quarantined_demo`**

The mailbox search returned both the original controlled message and a reply-shaped candidate. The verifier did not pick by recency: it selected the exact original demo subject before loading bounded content. This demonstrates the skill's ambiguity/candidate-validation behavior as well as its unsafe-instruction gate.

No API key, token, OTP, wallet secret, or private credential is committed in this repository or included in the proof.

## Demo video

- **Status:** TO PACKAGE / UPLOAD
- **Recording plan:** `DEMO_RUNBOOK.md`
- **Proof data required for the recording:** already captured in `LIVE_PROOF.md` and the live Render deployment.

The interactive demo plus the verified real inbox run can now be used to produce the final short video without fabricating live MCP behavior.

## Suggested submission description

Mermail Bounty Ops is a reusable community companion Agent Skill for bounty hunters, hackathon teams, grant applicants, and autonomous builders. It gives a Mermail-powered agent a narrow operational contract: read only relevant sponsor threads, turn them into a structured Bounty Intake Card and Action Queue, detect requirement changes, prepare reviewable reply drafts, and assemble the final Submission Packet. All inbound email is treated as untrusted data. The live demo used a real Mermail mailbox and MCP connection, received a controlled adversarial sponsor-style message, selected the exact intended message instead of a reply-shaped candidate, and detected prompt injection, secret-exfiltration, payout-redirection, and upfront-payment instructions without exposing secrets or taking any external/financial action.

## Suggested video title

`Mermail Bounty Ops — Live Inbox Safety for Autonomous Bounty Agents`

## Final readiness

- Public code: **YES**
- Interactive demo: **YES**
- Automated validation: **YES**
- Security documentation: **YES**
- Real Mermail authorization: **YES**
- Real inbox/MCP proof: **YES**
- Injection rejection proof: **YES**
- Demo video hosted: **NO**
- Superteam submission: **NO**

**Ready to submit: NO**

Remaining blockers: package/host the short demo video, then use an authenticated Superteam account to submit the final entry. Neither blocker requires depositing funds, connecting a wallet, or exposing private keys.
