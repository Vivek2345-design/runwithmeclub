// `npm run db:migrate -- --name add_thing`: create a new migration against the local Postgres.
import { runSync } from "./bin.mjs";
import { DEV_URL, startLocalPostgres } from "./local-db.mjs";

const db = await startLocalPostgres();
const r = runSync("prisma", ["migrate", "dev", ...process.argv.slice(2)], { stdio: "inherit", env: { ...process.env, DATABASE_URL: DEV_URL } });
await db.stop();
process.exit(r.status ?? 0);
