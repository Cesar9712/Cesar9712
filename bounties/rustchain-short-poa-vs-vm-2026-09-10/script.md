# RustChain Shorts Kit — "Can a VM Fake Vintage Hardware?"

**Format:** vertical short, target runtime 52–58 seconds.

## Narration

**0:00–0:05 — Hook**
Can a cloud VM pretend to be a vintage computer and earn RustChain's old-hardware multiplier?

**0:05–0:14 — Core idea**
RustChain calls its model Proof of Antiquity. The network is designed to reward real physical machines, with older verified hardware receiving higher weighting than modern x86_64.

**0:14–0:31 — Verification**
Instead of trusting a self-reported model name, RustChain describes six hardware-fingerprint checks: oscillator drift, cache timing, SIMD identity, thermal entropy, instruction jitter, and anti-emulation detection.

**0:31–0:43 — Why the VM loses**
The server cross-checks the claimed architecture against measured signals and looks for patterns associated with virtualized or emulated hardware. A VM that only changes its reported CPU name does not reproduce the physical timing and thermal behavior of old silicon.

**0:43–0:53 — Takeaway**
So the interesting part is not raw hash rate. It is proving that the machine is real, and then weighting that verified hardware by its antiquity.

**0:53–0:58 — CTA**
Want to inspect it yourself? Start with the public RustChain repository and the miner quickstart.

## On-screen disclosure
Educational explainer based on RustChain's public README and documentation. No profit or price claim.
