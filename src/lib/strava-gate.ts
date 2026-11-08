/** Pure rule for the "Strava is mandatory" switch, so it can be unit tested. Staff are never locked out. */
export function needsStravaConnection(user: { role: string; stravaId: number | null }, required: boolean): boolean {
  return required && user.role === "MEMBER" && !user.stravaId;
}
