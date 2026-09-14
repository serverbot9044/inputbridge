(() => {
  const SOURCE = "inputbridge";
  const shared = globalThis.InputBridge;
  const commandMap = {
    leftUp: ["axis", 1, -1], leftDown: ["axis", 1, 1], leftLeft: ["axis", 0, -1], leftRight: ["axis", 0, 1],
    dpadUp: ["button", 12], dpadDown: ["button", 13], dpadLeft: ["button", 14], dpadRight: ["button", 15],
    a: ["button", 0], b: ["button", 1], x: ["button", 2], y: ["button", 3],
    lb: ["button", 4], rb: ["button", 5], lt: ["trigger", 6], rt: ["trigger", 7],
    view: ["button", 8], menu: ["button", 9], ls: ["button", 10], rs: ["button", 11]
  };

  let settings = shared.mergeSettings();
  let profile = shared.effectiveProfile(settings);
  let gameTitle = "";
  let lastAnnouncement = "";
  const held = new Set();

  const send = payload => window.postMessage({ source: SOURCE, ...payload }, location.origin);
  const log = (...values) => { if (settings.developer.consoleLogs) console.info("[InputBridge]", ...values); };
  const isTopFrame = window.top === window;

  function isTypingTarget(target) {
    return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
  }

  function bindingAction(code) {
    return Object.keys(profile.bindings).find(action => profile.bindings[action] === code) || null;
  }

  function relayCode(code, pressed, event) {
    const action = bindingAction(code);
    const command = commandMap[action];
    if (!settings.enabled || !command) return false;
    pressed ? held.add(code) : held.delete(code);
    const [kind, index, value] = command;
    if (kind === "axis") {
      const positive = profile.bindings[index === 0 ? "leftRight" : "leftDown"];
      const negative = profile.bindings[index === 0 ? "leftLeft" : "leftUp"];
      const axisValue = held.has(positive) ? 1 : held.has(negative) ? -1 : 0;
      send({ kind, index, value: axisValue, pressed: true });
    } else {
      send({ kind, index, value, pressed });
    }
    if (event) event.preventDefault();
    return true;
  }

  addEventListener("keydown", event => {
    if (isTypingTarget(event.target)) return;
    if (event.code === "Backquote" && profile.mouseLook) {
      if (document.pointerLockElement) document.exitPointerLock();
      else document.documentElement?.requestPointerLock().catch(() => {});
      event.preventDefault();
      return;
    }
    if (!event.repeat) relayCode(event.code, true, event);
  }, true);
  addEventListener("keyup", event => {
    if (!isTypingTarget(event.target)) relayCode(event.code, false, event);
  }, true);
  addEventListener("mousedown", event => relayCode(`Mouse${event.button}`, true, event), true);
  addEventListener("mouseup", event => relayCode(`Mouse${event.button}`, false, event), true);
  addEventListener("contextmenu", event => {
    if (settings.enabled && bindingAction("Mouse2")) event.preventDefault();
  }, true);
  addEventListener("mousemove", event => {
    if (!settings.enabled || !profile.mouseLook || !document.pointerLockElement) return;
    const scale = Math.max(0.1, settings.mouseSensitivity) / 28;
    send({ kind: "mouse", x: event.movementX * scale, y: event.movementY * scale * (settings.invertMouseY ? -1 : 1) });
  }, true);
  addEventListener("blur", resetInput);
  document.addEventListener("visibilitychange", () => { if (document.hidden) resetInput(); });

  function resetInput() {
    held.clear();
    send({ kind: "reset" });
  }

  function cleanGameTitle() {
    const candidates = [
      document.querySelector('[data-testid*="game-title" i]')?.textContent,
      document.querySelector('[class*="GameTitle"]')?.textContent,
      document.querySelector('[aria-label^="Playing " i]')?.getAttribute("aria-label")?.replace(/^Playing\s+/i, ""),
      document.querySelector('meta[property="og:title"]')?.content,
      document.querySelector("main h1")?.textContent,
      document.querySelector("h1")?.textContent,
      document.title,
      (() => {
        const slug = location.pathname.match(/\/play\/games\/([^/]+)/i)?.[1];
        return slug ? decodeURIComponent(slug).replace(/[-_]+/g, " ").replace(/\b\w/g, character => character.toUpperCase()) : "";
      })()
    ];
    for (const raw of candidates) {
      const value = (raw || "").replace(/\s*[|–—-]\s*(Xbox|Xbox Cloud Gaming|Microsoft).*$/i, "").replace(/^Play\s+/i, "").trim();
      if (value && !/^(xbox|cloud gaming|home|play)$/i.test(value)) return value.slice(0, 100);
    }
    return "Your game";
  }

  function resolveProfile(announce = false, force = false) {
    const nextTitle = cleanGameTitle();
    const nextProfile = shared.effectiveProfile(settings, nextTitle);
    const changed = nextTitle !== gameTitle || nextProfile.id !== profile.id;
    gameTitle = nextTitle;
    profile = nextProfile;
    if (changed || force) {
      resetInput();
      sendConfiguration();
      updateRuntimeStatus();
      updateDebugOverlay();
    }
    if (announce && changed && settings.showConnectionNotice && likelyGamePage()) showConnectionNotice();
  }

  function likelyGamePage() {
    return /\/play(?:\/|$)/i.test(location.pathname) || /cloud gaming/i.test(document.title);
  }

  function sendConfiguration() {
    send({
      kind: "config",
      enabled: settings.enabled,
      axisRampMs: settings.axisRampMs,
      placement: settings.developer.gamepadPlacement
    });
  }

  function updateRuntimeStatus() {
    if (!isTopFrame) return;
    chrome.storage.local.set({ runtimeStatus: { enabled: settings.enabled, gameTitle, presetId: profile.id, presetName: profile.name, mouseLook: profile.mouseLook, updatedAt: Date.now() } });
  }

  function showConnectionNotice(message) {
    if (!isTopFrame || !document.documentElement) return;
    const signature = message || `${gameTitle}:${profile.id}`;
    if (!message && signature === lastAnnouncement) return;
    lastAnnouncement = signature;
    document.querySelector("#inputbridge-notice-host")?.remove();
    const host = document.createElement("div");
    host.id = "inputbridge-notice-host";
    host.style.cssText = "all:initial;position:fixed;top:22px;left:50%;transform:translateX(-50%);z-index:2147483647;pointer-events:none";
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `<style>@keyframes enter{from{opacity:0;transform:translateY(-14px) scale(.97)}to{opacity:1;transform:none}}.card{display:flex;align-items:center;gap:12px;min-width:300px;max-width:520px;padding:12px 15px;border:1px solid rgba(255,255,255,.16);border-radius:16px;background:linear-gradient(135deg,rgba(17,24,39,.96),rgba(8,11,20,.96));box-shadow:0 16px 50px rgba(0,0,0,.45),0 0 30px rgba(139,92,246,.18);color:#f8fafc;font:500 13px/1.35 system-ui,sans-serif;backdrop-filter:blur(18px);animation:enter .32s ease}.mark{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:linear-gradient(135deg,#8b5cf6,#22d3ee);font-size:18px;box-shadow:0 0 20px rgba(34,211,238,.28)}strong{display:block;font-size:14px}.muted{color:#a5b4c7}</style><div class="card"><div class="mark">↯</div><div><strong>${escapeHtml(message || `${gameTitle} is connected with ${profile.name || "Default"}`)}</strong><div class="muted">${escapeHtml(message ? "InputBridge" : `InputBridge profile${profile.mouseLook ? " · ` toggles mouse capture" : ""}`)}</div></div></div>`;
    document.documentElement.append(host);
    setTimeout(() => host.remove(), 5200);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function validColor(value, fallback) {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  }

  function applyTheme() {
    if (!isTopFrame || !document.documentElement) return;
    let style = document.querySelector("#inputbridge-page-theme");
    if (!settings.themeEnabled) {
      style?.remove();
      chrome.runtime.sendMessage({ type: "inputbridge-theme-css", css: "" }).catch(() => {});
      return;
    }
    if (!style) { style = document.createElement("style"); style.id = "inputbridge-page-theme"; document.documentElement.append(style); }
    const theme = settings.theme;
    const accent = validColor(theme.accent, "#8b5cf6");
    const accent2 = validColor(theme.accent2, "#22d3ee");
    const background = validColor(theme.background, "#080b14");
    const surface = validColor(theme.surface, "#111827");
    const text = validColor(theme.text, "#f8fafc");
    const muted = validColor(theme.muted, "#94a3b8");
    const radius = Math.max(0, Math.min(28, Number(theme.radius) || 0));
    const glow = Math.max(0, Math.min(100, Number(theme.glow) || 0)) / 100;
    const full = settings.themeIntensity === "full";
    const shellSelectors = `header,nav,aside,[role="navigation"],[role="dialog"],[role="menu"],[role="listbox"],[class*="Header"],[class*="Navigation"],[class*="NavMenu"],[class*="Sidebar"],[class*="Drawer"],[class*="Dialog"],[class*="Modal"],[class*="Popover"]`;
    const surfaceSelectors = `[class*="PageContent"],[class*="HomePage"],[class*="Gallery"],[class*="SearchPage"],[class*="BrowsePage"],[class*="SettingsPage"],[class*="GameCard"] [class*="Metadata"],[class*="GameCard"] [class*="Details"]`;
    const shellParts = shellSelectors.split(",");
    const shellControls = shellParts.flatMap(selector => [`${selector} a`, `${selector} button`]).join(",");
    const shellMuted = shellParts.flatMap(selector => [`${selector} small`, `${selector} [class*="Subtitle"]`, `${selector} [class*="Description"]`]).join(",");
    const css = `
      :root{--if-accent:${accent};--if-accent2:${accent2};--if-bg:${background};--if-surface:${surface};--if-text:${text};--if-muted:${muted};--if-radius:${radius}px;color-scheme:dark;accent-color:${accent}}
      html,body{scrollbar-color:${accent} ${surface}}
      body{${full ? `background-color:${background}!important;color:${text}!important;` : ""}}
      ${full ? `${shellSelectors}{background-color:color-mix(in srgb,${surface} 94%,transparent)!important;color:${text}!important;border-color:color-mix(in srgb,${accent} 32%,transparent)!important;box-shadow:0 10px 35px color-mix(in srgb,${background} 60%,transparent)!important}${surfaceSelectors}{background-color:${background}!important;color:${text}!important}` : ""}
      button,[role="button"],input,select{border-radius:var(--if-radius)!important}
      button:not([disabled]):hover,[role="button"]:not([disabled]):hover{border-color:color-mix(in srgb,${accent} 55%,transparent)!important}
      a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid ${accent2}!important;outline-offset:2px!important}
      [aria-selected="true"],[aria-current="page"],[data-state="active"]{color:${accent2}!important;background-color:color-mix(in srgb,${accent} 18%,transparent)!important;border-color:color-mix(in srgb,${accent} 45%,transparent)!important}
      ${shellControls}{color:${text}!important}
      ${shellMuted}{color:${muted}!important}
      video,canvas{filter:none!important;background-color:#000!important}
      ::-webkit-scrollbar-thumb{background:linear-gradient(${accent},${accent2})!important;border-radius:20px}
      ::selection{background:color-mix(in srgb,${accent} 55%,transparent);color:${text}}
      ${glow ? `[aria-selected="true"],[aria-current="page"],[data-state="active"]{filter:drop-shadow(0 0 ${Math.round(16 * glow)}px ${accent})}` : ""}
    `;
    style.textContent = css;
    chrome.runtime.sendMessage({ type: "inputbridge-theme-css", css }).catch(() => {});
  }

  function updateDebugOverlay() {
    if (!isTopFrame || !document.documentElement) return;
    let node = document.querySelector("#inputbridge-debug");
    if (!settings.developer.debugOverlay) { node?.remove(); return; }
    if (!node) {
      node = document.createElement("div"); node.id = "inputbridge-debug";
      node.style.cssText = "position:fixed;right:12px;bottom:12px;z-index:2147483646;padding:8px 10px;border:1px solid #334155;border-radius:9px;background:#080b14e8;color:#dbeafe;font:11px/1.4 ui-monospace,monospace;pointer-events:none";
      document.documentElement.append(node);
    }
    node.textContent = `InputBridge · ${settings.enabled ? "ON" : "OFF"}\n${profile.name} · ${gameTitle}`;
  }

  function applySettings(next, announce = false) {
    settings = shared.mergeSettings(next);
    resolveProfile(announce, true);
    applyTheme();
    log("Settings applied", { profile: profile.id, gameTitle });
  }

  chrome.storage.sync.get({ settings: shared.DEFAULT_SETTINGS }, result => applySettings(result.settings, false));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.settings) applySettings(changes.settings.newValue, true);
  });

  if (isTopFrame) {
    const observe = () => {
      resolveProfile(true);
      applyTheme();
      new MutationObserver(() => {
        clearTimeout(observe.timer);
        observe.timer = setTimeout(() => resolveProfile(true), 700);
      }).observe(document.documentElement, { childList: true, subtree: true });
      setInterval(() => resolveProfile(true), 5000);
    };
    if (document.readyState === "loading") addEventListener("DOMContentLoaded", observe, { once: true }); else observe();
  }
})();
