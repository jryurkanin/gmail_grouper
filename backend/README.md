# gmail_grouper backend

Tiny HTTP API the extension calls for classification.

## Endpoints
- `GET /health`
- `POST /classify`

### POST /classify body
```json
{
  "allowedLabels": ["AI_Finance", "AI_Client", "AI_Newsletter"],
  "rootEmailText": "..."
}
```

Response:
```json
{ "label": "AI_Client" }
```

## Auth (recommended)
Set a shared secret and require it via header:
- env: `GMAIL_GROUPER_AUTH_TOKEN=...`
- client sends: `Authorization: Bearer <token>`

If `GMAIL_GROUPER_AUTH_TOKEN` is not set, auth is disabled (dev mode).

## Running locally
```bash
cd backend
npm i
export OPENAI_API_KEY=...
export OPENAI_MODEL=gpt-4o-mini
export GMAIL_GROUPER_AUTH_TOKEN=change-me
npm run dev
```

Deploy anywhere that can run Node (Render/Fly/Railway/etc.).
