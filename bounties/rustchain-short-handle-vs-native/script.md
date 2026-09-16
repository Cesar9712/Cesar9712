# Script (about 50 seconds)

**Hook:** A RustChain payout can name a GitHub handle — but that is not the same thing as supplying a native RTC address.

Some RustChain bounty tooling supports a claimant handle as a payout fallback. That helps when a contributor has not registered a native address yet.

But newer distribution work, including the current package bounty, explicitly asks claimants for an address in native `RTC…` format and warns that bare handles can strand the balance.

So think of the two identifiers differently: your handle identifies **who** earned the reward; a native RTC address identifies **where** the network should settle it.

Before claiming, read the current bounty rules. If they require `RTC…`, use the native address. Never paste a seed phrase or private key — a receiving address is public; signing secrets are not.

**End card:** Read the live bounty spec before every claim.