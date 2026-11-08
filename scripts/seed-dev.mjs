// Local demo data for RunWithMeClub. NEVER run against a real/production database.
//   node --env-file=.env scripts/seed-dev.mjs            seed (refuses if users already exist)
//   node --env-file=.env scripts/seed-dev.mjs --reset    wipe everything, then seed
//   node --env-file=.env scripts/seed-dev.mjs --clear    wipe everything and stop (the first signup then becomes admin)
// Login details for the demo accounts are written to .dev-credentials.txt (git-ignored).
import { randomBytes, scryptSync } from "node:crypto";
import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { startLocalPostgres } from "./local-db.mjs";

// Safety: demo data may only ever go into the local development database.
const url = process.env.DATABASE_URL ?? "";
if (process.env.NODE_ENV === "production" || !/@(localhost|127\.0\.0\.1)[:/]/.test(url)) throw new Error("Refusing to seed: DATABASE_URL is not a local database.");
const pg = url.includes("localhost:54329") ? await startLocalPostgres() : { stop: async () => {} };
const migrated = spawnSync("npx", ["prisma", "migrate", "deploy"], { stdio: "pipe", env: process.env });
if (migrated.status !== 0) { console.error(String(migrated.stderr)); await pg.stop(); process.exit(1); }
const db = new PrismaClient();
const args = process.argv.slice(2);

const hash = (pw) => { const salt = randomBytes(16); return `scrypt$${salt.toString("base64")}$${scryptSync(pw, salt, 64).toString("base64")}`; };
const tempPw = () => { const a = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; return Array.from(randomBytes(14), (b) => a[b % a.length]).join(""); };
let seed = 20261108;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const between = (a, b) => a + rnd() * (b - a);

const IST = 330 * 60 * 1000, DAY = 86400000;
const istMidnight = (offsetDays) => { const n = new Date(Date.now() + IST); return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + offsetDays) - IST); };
const at = (offsetDays, h, m = 0) => new Date(istMidnight(offsetDays).getTime() + (h * 60 + m) * 60000);

async function wipe() {
  await db.registration.deleteMany(); await db.activity.deleteMany(); await db.workout.deleteMany(); await db.goal.deleteMany();
  await db.announcement.deleteMany(); await db.challenge.deleteMany(); await db.event.deleteMany(); await db.contactMessage.deleteMany();
  await db.user.deleteMany(); await db.group.deleteMany();
}

if (args.includes("--reset") || args.includes("--clear")) await wipe();
if (args.includes("--clear")) { console.log("Database cleared."); await db.$disconnect(); await pg.stop(); process.exit(0); }
if ((await db.user.count()) > 0) { console.log("Users already exist. Use --reset to wipe and reseed."); await db.$disconnect(); await pg.stop(); process.exit(1); }

const passwords = { admin: tempPw(), coach: tempPw(), member: tempPw() };
const groups = await Promise.all([
  db.group.create({ data: { name: "Easy Movers", paceLabel: "6:30 to 7:30 /km", description: "Relaxed, conversational pace. Perfect for beginners and recovery days.", color: "#0f766e" } }),
  db.group.create({ data: { name: "Steady Strides", paceLabel: "5:30 to 6:30 /km", description: "Comfortable but purposeful. For regular runners building fitness.", color: "#f2541b" } }),
  db.group.create({ data: { name: "Fast Pack", paceLabel: "4:30 to 5:30 /km", description: "Tempo and interval work for runners chasing personal bests.", color: "#7c3aed" } }),
]);

const admin = await db.user.create({ data: { name: "Club Admin", email: "admin@runwithmeclub.test", passwordHash: hash(passwords.admin), role: "ADMIN", plan: "ELITE", groupId: groups[1].id, phone: "+91 90000 00001", lastLoginAt: new Date() } });
const coach = await db.user.create({ data: { name: "Meera Iyer", email: "coach@runwithmeclub.test", passwordHash: hash(passwords.coach), role: "COACH", plan: "ELITE", groupId: groups[2].id, lastLoginAt: new Date() } });
const demo = await db.user.create({ data: { name: "Aarav Sharma", email: "member@runwithmeclub.test", passwordHash: hash(passwords.member), plan: "MEMBER", membershipUntil: at(12, 23, 59), groupId: groups[1].id, maxHr: 192, restHr: 56, bio: "Training for my first half marathon.", lastLoginAt: new Date() } });

