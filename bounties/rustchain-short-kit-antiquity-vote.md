# RustChain Shorts Kit — “What if old hardware got the advantage?”

Package type: C — YouTube Shorts / vertical clip kit
Author/claimant: @Cesar9712
AI disclosure: drafted and source-checked by an AI agent acting with authorization from @Cesar9712.

## One-line pitch
A 45–55 second vertical explainer showing the unusual core idea behind RustChain Proof of Antiquity: each unique CPU gets one vote per epoch, while reward weight can favor older hardware through antiquity multipliers instead of simply rewarding the fastest machine.

## Hook
**“What if a blockchain gave an old computer an advantage on purpose?”**

## Final script (target 45–55 seconds)

> What if a blockchain gave an old computer an advantage on purpose?
>
> RustChain calls the idea Proof of Antiquity.
>
> Its mining guide says each unique hardware device gets one vote per epoch. Instead of making raw speed the whole game, rewards are weighted with an antiquity multiplier based on the hardware’s age and verified device class.
>
> The protocol docs describe the core rule as “1 CPU = 1 Vote,” weighted by antiquity.
>
> That does **not** mean any machine can just claim to be old. RustChain’s code and specs include hardware-validation logic intended to cross-check device claims before a vintage tier is trusted.
>
> The interesting question is whether this can make useful participation possible for hardware most crypto systems would treat as obsolete.
>
> That is the experiment: not “fastest machine wins,” but “can old hardware still have a voice?”

## 9:16 shot list / exact capture instructions

1. **0–4s — Hook**
   - Full-screen text: “WHAT IF OLD HARDWARE GOT THE ADVANTAGE?”
   - Background: neutral close-up photo/video of an older desktop or laptop keyboard. Use only original, CC0, or generated material.
   - Fast push-in; no logos from unrelated brands needed.

2. **4–11s — Name the mechanism**
   - Screen capture the heading in `docs/PROTOCOL_v1.1.md` showing “Consensus: RIP-200 (Proof-of-Antiquity).”
   - Overlay: “Proof of Antiquity”.

3. **11–22s — One CPU, one vote**
   - Capture the relevant paragraph in `docs/MINING_GUIDE.md` that states each unique hardware device gets exactly one vote per epoch and rewards use an antiquity multiplier.
   - Highlight only the cited sentence.
   - Overlay: “1 unique CPU = 1 vote / epoch”.

4. **22–32s — Antiquity weighting**
   - Capture `CPU_ANTIQUITY_SYSTEM.md` title and a small readable portion of the multiplier table/documentation.
   - Overlay: “Reward weight can favor older verified hardware”.
   - Avoid quoting unsupported token prices or profit figures.

5. **32–42s — Anti-spoof point**
   - Capture `specs/RIP_POA_SPEC_v1.0.md` and/or `rip201_bucket_fix.py` around verified-device / cross-validation language.
   - Overlay: “Old-hardware claims are supposed to be verified”.

6. **42–55s — Close**
   - Return to old-computer visual.
   - Big text: “FASTEST MACHINE WINS? NOT THE ONLY MODEL.”
   - Final line: “Can old hardware still have a voice?”
   - End card: “RustChain — experimental Proof of Antiquity” + repo URL.

## Editing notes
- Canvas: 1080×1920, 30 fps.
- Keep repository text on screen long enough to read (minimum ~2 seconds per highlighted excerpt).
- Use captions for every spoken sentence.
- No price predictions, ROI claims, “guaranteed profit,” or invented benchmark numbers.
- Music, if used, must be original, CC0, or otherwise licensed for redistribution by Elyan Labs.
- Do not present the protocol as proven secure or profitable; call it experimental.

## Metadata

### Primary title
**What If Old Computers Got More Weight? RustChain in 50 Seconds**

### Alternate titles
- **Why RustChain Gives Vintage Hardware a Voice**
- **1 CPU = 1 Vote? Proof of Antiquity Explained**

### Description
RustChain experiments with Proof of Antiquity: one unique CPU gets one vote per epoch, while reward weight can incorporate an antiquity multiplier tied to verified hardware class. This Short explains the protocol idea without price hype or profit claims.

Source repository: https://github.com/Scottcjn/Rustchain

### Tags
RustChain, ProofOfAntiquity, VintageComputing, Blockchain, CryptoMining, OpenSource, PowerPC, RetroComputing, ShortExplainer

### Social caption
Most mining systems reward faster hardware. RustChain is experimenting with a different rule: one unique CPU gets one vote per epoch, with antiquity weighting for verified older hardware. Here is the idea in under a minute.

## Fact-to-source map

1. **Claim:** RustChain calls its consensus model RIP-200 / Proof of Antiquity.
   - Source: https://github.com/Scottcjn/Rustchain/blob/main/docs/PROTOCOL_v1.1.md
   - Source text describes “Consensus: RIP-200 (Proof-of-Antiquity).”

2. **Claim:** Each unique hardware device gets exactly one vote per epoch, with rewards influenced by an antiquity multiplier.
   - Source: https://github.com/Scottcjn/Rustchain/blob/main/docs/MINING_GUIDE.md
   - The mining guide states that each unique hardware device gets exactly one vote per epoch and rewards are split then multiplied by an antiquity multiplier based on hardware age.

3. **Claim:** The protocol’s core principle is “1 CPU = 1 Vote,” weighted by antiquity.
   - Source: https://github.com/Scottcjn/Rustchain/blob/main/docs/PROTOCOL_v1.1.md

4. **Claim:** The project documents CPU generation detection patterns and antiquity multipliers.
   - Source: https://github.com/Scottcjn/Rustchain/blob/main/CPU_ANTIQUITY_SYSTEM.md

5. **Claim:** The implementation/spec includes validation intended to cross-check claimed vintage hardware rather than trusting arbitrary payload strings.
   - Sources:
     - https://github.com/Scottcjn/Rustchain/blob/main/specs/RIP_POA_SPEC_v1.0.md
     - https://github.com/Scottcjn/Rustchain/blob/main/rip201_bucket_fix.py
   - The latter documents CPU brand-string cross-validation and evidence checks for vintage classification.

## Rights and license statement
This package is original work created for @Cesar9712. @Cesar9712 authorizes Elyan Labs to publish, edit, crop, caption, narrate, and distribute this package on its official channels with attribution to @Cesar9712, consistent with bounty #16601. No third-party visual or audio asset is bundled in this file; the shot list requires original, generated, or properly licensed assets only.
