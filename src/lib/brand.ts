export const BRAND = "RunWithMeClub";
export const TAGLINE = "Run together. Get faster. Have fun.";
export const CONTACT_EMAIL = "connect@runwithme.club";
export const TIMEZONE = "Asia/Kolkata";

export const PLANS = {
  FREE: { name: "Guest", price: 0, blurb: "Try the club, join open runs, track your training.", perks: ["Log unlimited activities", "Personal dashboard and records", "Join open community runs", "Monthly challenges"] },
  MEMBER: { name: "Member", price: 499, blurb: "The full club experience for regular runners.", perks: ["Everything in Guest", "Weekly coached group sessions", "Pace groups and training plans", "Priority event registration", "Member discounts on races"] },
  ELITE: { name: "Performance", price: 1499, blurb: "Structured coaching for runners chasing a goal.", perks: ["Everything in Member", "Personalised weekly plan", "Monthly 1:1 check-in with a coach", "Race-day strategy and pacing", "Early access to club race slots"] },
} as const;

export type PlanKey = keyof typeof PLANS;
