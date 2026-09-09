# RustChain Shorts Kit — “Can a VM Fake an Old Computer?”

Prepared for Elyan Labs bounty #16601, Package Type C.

## One-line pitch
A 45–55 second vertical explainer showing why RustChain’s Proof of Antiquity tries to verify physical-machine behavior instead of trusting a CPU name or user claim.

## Hook
**On-screen / spoken:** “A virtual machine can copy a CPU name. Can it copy the behavior of the real computer?”

## Final script (target 48–55 seconds)

**0–5s**
A virtual machine can copy a CPU name. Can it copy the behavior of the real computer?

**5–13s**
RustChain is a Proof of Antiquity experiment built around physical hardware, including older machines that most networks would treat as obsolete.

**13–28s**
Its mining documentation describes multiple fingerprint checks, including clock and oscillator drift, cache timing, SIMD identity, thermal drift, instruction-path jitter, and anti-emulation detection.

**28–39s**
The idea is simple: a label is easy to fake, but a bundle of timing, thermal, architecture, and virtualization signals is harder to reproduce consistently.

**39–48s**
That shifts the question from “how fast is your machine?” to “can the network verify what kind of physical machine is actually running?”

**48–55s**
If you have an old computer that still boots, read the RustChain mining guide and decide whether Proof of Antiquity makes sense to you.

## Exact capture instructions (9:16 vertical)

### Shot 1 — 0–5s
Visual: Split screen. Left side shows a generic VM window with a CPU label. Right side shows a real older laptop or beige desktop on a desk.
Overlay: `Same CPU name ≠ same machine`
Motion: Quick zoom toward the physical machine on the word “behavior.”

### Shot 2 — 5–13s
Visual: Browser capture of the RustChain GitHub repository, then scroll into the mining guide.
Overlay: `Proof of Antiquity`
Lower caption: `Physical hardware is part of the proof`

### Shot 3 — 13–28s
Visual: Six fast cards, roughly 2–3 seconds each:
1. Clock / oscillator drift
2. Cache timing
3. SIMD identity
4. Thermal drift
5. Instruction-path jitter
6. Anti-emulation
Use simple icons or terminal-text labels. Do not invent measurements.

### Shot 4 — 28–39s
Visual: Animated stack of signals merging into a single “physical machine fingerprint” card.
Overlay: `One label is easy to copy. A behavioral bundle is harder.`

### Shot 5 — 39–48s
Visual: Old machine running a terminal beside a modern laptop.
Overlay: `Not just speed → verifiable hardware identity`

### Shot 6 — 48–55s
Visual: Mining guide URL and repo title.
Overlay CTA: `Read the mining guide • Test only hardware you control`

## Editor notes
- Format: 1080×1920, 30 fps.
- Keep captions inside the center 80% safe area.
- Use only owned footage, original diagrams, public repo captures, or generated visuals with publication rights.
- No token-price graphics, earnings promises, or fabricated benchmark numbers.
- Keep source URLs in the description and optionally as a final 1-second card.

## Metadata

### Primary title
Can a VM Fake an Old Computer? RustChain’s Proof of Antiquity in 55 Seconds

### Alternate titles
1. Why RustChain Cares About Real Physical Hardware
2. Proof of Antiquity: The Anti-VM Idea Behind RustChain

### Short description
RustChain experiments with Proof of Antiquity: verifying real physical hardware using multiple behavioral signals rather than trusting a CPU label alone. This short summarizes the fingerprint checks described in the project’s public mining documentation.

Source code and docs:
https://github.com/Scottcjn/Rustchain
https://github.com/Scottcjn/Rustchain/blob/main/docs/MINING_GUIDE.md

### Tags
RustChain, Proof of Antiquity, vintage computing, old computers, physical hardware, virtualization, anti-VM, DePIN, hardware fingerprinting, open source

### Suggested caption
Old hardware usually loses the upgrade race. RustChain asks a different question: can the network verify that the physical machine is real? Here is the Proof of Antiquity idea in under a minute.

## Fact-to-source map

1. **Claim:** RustChain uses the term “Proof of Antiquity” and is designed around physical/vintage hardware participation.
   - Source: https://github.com/Scottcjn/Rustchain
   - Supporting guide: https://github.com/Scottcjn/Rustchain/blob/main/docs/MINING_GUIDE.md

2. **Claim:** The mining guide describes six fingerprint checks: clock/oscillator drift, cache timing, SIMD identity, thermal drift entropy, instruction-path jitter, and anti-emulation detection.
   - Source: https://github.com/Scottcjn/Rustchain/blob/main/docs/MINING_GUIDE.md

3. **Claim:** The purpose of combining hardware signals is to distinguish physical hardware characteristics rather than relying only on a declared CPU label.
   - Source basis: the fingerprinting and anti-emulation sections of the same mining guide. This line is explanatory framing, not a claim of perfect spoof resistance.

## Rights / attribution
Original script, storyboard, capture plan, and metadata by an AI agent acting with authorization from GitHub user @Cesar9712. Elyan Labs may publish the accepted package with attribution to @Cesar9712 under bounty #16601 terms.
