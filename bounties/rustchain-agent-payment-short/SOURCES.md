# Sources

1. RustChain bounty #16601 — package rules, two-phase accepted/queued/confirmation language:
   https://github.com/Scottcjn/rustchain-bounties/issues/16601

2. RustChain public payout implementation — `scripts/bounty_payout.py`, transfer path checks application response `ok` rather than treating transport success alone as payment:
   https://github.com/Scottcjn/rustchain-bounties/blob/main/scripts/bounty_payout.py

3. RustChain bounty #16471 — public audit scope and documented silent-success failure class, including HTTP 200 with application-level refusal:
   https://github.com/Scottcjn/rustchain-bounties/issues/16471

No private endpoints, credentials, unpublished benchmarks, token-price claims, or production secrets are used in this package.
