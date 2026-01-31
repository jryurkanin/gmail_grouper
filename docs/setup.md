# Setup

## 1) Create Google OAuth credentials (Chrome extension)
You need an OAuth client ID that works with Chrome extensions.

High level:
- Google Cloud Console → APIs & Services
- Enable **Gmail API**
- Create **OAuth Client ID** (Application type: **Chrome App / Extension**)
- Add your extension ID (Chrome generates it when loaded unpacked)

## 2) Configure manifest
Add:
- `oauth2.client_id`
- `oauth2.scopes` including `https://www.googleapis.com/auth/gmail.modify`

## 3) Load unpacked
- Chrome → Extensions → Developer mode → Load unpacked → select `extension/`

## 4) First run
- Extension will request Gmail consent.

## Notes
- For production distribution, you must align OAuth + Chrome Web Store listing.
- Don’t ship LLM API keys in the extension; use a backend.
