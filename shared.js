(() => {
  // Creator signature: serverbot9044 / Nicholas D.
  const DEFAULT_BINDINGS = {
    leftUp: "KeyW", leftDown: "KeyS", leftLeft: "KeyA", leftRight: "KeyD",
    dpadUp: "ArrowUp", dpadDown: "ArrowDown", dpadLeft: "ArrowLeft", dpadRight: "ArrowRight",
    a: "KeyJ", b: "KeyK", x: "KeyU", y: "KeyI", lb: "KeyQ", rb: "KeyE",
    lt: "Digit1", rt: "Digit3", view: "ShiftLeft", menu: "Enter", ls: "KeyZ", rs: "KeyC"
  };

  const PRESETS = {
    default: {
      name: "Default", icon: "◆", description: "The dependable all-round layout.",
      bindings: DEFAULT_BINDINGS, mouseLook: false
    },
    shooter: {
      name: "Shooter", icon: "◎", description: "Familiar FPS actions and mouse-button triggers.",
      bindings: { ...DEFAULT_BINDINGS, a: "Space", b: "ControlLeft", x: "KeyR", y: "Digit4", lb: "KeyQ", rb: "KeyE", lt: "Mouse2", rt: "Mouse0", view: "Tab", menu: "Escape", ls: "ShiftLeft", rs: "KeyV" },
      mouseLook: true
    },
    racing: {
      name: "Racing", icon: "◒", description: "A/D steering with W/S mapped to throttle and brake.",
      bindings: { ...DEFAULT_BINDINGS, leftUp: "", leftDown: "", lt: "KeyS", rt: "KeyW", a: "Space", b: "KeyB", x: "KeyR", y: "KeyY" },
      mouseLook: false
    },
    adventure: {
      name: "Adventure", icon: "◇", description: "Comfortable exploration and action controls.",
      bindings: { ...DEFAULT_BINDINGS, a: "Space", b: "ShiftLeft", x: "KeyE", y: "KeyF", lb: "KeyQ", rb: "KeyR", lt: "Mouse2", rt: "Mouse0", view: "Tab", menu: "Escape" },
      mouseLook: true
    },
    platformer: {
      name: "Platformer", icon: "△", description: "Movement and face buttons grouped around the left hand.",
      bindings: { ...DEFAULT_BINDINGS, a: "Space", b: "ShiftLeft", x: "KeyF", y: "KeyE", lb: "KeyQ", rb: "KeyR", lt: "KeyZ", rt: "KeyX", view: "Tab", menu: "Escape" },
      mouseLook: false
    },
    sports: {
      name: "Sports", icon: "◉", description: "Balanced face-button access with movement on WASD.",
      bindings: { ...DEFAULT_BINDINGS, a: "KeyL", b: "KeyK", x: "KeyJ", y: "KeyI", lb: "KeyQ", rb: "KeyE", lt: "ShiftLeft", rt: "Space" },
      mouseLook: false
    }
  };

  const ACTIONS = [
    ["Movement", [["leftUp", "Left stick up"], ["leftDown", "Left stick down"], ["leftLeft", "Left stick left"], ["leftRight", "Left stick right"]]],
    ["D-pad", [["dpadUp", "D-pad up"], ["dpadDown", "D-pad down"], ["dpadLeft", "D-pad left"], ["dpadRight", "D-pad right"]]],
    ["Controller", [["a", "A"], ["b", "B"], ["x", "X"], ["y", "Y"], ["lb", "Left bumper"], ["rb", "Right bumper"], ["lt", "Left trigger"], ["rt", "Right trigger"], ["view", "View"], ["menu", "Menu"], ["ls", "Left stick click"], ["rs", "Right stick click"]]]
  ];

  const DEFAULT_SETTINGS = {
    schemaVersion: 1,
    enabled: true,
    presetMode: "auto",
    manualPreset: "default",
    customBindings: { ...DEFAULT_BINDINGS },
    autoDetect: true,
    showConnectionNotice: true,
    mouseLook: false,
    mouseSensitivity: 1,
    invertMouseY: false,
    axisRampMs: 0,
    themeEnabled: true,
    themeStyle: "flux",
    themeIntensity: "full",
    theme: { accent: "#8b5cf6", accent2: "#22d3ee", background: "#080b14", surface: "#111827", text: "#f8fafc", muted: "#94a3b8", radius: 14, glow: 35 },
    developer: { debugOverlay: false, consoleLogs: false, gamepadPlacement: "primary" }
  };

  const RULES = {
    racing: ["forza", "f1 ", "motorsport", "racing", "rally", "need for speed", "dirt", "wreckfest", "hot wheels"],
    shooter: ["halo", "call of duty", "battlefield", "doom", "far cry", "gears", "overwatch", "fortnite", "sniper", "rainbow six", "wolfenstein", "borderlands"],
    sports: ["ea sports", "fifa", "madden", "nba", "nhl", "mlb", "cricket", "football", "soccer", "golf", "tennis", "skate"],
    platformer: ["ori", "hollow knight", "celeste", "psychonauts", "banjo", "crash", "spyro", "sonic", "platform"],
    adventure: ["assassin", "tomb raider", "starfield", "elder scrolls", "fallout", "avowed", "outer worlds", "dishonored", "minecraft", "sea of thieves"]
  };

  function mergeSettings(value = {}) {
    return {
      ...DEFAULT_SETTINGS,
      ...value,
      customBindings: { ...DEFAULT_BINDINGS, ...(value.customBindings || {}) },
      theme: { ...DEFAULT_SETTINGS.theme, ...(value.theme || {}) },
      developer: { ...DEFAULT_SETTINGS.developer, ...(value.developer || {}) }
    };
  }

  function guessPreset(title = "") {
    const candidate = title.toLowerCase();
    for (const [preset, words] of Object.entries(RULES)) {
      if (words.some(word => candidate.includes(word))) return { preset, confidence: "keyword" };
    }
    return { preset: "default", confidence: "fallback" };
  }

  function effectiveProfile(settings, gameTitle = "") {
    let id = settings.manualPreset;
    if (settings.presetMode === "auto" && settings.autoDetect) id = guessPreset(gameTitle).preset;
    if (id === "custom") return { id, name: "Custom", icon: "✦", bindings: settings.customBindings, mouseLook: settings.mouseLook };
    const preset = PRESETS[id] || PRESETS.default;
    return { id: PRESETS[id] ? id : "default", ...preset, mouseLook: settings.mouseLook };
  }

  function keyLabel(code) {
    if (!code) return "Unassigned";
    const mouse = { Mouse0: "Left click", Mouse1: "Middle click", Mouse2: "Right click", Mouse3: "Mouse back", Mouse4: "Mouse forward" };
    if (mouse[code]) return mouse[code];
    return code.replace(/^Key/, "").replace(/^Digit/, "").replace(/^Arrow/, "Arrow ").replace(/^ShiftLeft$/, "Left Shift").replace(/^ShiftRight$/, "Right Shift").replace(/^ControlLeft$/, "Left Ctrl").replace(/^ControlRight$/, "Right Ctrl");
  }

  globalThis.InputBridge = { DEFAULT_BINDINGS, PRESETS, ACTIONS, DEFAULT_SETTINGS, mergeSettings, guessPreset, effectiveProfile, keyLabel };
})();
