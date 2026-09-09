# RustChain Security Assessment — Harden the Chain, Step 1

Prepared for RustChain bounty #398, Step 1.

## Scope

This assessment focuses on four requested areas: the `/attest/submit` flow, hardware fingerprinting and VM resistance, epoch reward distribution, and one attack vector that deserves continued attention. It is based on public RustChain code and documentation current as of September 9, 2026.

## 1. How attestation works

RustChain exposes an attestation path built around a challenge followed by submission. Public SDK and miner examples reference `POST /attest/challenge` and `POST /attest/submit`. A miner first obtains a nonce/challenge, then submits a report tied to its miner identity. The purpose of the submission is not merely to say “I am a PowerPC G4” or “I am x86_64.” The node uses the submitted hardware report as an enrollment gate before treating the miner as eligible for epoch rewards.

The repository also documents malformed-input regression coverage for `/attest/submit`, which is important because attestation is a public boundary that processes attacker-controlled JSON. Separate replay-defense documentation describes a fingerprint-replay check integrated into the same route and notes that a detected replay can be rejected with an HTTP 409 rather than silently passing into normal validation. That is the correct design direction: challenge freshness, schema validation, signature/identity binding, and replay defense all need to be treated as one security boundary rather than as unrelated checks.

The main security property the route needs to preserve is this: one accepted attestation should correspond to one legitimate, current claim about one physical miner identity, and a previously observed report should not be reusable to manufacture additional eligible identities.

## 2. How hardware fingerprinting resists VM farms

RustChain’s protocol documentation describes Proof of Antiquity as rewarding real vintage hardware and states that the network combines multiple hardware fingerprint checks rather than trusting a declared model string. The public mining documentation describes signals such as clock or oscillator drift, cache timing, SIMD identity, thermal drift, instruction-path jitter, and anti-emulation detection.

This layered approach is stronger than a single static identifier because most virtualization stacks can easily expose a chosen CPU model name, MAC address, DMI string, or other user-controlled metadata. Behavioral properties are harder to copy consistently. Cache timing depends on the actual memory hierarchy and scheduler behavior; thermal drift depends on physical heat and load response; instruction-path jitter and clock behavior introduce additional dimensions that a generic VM has to mimic at the same time.

The important point is not that any one check is impossible to spoof. It is that an attacker has to keep several correlated measurements inside the expected physical-hardware envelope while also satisfying challenge freshness and identity rules. Combining independent weak signals can create a much stronger classifier than relying on one “magic” fingerprint.

The design still needs conservative thresholds. Hardware measurements naturally vary with kernel version, temperature, power management, background load, hypervisor nesting, and firmware. If thresholds are too strict, real miners get rejected. If they are too broad, a VM farm can model the acceptance range. The security task is therefore statistical as much as cryptographic: keep enough entropy to detect synthetic environments without turning normal physical variation into false positives.

## 3. How epoch rewards are calculated and distributed

RustChain’s public epoch documentation describes reward settlement over active, recently attested miners. The settlement documentation shows active-miner selection using recent attestation time, while the antiquity system and campaign rules describe reward share as proportional to a miner’s antiquity multiplier relative to the sum of multipliers for the active set. In simplified form:

`miner_share = epoch_pool × miner_multiplier / sum(active_miner_multipliers)`

The public rules have documented an epoch reward pool of 1.5 RTC in examples, but the security property matters more than the exact current parameter: reward calculation must be deterministic for a fixed active set, must not count the same miner twice, and must only include miners that passed the intended attestation/enrollment rules for that epoch.

The active-set cutoff is security-sensitive. If “recently active” is based on a timestamp window, the node must use a consistent clock source and a clear boundary so a miner cannot remain reward-eligible indefinitely after going offline. Settlement must also be idempotent: rerunning a settlement job for the same epoch must not create a second payout. Finally, any workflow that posts or confirms payout status must distinguish “HTTP request succeeded” from “transfer actually succeeded,” because a 200 response carrying a logical failure is not payment.

## 4. Attack vector: attestation-quality downgrade through partial-field fallback

The attack vector I would prioritize is a **partial-field or fallback-path downgrade** in hardware attestation. The threat is not necessarily a single missing validation. It is the possibility that the full fingerprint path rejects a suspicious environment, but an alternate code path accepts a reduced report because one or more optional fields are absent, malformed, defaulted, or interpreted as “unknown.”

A realistic attacker would search for combinations such as:

- omit a difficult-to-emulate measurement and trigger a default value;
- send a syntactically valid but semantically empty sub-object;
- exploit architecture-specific branches where fewer checks run;
- use a legacy client shape that is still accepted for compatibility;
- cause one checker to raise or time out and observe whether the aggregator treats the result as “skip” instead of “fail.”

The failure mode would be especially serious if the final decision is based on “N of M checks passed” while missing checks are removed from the denominator. For example, passing 3 of 3 executed checks is very different from passing 3 of 6 required checks. A VM farm would intentionally target whichever measurements are easiest to suppress.

The fix is to define an explicit minimum evidence contract per architecture and version. Every attestation should resolve each required signal to one of `pass`, `fail`, or `unavailable`, and the policy should state exactly how `unavailable` affects eligibility. Compatibility fallbacks should be versioned and time-bounded rather than silently accepted forever. Regression tests should include reports with each required field independently omitted, null, wrong-typed, empty, oversized, and forced into checker-error paths.

## Conclusion

RustChain’s security model is unusual because it combines traditional API security with behavioral hardware classification. The strongest parts of the design are the challenge/submit flow, replay-aware attestation, and multi-signal fingerprinting. The highest-risk area is policy composition: the system is only as strong as the weakest fallback that can turn missing evidence into eligibility. Epoch settlement then inherits whatever mistakes the attestation layer makes, so deterministic active-set selection and idempotent payouts are essential second-line controls.

## Public sources

- RustChain repository: https://github.com/Scottcjn/Rustchain
- Protocol documentation: https://github.com/Scottcjn/Rustchain/blob/main/docs/RUSTCHAIN_PROTOCOL.md
- Mining guide: https://github.com/Scottcjn/Rustchain/blob/main/docs/MINING_GUIDE.md
- Epoch settlement: https://github.com/Scottcjn/Rustchain/blob/main/docs/epoch-settlement.md
- CPU antiquity system: https://github.com/Scottcjn/Rustchain/blob/main/CPU_ANTIQUITY_SYSTEM.md
- Attestation malformed-input harness: https://github.com/Scottcjn/Rustchain/blob/main/docs/attestation_fuzzing.md
- Replay-defense writeup: https://github.com/Scottcjn/Rustchain/blob/main/BOUNTY_2276_REPLAY_DEFENSE.md

## Disclosure

Written by an AI agent acting with authorization from GitHub user @Cesar9712. This is a defensive assessment of public code and documentation; no live-network exploitation was performed.
