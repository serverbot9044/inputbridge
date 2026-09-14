async function applyThemeCss(message, sender) {
  const tabId = sender.tab?.id;
  if (tabId === undefined) return { ok: false };
  const frameId = sender.frameId ?? 0;
  const target = { tabId, frameIds: [frameId] };
  const key = `${tabId}:${frameId}`;
  const stored = await chrome.storage.session.get("appliedThemeCss");
  const applied = stored.appliedThemeCss || {};
  if (applied[key]) {
    try { await chrome.scripting.removeCSS({ target, css: applied[key], origin: "AUTHOR" }); } catch {}
    delete applied[key];
  }
  if (message.css) {
    await chrome.scripting.insertCSS({ target, css: message.css, origin: "AUTHOR" });
    applied[key] = message.css;
  }
  await chrome.storage.session.set({ appliedThemeCss: applied });
  return { ok: true };
}

let themeQueue = Promise.resolve();
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type !== "inputbridge-theme-css") return false;
  themeQueue = themeQueue.catch(() => {}).then(() => applyThemeCss(message, sender));
  themeQueue.then(respond).catch(error => respond({ ok: false, error: error.message }));
  return true;
});
