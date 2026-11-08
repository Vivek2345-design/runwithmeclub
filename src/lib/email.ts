import { BRAND, CONTACT_EMAIL } from "./brand";
import { env } from "./env";

export type Mail = { to: string; subject: string; text: string; html?: string; replyTo?: string };

/**
 * Sends an email through Resend. Never throws: a failed email must not break signup or registration.
 * Without RESEND_API_KEY (local development) the message is printed to the server console instead.
 */
export async function sendEmail(m: Mail): Promise<boolean> {
  if (!env.resendApiKey) {
    if (process.env.NODE_ENV === "production") console.error(`[email] RESEND_API_KEY is not set; dropped "${m.subject}"`);
    else console.log(`\n[email:dev] To: ${m.to}\nSubject: ${m.subject}\n${m.text}\n`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.emailFrom, to: [m.to], subject: m.subject, text: m.text, html: m.html ?? layout(m.subject, m.text), reply_to: m.replyTo ?? CONTACT_EMAIL }),
    });
    if (!res.ok) console.error(`[email] Resend rejected "${m.subject}" (${res.status}): ${(await res.text()).slice(0, 200)}`);
    return res.ok;
  } catch (e) {
    console.error("[email] send failed", e);
    return false;
  }
}

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Minimal, widely compatible HTML wrapper. `body` is plain text; paragraphs split on blank lines, links are made clickable. */
export function layout(title: string, body: string, cta?: { label: string; url: string }): string {
  const paras = body.split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px;line-height:1.6">${esc(p).replace(/\n/g, "<br>").replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#f2541b">$1</a>')}</p>`).join("");
  const button = cta ? `<p style="margin:22px 0"><a href="${esc(cta.url)}" style="background:#f2541b;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px;display:inline-block">${esc(cta.label)}</a></p>` : "";
  return `<!doctype html><html><body style="margin:0;background:#f7f6f2;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#12161c">
<div style="max-width:560px;margin:0 auto;padding:28px 16px">
<div style="font-size:20px;font-weight:800;margin-bottom:18px">${esc(BRAND.replace(/Club$/, ""))}<span style="color:#f2541b">Club</span></div>
<div style="background:#fff;border:1px solid #e6e3da;border-radius:14px;padding:26px">
<h1 style="font-size:20px;margin:0 0 14px">${esc(title)}</h1>${paras}${button}</div>
<p style="color:#5d6877;font-size:12px;margin:16px 4px">${esc(BRAND)} &middot; <a href="mailto:${CONTACT_EMAIL}" style="color:#5d6877">${CONTACT_EMAIL}</a></p>
</div></body></html>`;
}

export function mail(to: string, subject: string, body: string, cta?: { label: string; url: string }, replyTo?: string): Mail {
  return { to, subject, text: cta ? `${body}\n\n${cta.label}: ${cta.url}` : body, html: layout(subject, body, cta), replyTo };
}
