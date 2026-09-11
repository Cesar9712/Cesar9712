# RustChain Shorts Kit — “Why 2²³ RTC?”

Bounty: Scottcjn/rustchain-bounties#16601 — Package Type C (Shorts / clip kit)
Author credit: @Cesar9712
Format: vertical 9:16, target runtime 45–55 seconds
License for this package: CC BY 4.0; Elyan Labs may publish with attribution to @Cesar9712 under the bounty terms.

## Hook

**“Why would a blockchain pick exactly 8,388,608 tokens? Because that number is 2²³.”**

## Narration script (~50s)

> RustChain’s maximum supply is **8,388,608 RTC** — exactly **2 to the 23rd power**.
>
> That is not a price promise, and it does not mean every token is already circulating. It is the protocol’s fixed supply ceiling.
>
> New mining rewards are distributed through Proof of Antiquity epochs. The current public documentation describes a fixed **1.5 RTC epoch pot**, shared among enrolled physical miners according to the network’s antiquity-weighted rules.
>
> The unusual part is the philosophy: instead of rewarding whoever buys the most new hash power, RustChain gives one participation slot per unique physical CPU and then weights rewards by hardware antiquity.
>
> So the number to remember is not a speculative price. It is the hard ceiling: **2²³ RTC**.
>
> Want to inspect it yourself? Start with the public RustChain repo and the live epoch endpoint.

## Vertical visual / capture plan

### 0:00–0:04 — Hook
- Full-screen terminal-style text: `8,388,608 RTC = 2²³`
- Small subtitle: `A binary-sized supply ceiling`
- Fast punch-in on `2²³`.

### 0:04–0:12 — “Not a price promise”
- Split screen:
  - left: `SUPPLY CAP`
  - right: crossed-out text `PRICE PREDICTION`
- Overlay: `Protocol parameter ≠ market promise`.

### 0:12–0:23 — Epoch rewards
- Screen-record the public RustChain README tokenomics/epoch section or a read-only request to the public epoch endpoint.
- Highlight only the fields needed for the narration.
- Overlay: `1.5 RTC epoch pot`.

### 0:23–0:38 — One CPU, one participation slot
- Simple animated diagram:
  - three physical computers → three circles labeled `1 CPU = 1 vote`
  - older machine receives a larger “antiquity weight” badge
  - no dollar values shown.
- Caption: `Unique physical hardware first; antiquity weighting second`.

### 0:38–0:47 — Fixed ceiling
- Binary counter animation stops at `8,388,608`.
- Under it: `2²³ — fixed supply ceiling`.

### 0:47–0:52 — CTA
- Show: `github.com/Scottcjn/Rustchain`
- Optional second line: `Inspect the live epoch data yourself`.

## Editing notes

- 1080×1920 preferred; safe-area centered for Shorts UI.
- Keep every numeric claim on screen long enough to read.
- No token-price graphics, green candles, “profit” wording, or guaranteed-return language.
- Use repo/terminal captures rather than invented dashboards.
- Narration should be neutral and technical, not promotional hype.

## Metadata

**Primary title**: Why RustChain Has Exactly 8,388,608 RTC

**Alternate titles**:
1. The Binary Number Behind RustChain’s Supply
2. Why 2²³ Is RustChain’s Supply Ceiling

**Description**:
RustChain documents a fixed maximum supply of 8,388,608 RTC (2²³) and an epoch-based Proof-of-Antiquity reward model. This short explains those protocol numbers without price predictions or investment claims.

Source / project: https://github.com/Scottcjn/Rustchain

**Tags**: RustChain, ProofOfAntiquity, blockchain, retrocomputing, DePIN, RTC, vintagecomputing

## Source map

1. RustChain main README / Tokenomics section — fixed total supply `8,388,608 RTC (2²³)` and epoch-reward description:
   https://github.com/Scottcjn/Rustchain
2. RustChain main README / Proof-of-Antiquity section — `1 CPU = 1 vote`, unique physical-device participation, antiquity weighting, and VM penalty framing:
   https://github.com/Scottcjn/Rustchain
3. Public epoch endpoint for production read-only verification at capture time:
   https://rustchain.org/epoch

## Fact-check guardrails

- Treat `8,388,608 RTC` as a documented maximum supply ceiling, not a current circulating-supply claim.
- Treat any USD reference rate as internal bounty/accounting context, not a guaranteed market price; this Short intentionally does not quote one.
- If the live epoch endpoint changes shape or values before publication, capture the current response and update only the relevant on-screen field rather than fabricating a value.
- Do not state that hardware fingerprinting is impossible to bypass; describe only the published design and current reward policy.