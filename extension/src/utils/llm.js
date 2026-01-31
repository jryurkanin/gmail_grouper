// IMPORTANT: do not ship API keys in an extension.
// MVP: call a backend endpoint you control.

const DEFAULT_ENDPOINT = 'https://example.com/classify'; // replace

export async function classifyThread({ allowedLabels, rootEmailText }) {
  // Placeholder implementation.
  // Replace with your backend call or other classification logic.
  const res = await fetch(DEFAULT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ allowedLabels, rootEmailText }),
  });
  if (!res.ok) throw new Error(`LLM endpoint error: ${res.status}`);
  const data = await res.json();
  return data.label;
}
