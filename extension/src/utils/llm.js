// IMPORTANT: do not ship API keys in an extension.
// Use a backend that holds the LLM key.

const DEFAULT_ENDPOINT = 'http://localhost:8787/classify';

async function getSettings() {
  const { llmEndpoint, llmAuthToken } = await chrome.storage.local.get([
    'llmEndpoint',
    'llmAuthToken',
  ]);
  return {
    endpoint: llmEndpoint || DEFAULT_ENDPOINT,
    authToken: llmAuthToken || null,
  };
}

export async function classifyThread({ allowedLabels, rootEmailText }) {
  const { endpoint, authToken } = await getSettings();

  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ allowedLabels, rootEmailText }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM endpoint error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.label;
}
