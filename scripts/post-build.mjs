// After vite build, @tanstack/start-plugin-core resolves "server.js" but
// Cloudflare Vite adapter outputs "index.js". Create a symlink so both names work.
import { existsSync, symlinkSync, copyFileSync } from "fs";
import { resolve } from "path";

const dir = resolve("dist/server");
const src = resolve(dir, "index.js");
const dst = resolve(dir, "server.js");

if (!existsSync(src)) {
  console.warn("post-build: dist/server/index.js not found — skipping server.js alias");
  process.exit(0);
}

if (existsSync(dst)) {
  console.log("post-build: dist/server/server.js already exists — skipping");
  process.exit(0);
}

try {
  symlinkSync("index.js", dst);
  console.log("post-build: created symlink dist/server/server.js → index.js");
} catch {
  copyFileSync(src, dst);
  console.log(
    "post-build: copied dist/server/index.js → server.js (symlink failed, likely Windows)",
  );
}
