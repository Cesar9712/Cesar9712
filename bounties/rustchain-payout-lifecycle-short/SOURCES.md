# Sources

## Primary source — Distribution Packages bounty #16601
https://github.com/Scottcjn/rustchain-bounties/issues/16601

Public rule used in this package:

`accepted → paid (two-phase: queued, confirms ~24h; we post the pending_id + tx)`

This supports the script’s statements that an accepted package enters a queued/pending stage, confirmation is described as approximately 24 hours later, and `pending_id` / transaction evidence are part of the published flow.

## Corroborating public source — README badge bounty #13949
https://github.com/Scottcjn/rustchain-bounties/issues/13949

That bounty explicitly describes its 2 RTC reward as a `24h-voidable pending transfer`, corroborating that pending settlement can be distinct from final confirmation in the RustChain bounty system.

## Accuracy boundary
This package does not claim every bounty settles on exactly the same schedule. It explains the public flow documented by #16601 and uses “roughly/about 24 hours” rather than an exact guarantee.
