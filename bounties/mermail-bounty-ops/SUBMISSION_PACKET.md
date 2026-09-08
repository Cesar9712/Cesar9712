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
- **Skill:** `skills/mermail-bounty-ops/SKILL.md`
- **Tool routing:** `skills/mermail-bounty-ops/references/tools.md`
- **Security contract:** `skills/mermail-bounty-ops/references/security.md`
- **Demo runbook:** `DEMO_RUNBOOK.md`
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

## Demo video

- **Status:** MISSING — requires a live authorized Mermail workspace/inbox session to prove real MCP behavior.
- **Recording plan:** `DEMO_RUNBOOK.md`

A synthetic/offline demo exists, but it must not be misrepresented as proof of a live Mermail MCP invocation.

## Live Mermail proof

- Mermail workspace: **NOT YET AUTHORIZED**
- Dedicated agent inbox: **NOT YET CREATED/VERIFIED**
- Live `search_emails` / `get_thread` proof: **NOT YET CAPTURED**
- Draft-first proof: **NOT YET CAPTURED**
- Injection rejection proof: **NOT YET CAPTURED**

## Suggested submission description

Mermail Bounty Ops is a reusable community companion Agent Skill for bounty hunters, hackathon teams, grant applicants, and autonomous builders. It gives a Mermail-powered agent a narrow operational contract: read only relevant sponsor threads, turn them into a structured Bounty Intake Card and Action Queue, detect requirement changes, prepare reviewable reply drafts, and assemble the final Submission Packet. All inbound email is treated as untrusted data. The skill refuses to let email authorize deposits, wallet actions, credential disclosure, KYC bypass, or other sensitive effects, and requires an exact preview plus fresh approval before any external email send. The included interactive demo shows both the normal workflow and an adversarial sponsor-email case, while the live demo runbook proves the same behavior against an authorized Mermail inbox.

## Suggested video title

`Mermail Bounty Ops — Turn Sponsor Email into a Safe Agent Execution Queue`

## Final readiness

- Public code: **YES**
- Interactive demo: **YES**
- Automated validation: **YES**
- Security documentation: **YES**
- Real Mermail inbox proof: **NO**
- Demo video: **NO**
- Superteam submission: **NO**

**Ready to submit: NO**

The only remaining blockers are the live Mermail authorization/demo recording and the authenticated Superteam submission flow.
