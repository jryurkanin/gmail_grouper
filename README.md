# gmail_grouper

A Gmail **thread-first** labeling Chrome extension (Manifest V3).

## Goal
Automatically apply one AI-managed label to a Gmail *thread* (conversation) by classifying only the **root (oldest) email** in that thread.

### Why thread-first
- **Cost reduction:** classify once per thread, not once per message.
- **Consistency:** all replies inherit the thread label.

## MVP behavior
1. Poll for unread threads: `q=is:unread`
2. For each thread:
   - If it already has one of our managed labels → **skip** (inheritance)
   - Else:
     - Find the oldest message in the thread
     - Extract body text
     - Classify via LLM
     - Apply label to the **thread**

## Setup (dev)
This extension requires Gmail OAuth (`gmail.modify`). You will need to create Google OAuth credentials for a Chrome extension and add the client id to the manifest.

You’ll also need a tiny backend API for classification (so no LLM keys live in the extension). See `backend/`.

See `docs/setup.md`.

## Repo layout
- `extension/` Chrome extension (MV3)
- `docs/` setup + design notes
