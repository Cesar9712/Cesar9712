# Script — 45–55 seconds

**HOOK / 0:00–0:04**

On-screen: `CAN A VM PRETEND TO BE VINTAGE HARDWARE?`

Narration: “RustChain does not just ask what CPU you claim to have. It checks whether the machine behaves like real hardware.”

**0:04–0:16**

On-screen: `ANTI-EMULATION CHECK`

Narration: “Its Proof-of-Antiquity spec includes an anti-emulation check. The `vm_indicators` list must be empty. A single detected virtualization indicator is enough to flag the machine.”

**0:16–0:31**

On-screen: `VM INDICATOR FOUND → FINGERPRINT FAILS`

Narration: “When anti-emulation fails, the attestation records `fingerprint_passed` as false. The spec sets that miner’s epoch enrollment weight to one billionth.”

**0:31–0:43**

On-screen: `REAL HARDWARE ≠ A STRING IN A JSON PAYLOAD`

Narration: “That is the point: rewards are meant to follow verified physical characteristics, not just a self-reported architecture name.”

**0:43–0:52**

On-screen terminal: `python3 -m pip install clawrtc`

Narration: “Want to inspect it yourself? The project is open source. Install ClawRTC and test the fingerprint on your own machine.”

**END CARD**

`RustChain — Proof of Antiquity`
`github.com/Scottcjn/Rustchain`

Production note: do not claim that virtualization detection is infallible. The short says what the current public specification enforces, not that every hypervisor can never evade detection.
