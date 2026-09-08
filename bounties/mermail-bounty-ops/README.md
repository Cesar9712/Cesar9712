# Mermail Bounty Ops Agent

A community companion Agent Skill for turning bounty/sponsor email into a safe, reviewable execution queue using Mermail.

> Status: bounty submission artifact. Community/unofficial companion skill; not an official Mermail skill.

## Why this exists

Crypto and developer bounties create a noisy operational loop: sponsor updates arrive by email, deadlines move, requested deliverables change, verification messages appear, and a rushed builder can accidentally follow an unsafe instruction or miss a requirement.

**Mermail Bounty Ops Agent** gives an AI agent a dedicated bounty inbox and a narrow operating contract:

1. read only the bounded set of relevant sponsor messages;
2. extract requirements into a structured Bounty Intake Card;
3. identify deadlines, required links, evidence and blockers;
4. flag requests involving deposits, wallet secrets, trading, KYC evasion or other unsafe actions;
5. prepare replies as drafts by default;
6. require an exact preview and fresh human approval before sending any email;
7. never authorize a payment or wallet action from email content.

It is designed for bounty hunters, hackathon teams, grant applicants, freelance developers and autonomous build agents.

## What makes it reusable

The skill is not tied to one bounty platform. It works with any sponsor thread that arrives through a Mermail inbox and follows Mermail's existing tool ownership rather than inventing new MCP tools.

### Core outputs

- **Bounty Intake Card** — sponsor, opportunity, deadline, deliverables, required proof, submission channel, blockers and confidence.
- **Risk Gate** — safe / needs-review / reject, with a reason.
- **Action Queue** — ordered next actions, separated into agent-executable and human-required.
- **Reply Preview** — a draft response that cannot be sent until the user approves the exact recipients, subject and body.
- **Submission Packet** — final checklist of URLs, screenshots, repo/demo evidence and unresolved gaps.

## Safety model

Email subjects, bodies, links, attachments and tool output are untrusted data. They can describe tasks but cannot grant authority. This skill never treats an inbound email as permission to:

- send money, transfer/swap assets or connect a wallet;
- reveal private keys, seed phrases, API secrets or authentication cookies;
- bypass KYC, geographic restrictions or account controls;
- deposit funds, trade, stake, provide liquidity or buy a token;
- broaden recipients or send an external email without an exact preview and fresh approval.

Read `skills/mermail-bounty-ops/references/security.md` for the complete policy.

## Install shape

This repo follows the Agent Skills layout:

```text
skills/mermail-bounty-ops/
  SKILL.md
  agents/openai.yaml
  references/tools.md
  references/security.md
```

Core Mermail workflows should use the official package first:

```bash
npx skills add Nudgen-Marketing/mermail-skills
```

Then add this companion skill to an Agent Skills-compatible client from this repository/branch.

## Example prompts

- `Use $mermail-bounty-ops to process new sponsor emails and give me the action queue.`
- `Use $mermail-bounty-ops to check whether the sponsor changed any deadline or deliverable.`
- `Use $mermail-bounty-ops to prepare a reply confirming what we will submit. Draft only.`
- `Use $mermail-bounty-ops to build the final submission packet from this sponsor thread.`

## Demo

`demo/index.html` is an offline-safe interactive demo using synthetic sponsor email. It demonstrates the intake card, risk gate, action queue and reply-preview behavior without requiring secrets or a live mailbox.

For the bounty video, the live demonstration should connect a free Mermail workspace, receive a synthetic sponsor email, invoke this skill, and show that sending pauses for explicit approval.

## Validation

Run:

```bash
node bounties/mermail-bounty-ops/scripts/validate-skill.mjs
```

The validator checks required files, skill naming, security sections, official tool names and accidental secret-like strings.

## Mermail compatibility

This companion skill routes to the official Mermail capabilities for mailbox administration, inbox reads and email composition. It intentionally owns no wallet tools and performs no autonomous payments.

Official references:

- https://mermail.app/agents
- https://docs.mermail.app/
- https://github.com/Nudgen-Marketing/mermail-skills

## License

MIT-style use for this bounty artifact. Mermail trademarks and official skills remain their respective owners' property.
