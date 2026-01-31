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
import { getConfig } from './utils/config.js';

const ALARM_NAME = 'gmail_grouper_poll';

chrome.runtime.onInstalled.addListener(async () => {
  await ensureAlarmFromConfig();
});

chrome.runtime.onStartup?.addListener(async () => {
  await ensureAlarmFromConfig();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg?.type === 'configUpdated') {
      await ensureAlarmFromConfig();
      sendResponse({ ok: true });
      return;
    }
    if (msg?.type === 'runNow') {
      await processUnreadThreads();
      sendResponse({ ok: true });
      return;
    }
    sendResponse({ ok: false });
  })().catch((e) => {
    console.error('onMessage failed', e);
    sendResponse({ ok: false, error: String(e) });
  });

  // keep channel open for async
  return true;
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  await processUnreadThreads();
});

async function ensureAlarmFromConfig() {
  const cfg = await getConfig();
  const periodInMinutes = Math.max(1, Number(cfg.pollMinutes) || 5);
  chrome.alarms.create(ALARM_NAME, { periodInMinutes });
}

async function refreshLabelCache(token) {
  // refresh label cache (name->id) occasionally
  const now = Date.now();
  const { labelCacheUpdatedAt = 0 } = await chrome.storage.local.get('labelCacheUpdatedAt');

  // refresh at most every 30 minutes
  if (now - labelCacheUpdatedAt < 30 * 60 * 1000) return;

  const labels = await listLabels(token);
  const map = {};
  for (const l of labels) map[l.name] = l.id;
  await chrome.storage.local.set({ labelNameToId: map, labelCacheUpdatedAt: now });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function processUnreadThreads() {
  const cfg = await getConfig();
  const token = await getAuthToken();

  await refreshLabelCache(token);

  const threads = await listUnreadThreads(token, { max: cfg.maxThreads });
  for (const t of threads) {
    try {
      await analyzeThread(t.id, token, cfg);
      // small delay to avoid hammering Gmail API
      await sleep(150);
    } catch (e) {
      console.error('analyzeThread failed', t.id, e);
    }
  }
}

async function analyzeThread(threadId, token, cfg) {
  const MANAGED_LABELS = cfg.managedLabels;

  // METADATA fetch is cheap and enough to read labelIds
  const meta = await getThreadMetadata(threadId, token);
  const labelIds = meta?.messages?.[0]?.labelIds || [];

  const { labelNameToId = {} } = await chrome.storage.local.get('labelNameToId');
  const managedLabelIds = MANAGED_LABELS.map((n) => labelNameToId[n]).filter(Boolean);

  const hasManaged = labelIds.some((id) => managedLabelIds.includes(id));
  if (hasManaged) {
    return; // inheritance: cost $0
  }

  // Avoid reprocessing unlabeled threads repeatedly.
  const { processedThreads = {} } = await chrome.storage.local.get('processedThreads');
  if (processedThreads[threadId]) return;

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
    // refresh label cache immediately
    await chrome.storage.local.set({ labelCacheUpdatedAt: 0 });
    await refreshLabelCache(token);
  }

  await applyLabelToThread(threadId, labelId, token);

  // mark thread as processed to reduce repeated LLM calls if Gmail hasn't synced labels yet
  processedThreads[threadId] = Date.now();
  await chrome.storage.local.set({ processedThreads });
}
