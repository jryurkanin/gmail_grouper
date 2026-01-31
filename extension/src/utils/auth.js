export async function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      const err = chrome.runtime.lastError;
      if (err) return reject(err);
      if (!token) return reject(new Error('No auth token returned'));
      resolve(token);
    });
  });
}
