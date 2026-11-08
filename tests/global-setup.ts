import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startLocalPostgres } from "../scripts/local-db.mjs";

// One throwaway Postgres for the whole test run (fresh data dir, port 54330).
export default async function setup() {
  const dir = mkdtempSync(join(tmpdir(), "rwmc-test-pg-"));
  const pg = await startLocalPostgres({ dir, port: 54330, database: "runwithme_test" });
  return async () => {
    await pg.stop();
    rmSync(dir, { recursive: true, force: true });
  };
}
