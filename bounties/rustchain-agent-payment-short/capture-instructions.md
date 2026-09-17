# Vertical capture instructions

Canvas: 1080×1920, ≤60 seconds.

0–4s: Large text: “Did the agent REALLY pay?”
4–14s: Three stacked cards animate in: REQUESTED → QUEUED → CONFIRMED.
14–25s: Terminal-style mock capture showing fields `to`, `amount_rtc`, `signature`; overlay: “valid request”. Do not display real keys or secrets.
25–36s: Replace with `pending_id: …`; overlay: “pending is not final”.
36–47s: Show a generic transaction/confirmation record; overlay: “verify the effect”.
47–55s: Split screen: green HTTP check on left, application body `{ok:false}` on right; strike through “PAID”.
55–60s: End card: “Requested ≠ queued ≠ confirmed”.

All visuals should be generated locally or recreated from public source shapes; never expose credentials, private keys, or production admin data.
