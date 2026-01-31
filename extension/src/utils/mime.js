// Extract text/plain (preferred) or fallback to text/html -> text, or snippet.
import { htmlToText } from './html.js';

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

function walkParts(payload, accPlain, accHtml) {
  if (!payload) return;

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    accPlain.push(b64urlDecode(payload.body.data));
  }

  if (payload.mimeType === 'text/html' && payload.body?.data) {
    accHtml.push(b64urlDecode(payload.body.data));
  }

  for (const p of payload.parts || []) walkParts(p, accPlain, accHtml);
}

export function extractPlainText(messageFull) {
  const payload = messageFull?.payload;
  const plain = [];
  const html = [];
  walkParts(payload, plain, html);

  if (plain.length) return plain.join('\n\n').trim();

  if (html.length) return htmlToText(html.join('\n\n'));

  return (messageFull?.snippet || '').trim();
}
