const DEFAULTS = {
  pollMinutes: 5,
  managedLabels: ['AI_Finance', 'AI_Client', 'AI_Newsletter'],
  llmEndpoint: 'http://localhost:8787/classify',
  llmAuthToken: null,
  maxThreads: 25,
};

export async function getConfig() {
  const stored = await chrome.storage.local.get(Object.keys(DEFAULTS));
  const cfg = { ...DEFAULTS, ...stored };
  // normalize
  cfg.pollMinutes = Number(cfg.pollMinutes) || DEFAULTS.pollMinutes;
  cfg.maxThreads = Number(cfg.maxThreads) || DEFAULTS.maxThreads;
  cfg.managedLabels = Array.isArray(cfg.managedLabels) && cfg.managedLabels.length ? cfg.managedLabels : DEFAULTS.managedLabels;
  cfg.llmEndpoint = (cfg.llmEndpoint || DEFAULTS.llmEndpoint).trim();
  cfg.llmAuthToken = cfg.llmAuthToken ? String(cfg.llmAuthToken) : null;
  return cfg;
}
