// Runs project CLIs through the current Node binary instead of `npx`, which is slower and can stall on some setups.
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const entry = {
  prisma: fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url)),
  next: fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url)),
};

export const runSync = (tool, args, opts = {}) => spawnSync(process.execPath, [entry[tool], ...args], opts);
export const run = (tool, args, opts = {}) => spawn(process.execPath, [entry[tool], ...args], opts);