const first = ["Priya", "Rohan", "Ananya", "Vikram", "Neha", "Arjun", "Kavya", "Siddharth", "Ishita", "Rahul", "Divya", "Karan", "Pooja", "Aditya", "Sneha", "Manish", "Tanvi", "Nikhil", "Riya", "Varun", "Shreya", "Harsh", "Mitali", "Kunal", "Sana", "Dev"];
const last = ["Patel", "Nair", "Reddy", "Singh", "Mehta", "Gupta", "Rao", "Joshi", "Desai", "Kulkarni", "Menon", "Bose", "Shah", "Pillai", "Verma", "Khan", "Das", "Kapoor"];
const members = [admin, coach, demo];
for (let i = 0; i < 26; i++) {
  const name = `${first[i % first.length]} ${pick(last)}`;
  const plan = rnd() < 0.5 ? "FREE" : rnd() < 0.75 ? "MEMBER" : "ELITE";
  members.push(await db.user.create({
    data: {
      name, email: `${name.toLowerCase().replace(/[^a-z]/g, ".")}.${i}@example.com`, passwordHash: null, plan,
      membershipUntil: plan === "FREE" ? null : at(Math.floor(between(-5, 90)), 23, 59), groupId: pick(groups).id,
      createdAt: new Date(Date.now() - Math.floor(between(2, 120)) * DAY), lastLoginAt: new Date(Date.now() - Math.floor(between(0, 14)) * DAY),
      ...(i === 25 ? { status: "SUSPENDED" } : {}),
    },
  }));
}

// Activities: 90 days of mostly-morning runs. Each member has their own habit and speed.
const rows = [];
for (const u of members) {
  const perWeek = u.id === demo.id ? 4 : Math.max(1, Math.round(between(1.5, 5)));
  const pace = u.id === demo.id ? 5.9 : between(4.6, 7.4); // min/km
  const longKm = between(8, 22);
  for (let d = 90; d >= 0; d--) {
    const dow = (new Date(Date.now() - d * DAY).getUTCDay() + 6) % 7;
    const base = [0.4, 0.5, 0.2, 0.5, 0.2, 0.6, 0.9][dow] * (perWeek / 3.2);
    if (rnd() > base) continue;
    const long = dow === 6, ride = !long && rnd() < 0.08, walk = !long && !ride && rnd() < 0.05;
    const km = long ? longKm * between(0.8, 1.1) : ride ? between(20, 50) : walk ? between(3, 6) : between(4, 11);
    const sport = ride ? "Ride" : walk ? "Walk" : "Run";
    const secs = Math.round(km * (ride ? 2.1 : walk ? 11 : pace * between(0.95, 1.07)) * 60);
    const start = new Date(at(-d, 5, 30).getTime() + Math.floor(between(0, 120)) * 60000);
    const hr = 128 + Math.round(between(0, 34));
    const intensity = Math.min(1.3, Math.max(0.4, (hr - 56) / 136 / 0.85));
    rows.push({
      userId: u.id, source: "MANUAL", name: long ? "Long run" : ride ? "Weekend ride" : walk ? "Recovery walk" : pick(["Morning run", "Easy run", "Tempo run", "Intervals", "Steady run"]),
      sportType: sport, startDate: start, distance: Math.round(km * 1000), movingTime: secs, elapsedTime: secs, elevationGain: Math.round(km * between(3, 12)),
      avgHr: hr, load: Math.round((secs / 3600) * intensity * intensity * 1000) / 10,
    });
  }
}
await db.activity.createMany({ data: rows });

