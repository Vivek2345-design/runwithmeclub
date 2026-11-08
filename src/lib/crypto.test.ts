import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-for-unit-tests-only";
});

describe("token encryption", () => {
  it("round-trips and never stores plaintext", async () => {
    const { decrypt, encrypt } = await import("./crypto");
    const enc = encrypt("strava-access-token-123");
    expect(enc).not.toContain("strava-access-token-123");
    expect(decrypt(enc)).toBe("strava-access-token-123");
  });
  it("uses a fresh IV each time", async () => {
    const { encrypt } = await import("./crypto");
    expect(encrypt("same")).not.toBe(encrypt("same"));
  });
  it("rejects tampered data", async () => {
    const { decrypt, encrypt } = await import("./crypto");
    const [iv, tag, ct] = encrypt("hello").split(".");
    const bad = [iv, tag, Buffer.from("xxxxx").toString("base64")].join(".");
    expect(() => decrypt(bad)).toThrow();
    expect(ct).toBeTruthy();
  });
});
