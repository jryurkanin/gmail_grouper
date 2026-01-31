const API = 'https://gmail.googleapis.com/gmail/v1/users/me';

async function apiFetch(url, token, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail API ${res.status}: ${text}`);
  }
  return res.json();
}

export async function listUnreadThreads(token, { max = 50 } = {}) {
  // Handle pagination.
  const threads = [];
  let pageToken = undefined;

  while (threads.length < max) {
    const pageSize = Math.min(100, max - threads.length);
    const qp = new URLSearchParams();
    qp.set('q', 'is:unread');
    qp.set('maxResults', String(pageSize));
    if (pageToken) qp.set('pageToken', pageToken);

    const data = await apiFetch(`${API}/threads?${qp.toString()}`, token);
    for (const t of data.threads || []) threads.push(t);

    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }

  return threads;
}

export async function getThreadMetadata(threadId, token) {
  return apiFetch(`${API}/threads/${threadId}?format=METADATA`, token);
}

export async function getThreadMinimal(threadId, token) {
  return apiFetch(`${API}/threads/${threadId}?format=MINIMAL`, token);
}

export async function getMessageFull(messageId, token) {
  return apiFetch(`${API}/messages/${messageId}?format=FULL`, token);
}

export async function listLabels(token) {
  const data = await apiFetch(`${API}/labels`, token);
  return data.labels || [];
}

export async function createLabel(name, token) {
  const body = {
    name,
    labelListVisibility: 'labelShow',
    messageListVisibility: 'show',
    type: 'user',
  };
  return apiFetch(`${API}/labels`, token, { method: 'POST', body: JSON.stringify(body) });
}

export async function applyLabelToThread(threadId, labelId, token) {
  // threads.modify expects addLabelIds/removeLabelIds
  const body = {
    addLabelIds: [labelId],
    removeLabelIds: [],
  };
  return apiFetch(`${API}/threads/${threadId}/modify`, token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
