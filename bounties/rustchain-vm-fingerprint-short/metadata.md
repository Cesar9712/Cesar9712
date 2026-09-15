# Metadata

## Primary title
Can a VM Fool RustChain? The Anti-Emulation Check in 55 Seconds

## Alternate titles
- RustChain’s VM Test: Why a Fake CPU Name Is Not Enough
- Proof of Antiquity: What Happens When RustChain Detects a VM

## Hook
Can a virtual machine pretend to be vintage hardware and collect the same reward weight?

## Description
RustChain’s public Proof-of-Antiquity specification includes an anti-emulation check. The published spec says `vm_indicators` must be empty, and a failed anti-emulation result records `fingerprint_passed = 0` and reduces epoch enrollment weight to `0.000000001`.

This Short walks through that rule directly from the open-source specification. It does not claim the detector is infallible and contains no price or profit claims.

Source: https://github.com/Scottcjn/Rustchain

Install / inspect:
`python3 -m pip install clawrtc`

## Tags
RustChain, Proof of Antiquity, vintage computing, virtual machines, anti-emulation, open source, blockchain, hardware fingerprinting, ClawRTC

## Suggested caption
A self-reported CPU name is not the whole proof. RustChain’s public PoA spec checks anti-emulation evidence and heavily reduces enrollment weight when that check fails. Here is the rule straight from the source.

## CTA
Inspect the source, run the miner on hardware you control, and verify what it reports.
