import { getAuthToken } from './utils/auth.js';
import {
  listUnreadThreads,
  getThreadMetadata,
  getThreadMinimal,
  getMessageFull,
  applyLabelToThread,
  listLabels,
  createLabel,
} from './utils/gmail.js';
import { extractPlainText } from './utils/mime.js';
import { classifyThread } from './utils/llm.js';

const MANAGED_LABELS = ["AI_Finance", "AI_Client", "AI_Newsletter"]; // allowed output labels

const ALARM_NAME = 'gmail_grouper_poll';
const POLL_MINUTES = 5;

chrome.runtime.onInstalled.addListener(async () => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: POLL_MINUTES });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  await processUnreadThreads();
});

async function processUnreadThreads() {
  const token = await getAuthToken();

  // refresh label cache (name->id)
  await refreshLabelCache(token);

  const threads = await listUnreadThreads(token);
  for (const t of threads) {
    try {
      await analyzeThread(t.id, token);
    } catch (e) {
      console.error('analyzeThread failed', t.id, e);
    }
  }
}

async function refreshLabelCache(token) {
  const labels = await listLabels(token);
  const map = {};
  for (const l of labels) map[l.name] = l.id;
  await chrome.storage.local.set({ labelNameToId: map });
}

async function analyzeThread(threadId, token) {
  // METADATA fetch is cheap and enough to read labelIds
  const meta = await getThreadMetadata(threadId, token);
  const labelIds = meta?.messages?.[0]?.labelIds || [];

  const { labelNameToId = {} } = await chrome.storage.local.get('labelNameToId');
  const managedLabelIds = MANAGED_LABELS.map((n) => labelNameToId[n]).filter(Boolean);

  const hasManaged = labelIds.some((id) => managedLabelIds.includes(id));
  if (hasManaged) {
    console.log(`Thread ${threadId} already labeled. Skipping LLM.`);
    return;
  }

  const fullThread = await getThreadMinimal(threadId, token);
  const sorted = [...(fullThread.messages || [])].sort(
    (a, b) => Number(a.internalDate) - Number(b.internalDate)
  );
  const rootMessageId = sorted[0]?.id;
  if (!rootMessageId) return;

  const rootMsg = await getMessageFull(rootMessageId, token);
  const content = extractPlainText(rootMsg);

  const labelName = await classifyThread({
    allowedLabels: MANAGED_LABELS,
    rootEmailText: content,
  });

  if (!MANAGED_LABELS.includes(labelName)) {
    console.warn('LLM returned disallowed label:', labelName);
    return;
  }

  // Ensure label exists, create if needed
  let labelId = labelNameToId[labelName];
  if (!labelId) {
    const created = await createLabel(labelName, token);
    labelId = created.id;
    await refreshLabelCache(token);
  }

  await applyLabelToThread(threadId, labelId, token);
}
