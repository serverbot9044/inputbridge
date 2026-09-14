const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const context = { globalThis: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, "..", "shared.js"), "utf8"), context);
const inputBridge = context.globalThis.InputBridge;

const guesses = [
  ["Forza Horizon 5", "racing"],
  ["Halo Infinite", "shooter"],
  ["Ori and the Will of the Wisps", "platformer"],
  ["EA Sports FC", "sports"],
  ["Unknown game", "default"]
];
for (const [title, expected] of guesses) {
  const actual = inputBridge.guessPreset(title).preset;
  if (actual !== expected) throw new Error(`${title}: expected ${expected}, received ${actual}`);
}

const merged = inputBridge.mergeSettings({ theme: { accent: "#ffffff" }, customBindings: { a: "Space" } });
if (merged.theme.accent2 !== "#22d3ee") throw new Error("Nested theme defaults were not preserved");
if (merged.customBindings.a !== "Space" || merged.customBindings.b !== "KeyK") throw new Error("Binding merge failed");
console.log("Profile and settings tests pass.");
