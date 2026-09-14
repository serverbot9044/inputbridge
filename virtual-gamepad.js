(() => {
  const SOURCE = "inputbridge";
  const state = {
    enabled: true,
    axes: [0, 0, 0, 0],
    targets: [0, 0, 0, 0],
    buttons: Array(17).fill(0),
    axisRampMs: 0,
    placement: "primary",
    virtualIndex: 0,
    mouseExpiresAt: 0,
    lastUpdate: performance.now()
  };

  function updateAxes() {
    const now = performance.now();
    const elapsed = Math.min(50, now - state.lastUpdate);
    state.lastUpdate = now;
    const step = state.axisRampMs ? Math.min(1, elapsed / state.axisRampMs) : 1;
    for (let index = 0; index < 2; index += 1) {
      state.axes[index] += (state.targets[index] - state.axes[index]) * step;
      if (Math.abs(state.axes[index]) < 0.001) state.axes[index] = 0;
    }
    if (now > state.mouseExpiresAt) {
      state.axes[2] = 0;
      state.axes[3] = 0;
    }
  }

  const makeButton = index => ({
    get pressed() { return state.buttons[index] > 0.5; },
    get touched() { return state.buttons[index] > 0; },
    get value() { return state.buttons[index]; }
  });
  const buttons = Array.from({ length: 17 }, (_, index) => makeButton(index));
  const virtual = {
    id: "InputBridge Virtual Standard Gamepad",
    get index() { return state.virtualIndex; },
    connected: true,
    mapping: "standard",
    get timestamp() { return performance.now(); },
    get axes() { updateAxes(); return state.axes.slice(); },
    buttons,
    vibrationActuator: null,
    hapticActuators: []
  };

  const nativeGetGamepads = navigator.getGamepads?.bind(navigator);
  Object.defineProperty(Navigator.prototype, "getGamepads", {
    configurable: true,
    value() {
      const nativePads = nativeGetGamepads ? Array.from(nativeGetGamepads()) : [];
      if (!state.enabled) return nativePads;
      if (state.placement === "first-empty") {
        const result = nativePads.slice();
        const empty = result.findIndex(item => !item);
        const slot = empty < 0 ? result.length : empty;
        state.virtualIndex = slot;
        result[slot] = virtual;
        return result;
      }
      state.virtualIndex = 0;
      return [virtual, ...nativePads.filter(Boolean)];
    }
  });

  addEventListener("message", event => {
    if (event.origin !== location.origin || event.data?.source !== SOURCE) return;
    const { kind, index, value, pressed } = event.data;
    if (kind === "config") {
      state.enabled = event.data.enabled;
      state.axisRampMs = event.data.axisRampMs || 0;
      state.placement = event.data.placement || "primary";
      return;
    }
    if (kind === "reset") {
      state.axes.fill(0); state.targets.fill(0); state.buttons.fill(0); return;
    }
    if (!state.enabled) return;
    if (kind === "button" || kind === "trigger") state.buttons[index] = pressed ? 1 : 0;
    if (kind === "axis") state.targets[index] = pressed ? value : 0;
    if (kind === "mouse") {
      state.axes[2] = Math.max(-1, Math.min(1, event.data.x));
      state.axes[3] = Math.max(-1, Math.min(1, event.data.y));
      state.mouseExpiresAt = performance.now() + 45;
    }
  });
})();
