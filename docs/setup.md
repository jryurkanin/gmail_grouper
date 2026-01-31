# Setup

## 1) Create Google OAuth credentials (Chrome extension)
You need an OAuth client ID that works with Chrome extensions.

High level:
- Google Cloud Console → APIs & Services
- Enable **Gmail API**
- Create **OAuth Client ID** (Application type: **Chrome App / Extension**)
- Add your extension ID (Chrome generates it when loaded unpacked)

## 2) Configure manifest
Update `extension/manifest.json`:
- `oauth2.client_id`
- `oauth2.scopes` including `https://www.googleapis.com/auth/gmail.modify`

## 3) Load unpacked
- Chrome → Extensions → Developer mode → Load unpacked → select `extension/`

## 4) Configure the extension
Open extension options:
- Chrome → Extensions → Gmail Grouper → Details → Extension options

Set:
- Poll interval
- Managed labels
- Backend `llmEndpoint` (e.g. `https://your-host/classify`)
- Optional `llmAuthToken`

## 5) Run the backend
See `backend/README.md`.

## Notes
- For production distribution, align OAuth + Chrome Web Store listing.
- Don’t ship LLM API keys in the extension; use the backend.
