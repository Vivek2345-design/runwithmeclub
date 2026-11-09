// `npm run dev`: starts the local Postgres, applies migrations, then runs the Next.js dev server.
import { run, runSync } from "./bin.mjs";
import { DEV_URL, startLocalPostgres } from "./local-db.mjs";

const url = process.env.DATABASE_URL?.startsWith("postgres") ? process.env.DATABASE_URL : DEV_URL;
const useLocal = url === DEV_URL || url.includes("localhost:54329");
const env = { ...process.env, DATABASE_URL: url };

let db = { stop: async () => {} };
if (useLocal) {
  db = await startLocalPostgres();
  console.log(db.started ? "Local Postgres started on port 54329." : "Local Postgres already running.");
}
const mig = runSync("prisma", ["migrate", "deploy"], { stdio: "inherit", env });
if (mig.status !== 0) { await db.stop(); process.exit(mig.status ?? 1); }

const next = run("next", ["dev", ...process.argv.slice(2)], { stdio: "inherit", env });
const shutdown = async (code) => { await db.stop(); process.exit(code ?? 0); };
next.on("exit", shutdown);
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => next.kill(sig));
