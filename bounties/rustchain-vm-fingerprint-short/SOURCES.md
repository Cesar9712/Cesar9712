# Pinned Sources

Source repository commit used for this package: `aa584b344a766f6c0f8613ba7198d1cc7ffbae35`.

## Claim: `vm_indicators` must be empty; one indicator flags virtualization
https://github.com/Scottcjn/Rustchain/blob/aa584b344a766f6c0f8613ba7198d1cc7ffbae35/specs/RIP_POA_SPEC_v1.0.md

The anti-emulation table states that `vm_indicators` must have length 0 and that any single indicator is sufficient to flag virtualization.

## Claim: failed anti-emulation records fingerprint failure and negligible enrollment weight
https://github.com/Scottcjn/Rustchain/blob/aa584b344a766f6c0f8613ba7198d1cc7ffbae35/specs/RIP_POA_SPEC_v1.0.md

The enforcement section states that miners failing anti-emulation receive `fingerprint_passed = 0` in the attestation record and epoch enrollment weight `0.000000001`.

## Claim: ClawRTC installation command
https://github.com/Scottcjn/Rustchain/blob/aa584b344a766f6c0f8613ba7198d1cc7ffbae35/CONTRIBUTING.md

The contributor guide documents:

```bash
python3 -m pip install clawrtc
```

## Accuracy guardrail
The package intentionally does not say virtualization detection is perfect or impossible to bypass. It describes the behavior stated by the pinned public specification.
