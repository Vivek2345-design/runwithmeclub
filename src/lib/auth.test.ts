import { describe, expect, it } from "vitest";
import { generateTempPassword, hashPassword, rateLimited, safeNext, verifyPassword } from "./auth";
import { toCsv } from "./csv";

describe("passwords", () => {
  it("verifies the right password and rejects the wrong one", () => {
    const h = hashPassword("correct horse");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(verifyPassword("correct horse", h)).toBe(true);
    expect(verifyPassword("wrong", h)).toBe(false);
  });
  it("salts every hash", () => expect(hashPassword("x")).not.toBe(hashPassword("x")));
  it("rejects when there is no stored hash, without throwing", () => {
    expect(verifyPassword("anything", null)).toBe(false);
    expect(verifyPassword("anything", "garbage")).toBe(false);
  });
  it("generates strong temporary passwords", () => {
    const p = generateTempPassword();
    expect(p).toHaveLength(12);
    expect(p).not.toMatch(/[0OIl1]/);
  });
});

describe("safeNext", () => {
  it("allows same-site paths only", () => {
    expect(safeNext("/events/abc?x=1")).toBe("/events/abc?x=1");
    for (const bad of ["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "", null, undefined, 5]) {
      expect(safeNext(bad)).toBe("/dashboard");
    }
  });
});

describe("rateLimited", () => {
  it("blocks after the limit within the window", () => {
    const key = `t-${Math.random()}`;
    expect([1, 2, 3].map(() => rateLimited(key, 3, 60000))).toEqual([false, false, false]);
    expect(rateLimited(key, 3, 60000)).toBe(true);
  });
});

describe("toCsv", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(toCsv([["a,b", 'say "hi"', "line1\nline2", 5, null]])).toBe('"a,b","say ""hi""","line1\nline2",5,\r\n');
  });
  it("neutralises spreadsheet formulas", () => {
    expect(toCsv([["=HYPERLINK(\"x\")", "+1", "-2", "@cmd", "ok"]])).toContain("'=HYPERLINK");
    expect(toCsv([["@cmd"]])).toBe("'@cmd\r\n");
  });
});
