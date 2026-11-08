import { execSync } from "node:child_process";

export const TEST_DB = "postgresql://postgres:postgres@localhost:54330/runwithme_test";

/** Gives the calling test file its own empty, fully migrated Postgres schema. Call before importing ./db. */
export function setupTestSchema(): string {
  const schema = `t_${Math.random().toString(36).slice(2, 10)}`;
  process.env.DATABASE_URL = `${TEST_DB}?schema=${schema}`;
  execSync("npx prisma migrate deploy", { env: { ...process.env }, stdio: "pipe" });
  return schema;
}
