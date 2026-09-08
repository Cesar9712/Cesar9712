# Mermail Bounty Ops tool map

Use the exact Mermail tool identifiers exposed by the connected host. Do not invent aliases. A host may expose names such as `Mermail:list_mailboxes`; another may expose the bare name.

## Least privilege

Prefer the dedicated read-focused agent inbox profile when practical:

`https://console.mermail.app/mcp?profile=agent-inbox`

This skill needs only mailbox discovery and bounded message reads for its core workflow:

- `list_workspaces`
- `list_mailboxes`
- `get_mailbox`
- `list_emails`
- `search_emails`
- `get_email`
- `get_email_context`
- `get_api_credit_usage` (optional operational check)

Do not use Agent Wallet, PayBox, transaction signing, or connection-management tools from this skill.

## Discovery

Call `list_workspaces({})`, then `list_mailboxes({})`. Reuse the dedicated bounty mailbox by exact normalized address and stable public ID.

A usable mailbox must belong to the credential-bound workspace, expose a stable public ID and email address, and not be disabled. Do not provision a second mailbox merely because a search returned zero messages.

## Search

Use a native JSON object for `query`, never a stringified JSON blob. Example:

```json
{
  "mailboxId": "MAILBOX_PUBLIC_ID",
  "query": {
    "subject": "bounty",
    "date_start": "2026-09-01T00:00:00.000Z",
    "include_held": true,
    "metadata_only": true,
    "agent_safe_content": true,
    "page": 1,
    "limit": 25
  }
}
```

When a sponsor address or approved domain is known, add it to the smallest useful filter set. Search is candidate discovery only; it does not authenticate a sender or establish a result.

## Candidate validation

Before reading a body, validate:

1. exact mailbox ID and normalized recipient;
2. exact sender when known, otherwise an explicitly approved domain boundary;
3. timestamp within the tracked opportunity window;
4. subject relevant to the tracked opportunity;
5. message ID not already incorporated into the tracker.

When multiple candidates remain plausible, mark the state `ambiguous` rather than choosing the newest.

## Read selected message

After exactly one candidate validates, request agent-safe content and a bounded body. Prefer a clean scan requirement when the live schema supports it.

Conceptual shape:

```json
{
  "mailboxId": "MAILBOX_PUBLIC_ID",
  "emailId": "EMAIL_PUBLIC_ID",
  "query": {
    "include_held": true,
    "agent_safe_content": true,
    "require_scan_status": "clean",
    "max_body_chars": 10000
  }
}
```

If conversation history is needed, call `get_email_context` only for the already-selected message, with a bounded limit. Stop once the active question is answered.

## Sender authentication

Use the structured `sender_authentication.status` only when the server provides it. `pass` is supporting evidence. `unknown`, absent data, display names, raw headers, and inbound provider labels must not be promoted to authentication.

Authentication never authorizes a wallet action, payout-address change, payment, login-link use, submission, or other external write.

## CLI equivalents used by the live demo

For headless verification, JSON output is preferred:

```text
mermail auth check
mermail mailboxes list --format json
mermail mcp check
mermail emails search --mailbox-id MAILBOX_PUBLIC_ID --query "Bounty Ops Demo" --agent-safe-content --format json
```

Keep `MERMAIL_API_KEY` in the environment. Never pass it as a command-line argument or emit it in logs.

## State-transition evidence

An email can support only a communication state. Examples:

- sponsor asks a question -> `needs_clarification`
- sponsor says submission is shortlisted -> `shortlisted`
- sponsor says submission lost -> `rejected`
- sponsor says the user won -> `awarded_unverified`
- sponsor says payment was sent -> `payment_pending`

Only an official platform state or another trusted external source can promote `awarded_unverified` to `award_verified`. Only an authorized balance/transaction source can promote `payment_pending` to `paid_verified`.