// Events. `dow` (0=Sun..6=Sat) + `w` weeks ahead keeps weekday names in titles true; negative w is in the past.
const istDow = new Date(Date.now() + IST).getUTCDay();
const daysTo = (dow, w) => { const delta = ((dow - istDow + 7) % 7) || 7; return w >= 0 ? delta + w * 7 : delta + (w + 1) * 7 - 7; };
const evs = [
  { t: "Saturday Long Run", d: daysTo(6, 0), h: 5, m: 30, type: "GROUP_RUN", hue: 18, loc: "City Park, Gate 1 (sample location)", km: 12, cap: 60, price: 0, desc: "Our weekly social long run with three pace groups. Run leaders at the front and back so nobody is left behind. Water stops every 3 km. Come 10 minutes early for the warm-up.\n\nAll paces welcome." },
  { t: "Tuesday Track Intervals", d: daysTo(2, 0), h: 6, m: 0, type: "GROUP_RUN", hue: 270, loc: "Stadium Athletics Track (sample location)", km: 8, cap: 30, price: 100, desc: "Coached speed session: 6 x 800 m with equal recovery. Great for 5K and 10K runners looking to get faster." },
  { t: "Sunday Social 5K and Breakfast", d: daysTo(0, 0), h: 6, m: 30, type: "SOCIAL", hue: 140, loc: "Lakeside Promenade (sample location)", km: 5, cap: null, price: 0, desc: "An easy, chatty 5K followed by breakfast together. Bring a friend. Beginners especially welcome." },
  { t: "Hill Repeats Workshop", d: daysTo(4, 1), h: 6, m: 0, type: "WORKSHOP", hue: 45, loc: "Hilltop Road, base of the climb (sample location)", km: 6, cap: 25, price: 200, desc: "Learn uphill and downhill technique with a coach, then put it into practice with hill repeats." },
  { t: "RunWithMeClub 10K Community Race", d: daysTo(0, 3), h: 6, m: 0, type: "RACE", hue: 340, loc: "Riverside Road (sample location)", km: 10, cap: 20, price: 400, desc: "Our friendly annual 10K. Chip timing, finisher medals, pacers for every goal and a post-race celebration." },
  { t: "Nutrition and Fuelling Talk", d: daysTo(5, 1), h: 19, m: 0, type: "WORKSHOP", hue: 175, loc: "Community Hall (sample location)", km: null, cap: 80, price: 0, desc: "What to eat before, during and after long runs. Q&A with a sports nutritionist." },
  { t: "Full Moon Night Run", d: daysTo(6, 3), h: 19, m: 30, type: "SOCIAL", hue: 215, loc: "Old Fort Grounds (sample location)", km: 7, cap: 100, price: 0, desc: "A relaxed evening run under the moon. Bring a headlamp or reflective gear." },
  { t: "Last Week's Long Run", d: daysTo(6, -1), h: 5, m: 30, type: "GROUP_RUN", hue: 18, loc: "City Park, Gate 1 (sample location)", km: 14, cap: 60, price: 0, desc: "Our weekly social long run." },
  { t: "Beginners 5K Graduation Run", d: daysTo(0, -2), h: 6, m: 30, type: "GROUP_RUN", hue: 140, loc: "Lakeside Promenade (sample location)", km: 5, cap: null, price: 0, desc: "The finish of our 8-week Start Running program." },
];
const events = [];
for (const e of evs) {
  events.push(await db.event.create({ data: { slug: e.t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), title: e.t, description: e.desc, type: e.type, status: "PUBLISHED", startsAt: at(e.d, e.h, e.m), endsAt: at(e.d, e.h + 2, e.m), location: e.loc, distanceKm: e.km, capacity: e.cap, priceInr: e.price, hue: e.hue, createdById: admin.id } }));
}
const active = members.filter((m) => m.status !== "SUSPENDED");
for (const [i, ev] of events.entries()) {
  const target = ev.capacity ? (i === 4 ? ev.capacity + 4 : Math.min(ev.capacity, Math.floor(between(6, 18)))) : Math.floor(between(8, 20));
  const shuffled = [...active].sort(() => rnd() - 0.5).slice(0, Math.min(target, active.length));
  let going = 0;
  for (const u of shuffled) {
    const full = ev.capacity !== null && going >= ev.capacity;
    if (!full) going++;
    await db.registration.create({ data: { eventId: ev.id, userId: u.id, status: full ? "WAITLIST" : "GOING", checkedInAt: ev.startsAt < new Date() && !full && rnd() < 0.85 ? ev.startsAt : null } });
  }
}
await db.registration.upsert({ where: { eventId_userId: { eventId: events[0].id, userId: demo.id } }, create: { eventId: events[0].id, userId: demo.id }, update: { status: "GOING" } });

