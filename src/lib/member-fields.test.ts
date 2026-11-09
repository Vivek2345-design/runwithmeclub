import { describe, expect, it } from "vitest";
import { ageOn, fields, isPincode, normalizePhone, parseDob } from "./member-fields";

const NOW = new Date("2026-11-09T00:00:00Z");

describe("parseDob", () => {
  it("accepts a valid adult date", () => expect(parseDob("1990-05-17", NOW)?.toISOString()).toBe("1990-05-17T00:00:00.000Z"));
  it("enforces the minimum age of 16 on the exact birthday", () => {
    expect(parseDob("2010-11-09", NOW)).not.toBeNull(); // turns 16 today
    expect(parseDob("2010-11-10", NOW)).toBeNull(); // turns 16 tomorrow
  });
  it("rejects future, impossible, malformed and implausibly old dates", () => {
    for (const bad of ["2030-01-01", "2026-02-31", "1990-13-01", "17/05/1990", "", "1900-01-01"]) expect(parseDob(bad, NOW)).toBeNull();
  });
});

describe("ageOn", () => {
  it("counts whole years", () => {
    expect(ageOn(new Date("2000-11-10T00:00:00Z"), NOW)).toBe(25);
    expect(ageOn(new Date("2000-11-09T00:00:00Z"), NOW)).toBe(26);
  });
});

describe("normalizePhone", () => {
  it("strips separators and keeps a leading +", () => {
    expect(normalizePhone("+91 98765-43210")).toBe("+919876543210");
    expect(normalizePhone("(080) 2345 6789")).toBe("08023456789");
  });
  it("rejects too short, too long and non-numeric", () => {
    for (const bad of ["12345", "abcdefghij", "1234567890123456", ""]) expect(normalizePhone(bad)).toBeNull();
  });
});

describe("pincode and field schemas", () => {
  it("validates Indian pincodes", () => {
    expect(isPincode("560001")).toBe(true);
    for (const bad of ["056001", "56001", "5600011", "abcdef"]) expect(isPincode(bad)).toBe(false);
  });
  it("shares the same rules for signup and profile", () => {
    expect(fields.phone.parse(" +91 98765 43210 ")).toBe("+919876543210");
    expect(fields.state.safeParse("Atlantis").success).toBe(false);
    expect(fields.tshirtSize.safeParse("XXXL").success).toBe(false);
    expect(fields.tshirtSize.safeParse("XL").success).toBe(true);
    expect(fields.address.safeParse("short").success).toBe(false);
  });
});
