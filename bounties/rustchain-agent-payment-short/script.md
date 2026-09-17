# Script (≈50 seconds)

**Hook:** “An agent says it paid another agent. What actually proves that?”

A payment has stages, and mixing them up creates false success.

First, the sender creates a transfer request. For a native wallet transfer, the important evidence is the destination, amount, and the signed request accepted by the node.

Second, some RustChain reward paths queue a pending transfer. Pending means scheduled for confirmation — not final money received yet.

Third, confirmation is the line that matters. A real success path should expose transaction evidence such as a pending ID or transaction record and should not call an application-level refusal a payment just because the HTTP request returned successfully.

So when you audit an agent payment, ask three questions: Was the request valid? Was a transfer actually queued? And was it confirmed?

**End card:** “Requested ≠ queued ≠ confirmed. Verify the effect, not the green check.”
