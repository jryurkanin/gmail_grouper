# Architecture (Thread-First)

## Loop
- Service worker runs on an interval (alarms API)
- Fetch unread threads
- For each thread:
  1) Fetch thread METADATA (cheap)
  2) Check for existing managed label IDs (inheritance)
  3) If missing, fetch full thread MINIMAL, select root message ID
  4) Fetch root message FULL, extract text body
  5) Classify with LLM
  6) Ensure label exists (create if needed)
  7) Apply label to thread

## Labels
Gmail API uses label **IDs**, not names.
- We maintain a mapping `{ name -> id }` in `chrome.storage.local`
- On startup / periodically: `users.labels.list` to refresh
- If LLM returns a new allowed label name and it doesn't exist: `users.labels.create`

## LLM
MVP: call an HTTPS endpoint you control (recommended) to keep API keys out of the extension.
Alternative: use a local-only dev key but do not ship keys in client code.

## Edge cases
- Topic drift: out of scope for MVP; later add a re-eval trigger (e.g., >10 messages)
- Forwards: root-in-inbox classification is acceptable
