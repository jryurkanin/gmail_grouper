// Extract text/plain (preferred) or fallback to snippet-ish content.

function b64urlDecode(str) {
  // Gmail uses base64url
  const pad = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bytes = atob(base64);
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes.charCodeAt(i));
  try {
    // best-effort utf-8
    return decodeURIComponent(escape(out));
  } catch {
    return out;
  }
}

function walkParts(payload, acc) {
  if (!payload) return;
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    acc.push(b64urlDecode(payload.body.data));
  }
  for (const p of payload.parts || []) walkParts(p, acc);
}

export function extractPlainText(messageFull) {
  const payload = messageFull?.payload;
  const texts = [];
  walkParts(payload, texts);
  if (texts.length) return texts.join('\n\n').trim();

  // fallback: Gmail provides snippet on FULL response sometimes
  return (messageFull?.snippet || '').trim();
}
