// Local development Postgres (embedded, no Docker or installer needed).
// Used by `npm run dev` and importable by tests. Production uses Railway's managed Postgres instead.
import { existsSync } from "node:fs";
import net from "node:net";
import EmbeddedPostgres from "embedded-postgres";

export const DEV_PORT = 54329;
export const DEV_URL = `postgresql://postgres:postgres@localhost:${DEV_PORT}/runwithme?schema=public`;

const listening = (port) =>
  new Promise((resolve) => {
    const s = net.connect(port, "127.0.0.1");
    s.once("connect", () => { s.destroy(); resolve(true); });
    s.once("error", () => resolve(false));
  });

/** Starts a Postgres server (initialising its data dir the first time). Returns { stop, started }. */
export async function startLocalPostgres({ dir = ".pgdata", port = DEV_PORT, database = "runwithme" } = {}) {
  if (await listening(port)) return { started: false, stop: async () => {} };
  const pg = new EmbeddedPostgres({ databaseDir: dir, user: "postgres", password: "postgres", port, persistent: true, onLog: () => {}, onError: (e) => { const m = String(e); if (!/terminating connection|Connection terminated/.test(m)) console.error("[postgres]", m.trim()); } });
  if (!existsSync(`${dir}/PG_VERSION`)) await pg.initialise();
  await pg.start();
  try { await pg.createDatabase(database); } catch { /* already exists */ }
  return { started: true, stop: () => pg.stop() };
}
