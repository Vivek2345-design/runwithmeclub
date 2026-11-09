import { z } from "zod";

export const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;

export const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
] as const;

export const MIN_AGE = 16;

export function ageOn(dob: Date, now: Date = new Date()): number {
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday = now.getUTCMonth() < dob.getUTCMonth() || (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age--;
  return age;
}

/** Parses "YYYY-MM-DD". Returns null unless it is a real date, not in the future, and the person is 16 to 100. */
export function parseDob(s: string, now: Date = new Date()): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) return null; // rejects 2026-02-31 and the like
  const age = ageOn(d, now);
  return age >= MIN_AGE && age <= 100 ? d : null;
}

/** Digits with an optional leading +, 10 to 15 digits. Spaces, dashes and brackets are ignored. Returns null if invalid. */
export function normalizePhone(s: string): string | null {
  const t = s.replace(/[\s\-().]/g, "");
  return /^\+?\d{10,15}$/.test(t) ? t : null;
}

export const isPincode = (s: string) => /^[1-9]\d{5}$/.test(s.trim());

/** Shared zod pieces so signup and profile editing enforce the same rules. */
export const fields = {
  phone: z.string().trim().refine((v) => normalizePhone(v) !== null, "Enter a valid contact number (10 to 15 digits).").transform((v) => normalizePhone(v)!),
  address: z.string().trim().min(10, "Enter your complete address.").max(300, "Address is too long."),
  city: z.string().trim().min(2, "Enter your city.").max(60),
  state: z.enum(STATES, { message: "Choose your state." }),
  pincode: z.string().trim().refine(isPincode, "Enter a valid 6-digit pincode."),
  tshirtSize: z.enum(TSHIRT_SIZES, { message: "Choose a T-shirt size." }),
};
