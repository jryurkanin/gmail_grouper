const DEFAULTS = {
  pollMinutes: 5,
  managedLabels: ['AI_Finance', 'AI_Client', 'AI_Newsletter'],
  llmEndpoint: 'http://localhost:8787/classify',
  llmAuthToken: '',
  maxThreads: 25,
};

function el(id) {
  return document.getElementById(id);
}

function setStatus(msg) {
  el('status').textContent = msg;
}

async function load() {
  const stored = await chrome.storage.local.get(Object.keys(DEFAULTS));
  const cfg = { ...DEFAULTS, ...stored };

  el('pollMinutes').value = String(cfg.pollMinutes);
  el('managedLabels').value = (cfg.managedLabels || []).join('\n');
  el('llmEndpoint').value = cfg.llmEndpoint || DEFAULTS.llmEndpoint;
  el('llmAuthToken').value = cfg.llmAuthToken || '';
  el('maxThreads').value = String(cfg.maxThreads ?? DEFAULTS.maxThreads);
}

async function save() {
  const pollMinutes = Number(el('pollMinutes').value || DEFAULTS.pollMinutes);
  const managedLabels = el('managedLabels')
    .value.split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  const llmEndpoint = (el('llmEndpoint').value || DEFAULTS.llmEndpoint).trim();
  const llmAuthToken = (el('llmAuthToken').value || '').trim();
  const maxThreads = Number(el('maxThreads').value || DEFAULTS.maxThreads);

  await chrome.storage.local.set({ pollMinutes, managedLabels, llmEndpoint, llmAuthToken, maxThreads });

  // ping service worker to rebuild alarm schedule
  await chrome.runtime.sendMessage({ type: 'configUpdated' });
  setStatus('Saved.');
}

async function runNow() {
  await chrome.runtime.sendMessage({ type: 'runNow' });
  setStatus('Triggered run. Check service worker console for logs.');
}

el('save').addEventListener('click', () => save().catch((e) => setStatus(String(e))));
el('runNow').addEventListener('click', () => runNow().catch((e) => setStatus(String(e))));

load().catch((e) => setStatus(String(e)));