await db.announcement.createMany({ data: [
  { title: "Welcome to RunWithMeClub!", body: "We're so glad you're here. Introduce yourself at the next group run, log your runs in the app, and say hi to a run leader.\n\nNew to the club? Start with the Sunday Social 5K.", pinned: true, isPublic: true, authorId: admin.id },
  { title: "Monthly challenge is live", body: "This month's club challenge is open. Every run you log counts automatically. Check the Challenges page to see the leaderboard and our shared club target.", pinned: false, isPublic: true, authorId: coach.id, createdAt: new Date(Date.now() - 2 * DAY) },
  { title: "Reminder: please cancel if you can't make it", body: "Spots at track sessions and workshops fill quickly. If your plans change, cancel your registration so someone on the waitlist can take your place.", pinned: false, isPublic: false, authorId: admin.id, createdAt: new Date(Date.now() - 5 * DAY) },
] });

const m = new Date(Date.now() + IST);
const monthStart = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), 1) - IST);
const monthEnd = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1) - IST - 1000);
const pStart = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() - 1, 1) - IST);
await db.challenge.createMany({ data: [
  { title: "Monthly Distance Challenge", description: "Run as many kilometres as you can this month. Every logged run counts, and the whole club is working towards a shared target.", metric: "DISTANCE", startDate: monthStart, endDate: monthEnd, clubTarget: 2500 },
  { title: "Climb Club: Elevation Challenge", description: "Hills make you stronger. Who can collect the most elevation gain this month?", metric: "ELEVATION", startDate: monthStart, endDate: monthEnd },
  { title: "Last Month: Consistency Challenge", description: "Most runs logged wins. Showing up beats speed.", metric: "ACTIVITIES", startDate: pStart, endDate: new Date(monthStart.getTime() - 1000) },
] });

for (const w of [["Easy 6 km + strides", 1, 6, 40, "Easy pace. Finish with 4 x 20 s strides."], ["Tempo 3 x 1.5 km", 3, 8, 55, "10 min warm-up, 3 x 1.5 km at tempo with 2 min jogs, 10 min cool-down."], ["Long run 14 km", 6, 14, 90, "Steady and relaxed. Practise your race-day fuelling."]]) {
  await db.workout.create({ data: { userId: demo.id, authorId: coach.id, date: at(w[1], 0), title: w[0], sportType: "Run", plannedDistance: w[2] * 1000, plannedMinutes: w[3], description: w[4] } });
}
await db.goal.createMany({ data: [{ userId: demo.id, year: m.getUTCFullYear(), month: m.getUTCMonth() + 1, targetKm: 120 }, { userId: demo.id, year: m.getUTCFullYear(), month: 0, targetKm: 1200 }] });
await db.contactMessage.createMany({ data: [
  { name: "Sana Qureshi", email: "sana@example.com", subject: "Membership question", body: "Hi! I'm new to running. Can I try a group run before signing up for a paid membership?" },
  { name: "Rahul Menon", email: "rahul@example.com", subject: "Sponsoring the 10K", body: "Our company would like to sponsor the community 10K. Who should we speak to?", status: "READ" },
] });

writeFileSync(".dev-credentials.txt", `Local demo logins (generated ${new Date().toISOString()}). Do not use in production.\n\nAdmin   admin@runwithmeclub.test   ${passwords.admin}\nCoach   coach@runwithmeclub.test   ${passwords.coach}\nMember  member@runwithmeclub.test  ${passwords.member}\n`, { mode: 0o600 });
console.log(`Seeded ${members.length} members, ${rows.length} activities, ${events.length} events. Logins saved to .dev-credentials.txt`);
await db.$disconnect();
await pg.stop();
