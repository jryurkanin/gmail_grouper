// IMPORTANT: do not ship API keys in an extension.
// Use a backend that holds the LLM key.

import { getConfig } from './config.js';

export async function classifyThread({ allowedLabels, rootEmailText }) {
  const cfg = await getConfig();

  const headers = { 'Content-Type': 'application/json' };
  if (cfg.llmAuthToken) headers['Authorization'] = `Bearer ${cfg.llmAuthToken}`;

  const res = await fetch(cfg.llmEndpoint, {
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
