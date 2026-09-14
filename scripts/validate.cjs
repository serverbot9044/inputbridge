const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
if (manifest.manifest_version !== 3) throw new Error("InputBridge must use Manifest V3");
if (manifest.name !== "InputBridge") throw new Error("Unexpected extension name");
if (manifest.options_page) throw new Error("InputBridge settings must remain inside the popup");

for (const file of fs.readdirSync(root).filter(name => name.endsWith(".js"))) {
  execFileSync(process.execPath, ["--check", path.join(root, file)], { stdio: "inherit" });
}
for (const size of [16, 32, 48, 128]) {
  if (!fs.existsSync(path.join(root, "icons", `icon-${size}.png`))) throw new Error(`Missing ${size}px icon`);
}
console.log("Manifest, scripts, and icons validate.");
