# Source Map

All technical claims in this package are grounded in RustChain's public repository. No token-price, ROI, or guaranteed-profit claim is used.

## Source 1 — Main README
https://github.com/Scottcjn/Rustchain/blob/main/README.md

Relevant public claims used:
- RustChain describes itself as a DePIN for vintage hardware using Proof of Antiquity.
- The README states that older verified hardware receives higher weighting/multipliers than modern x86_64.
- The hardware fingerprint section lists six checks: clock-skew / oscillator drift, cache timing, SIMD identity, thermal drift entropy, instruction-path jitter, and anti-emulation detection.
- The server-side validation section says the node cross-validates SIMD features against claimed architecture, analyzes timing distributions, checks thermal anomalies, and looks for emulator/VM indicators.

## Source 2 — Whitepaper
https://github.com/Scottcjn/Rustchain/blob/main/docs/WHITEPAPER.md

Used as the canonical design reference for Proof of Antiquity terminology and the principle that attestation should establish the hardware identity before reward weighting is applied.

## Fact-check boundary
The short intentionally does **not** claim that virtualization detection is impossible to bypass, does not call the mechanism mathematically unforgeable, and does not quote speculative future token value. The wording is limited to what the project publicly says its checks are designed to detect and verify.
