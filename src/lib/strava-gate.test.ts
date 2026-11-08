import { describe, expect, it } from "vitest";
import { needsStravaConnection } from "./strava-gate";

describe("needsStravaConnection", () => {
  it("never applies when the switch is off", () => {
    expect(needsStravaConnection({ role: "MEMBER", stravaId: null }, false)).toBe(false);
  });
  it("applies to members who have not connected", () => {
    expect(needsStravaConnection({ role: "MEMBER", stravaId: null }, true)).toBe(true);
  });
  it("does not apply to members who are connected", () => {
    expect(needsStravaConnection({ role: "MEMBER", stravaId: 123 }, true)).toBe(false);
  });
  it("never locks out admins or coaches", () => {
    expect(needsStravaConnection({ role: "ADMIN", stravaId: null }, true)).toBe(false);
    expect(needsStravaConnection({ role: "COACH", stravaId: null }, true)).toBe(false);
  });
});
