# Deploying RunWithMeClub to Railway

Domain: **runwithme.club** · Club email: **connect@runwithme.club** · Host: **Railway** · Email sending: **Resend**

Do the steps in order. Anything marked **[you]** needs your accounts or payment details. The app code is already prepared (Postgres, health check, migrations on deploy, startup safety checks).

> Never paste secrets (API keys, passwords, database URLs) into chat or commit them to GitHub. Put them only in Railway's *Variables* tab. The `.env` file is git-ignored.

---

## 1. Put the code on GitHub [you]

1. Create a **private** repository on github.com (for example `runwithmeclub`). Do not add a README or .gitignore there.
2. In the project folder:

```bash
git add -A
git status          # check that .env, .dev-credentials.txt and .pgdata are NOT listed
git commit -m "RunWithMeClub website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/runwithmeclub.git
git push -u origin main
```

If `git status` lists `.env` or `.dev-credentials.txt`, stop and tell me.

## 2. Create the Railway project [you]

1. Sign up at railway.com and add a payment method (the Hobby plan is enough to start).
2. **New Project -> Deploy from GitHub repo** -> pick `runwithmeclub`. The first build may fail until variables are set. That is expected.
3. In the same project: **+ New -> Database -> Add PostgreSQL**.

## 3. Set variables on the web service [you]

Open the web service -> **Variables** and add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | click **Add reference** and pick the Postgres service's `DATABASE_URL` |
| `APP_URL` | `https://runwithme.club` (no trailing slash) |
| `SESSION_SECRET` | a long random string. Generate one with `openssl rand -base64 48` |
| `RESEND_API_KEY` | from step 5 |
| `EMAIL_FROM` | `RunWithMeClub <connect@runwithme.club>` |

Leave `ADMIN_EMAILS`, `STRAVA_*` empty for now. See "First admin" below for why.

The app refuses to start with a missing/weak `SESSION_SECRET`, a non-https `APP_URL`, or a localhost database, so a misconfiguration fails loudly instead of running unsafely.

## 4. Connect the domain [you]

1. Web service -> **Settings -> Networking -> Custom Domain** -> add `runwithme.club`, then also `www.runwithme.club`.
2. Railway shows a DNS target (a `*.up.railway.app` name) and sometimes a TXT verification record.
3. At your domain registrar's DNS settings add exactly what Railway shows.
   - **`www`** -> a `CNAME` record to the Railway target.
   - **Root (`runwithme.club`)** -> many registrars do not allow a CNAME on the root. If yours does not, use **Cloudflare** (free): add the domain to Cloudflare, switch your registrar's nameservers to the two Cloudflare gives you, then add the records there (Cloudflare supports root CNAME flattening). Set the proxy to **DNS only** (grey cloud) for the Railway records at first.
4. Wait for Railway to show the domain as verified and issue HTTPS (usually minutes, up to an hour).

## 5. Email: sending and receiving [you]

**Sending (Resend, free for up to ~3,000 emails/month):**
1. Sign up at resend.com -> **Domains -> Add Domain** -> `runwithme.club`.
2. Add the DNS records Resend lists (SPF, DKIM, and optionally DMARC) at your DNS provider. Click **Verify**.
3. **API Keys -> Create** (sending access only) and paste it into Railway as `RESEND_API_KEY`.

**Receiving (so `connect@runwithme.club` really works):** replies and contact-form notifications go to this address, so it needs a mailbox. Easiest free option: **Cloudflare Email Routing** (Email -> Email Routing) to forward `connect@runwithme.club` to your own inbox. Or use Google Workspace / Zoho Mail if you want a real shared mailbox for your team.

## 6. First deploy and first admin [you]

1. Railway redeploys when variables change. Watch **Deployments**; the app applies any pending database migrations each time it starts, and `/api/health` only reports ok once the tables exist.
2. Open `https://runwithme.club`. The database is empty (no demo data).
3. **Immediately** go to `/signup` and create your own account. **The first account on an empty database becomes the admin.** Do this before you share the link with anyone.
4. Log in, open `/admin`, and add your real pace groups, events and a welcome announcement. Invite a teammate: they sign up normally, then you open Admin -> Members and make them a Coach (or Admin).

Do not set `ADMIN_EMAILS` on the live site: email addresses are not verified at signup, so anyone could claim a listed address before its owner does.

## 7. Test it like a member [you]

- Sign up with a second email, register for an event, cancel, and check the confirmation emails arrive.
- Use **Forgot password** and complete the reset from the email link.
- Send a message through **Contact** and confirm it reaches `connect@runwithme.club`.
- Upload a small `.gpx` file in **Log activity**.

## 8. Backups and monitoring [you]

- **Backups:** in Railway, open the Postgres service and enable **Backups** if your plan offers them. Also take a manual copy now and then. From your laptop (needs `psql` tools; copy `DATABASE_PUBLIC_URL` from the Postgres service's Variables):

```bash
pg_dump "$DATABASE_PUBLIC_URL" --no-owner -f runwithmeclub-backup-$(date +%F).sql
```

- **Uptime alert:** create a free monitor at uptimerobot.com for `https://runwithme.club/api/health` with email alerts to you.

## 9. Updating the site later

Change the code, then `git push`. Railway rebuilds, the new version applies pending migrations (`prisma migrate deploy`) as it starts, and then goes live. If a deploy breaks something, use **Deployments -> Rollback** (database migrations are forward-only, so keep schema changes backwards compatible).

## 10. Turning on Strava later (optional)

1. Check your Strava API app's athlete capacity at strava.com/settings/api (new apps start with a very small cap) and read Strava's API terms.
2. Set the Strava app's **Authorization Callback Domain** to `runwithme.club`.
3. Add `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET` and a random `STRAVA_WEBHOOK_VERIFY_TOKEN` in Railway.
4. Register the webhook once: `node --env-file=.env scripts/strava-webhook.mjs create` (with those values and `APP_URL=https://runwithme.club` in your local `.env`).

## Costs (approximate, check current pricing)

- Railway Hobby: about US$5/month plan, with usage for the app + Postgres typically landing around US$5-10/month at club scale.
- Resend: free tier is enough at club size.
- Domain: already yours.

## Known limits

- Logins, password resets and the contact form are rate-limited in memory, which is fine for one server but resets on restart. Move to Redis if you ever run several instances.
- Email addresses are not verified at signup (a password-reset email still only reaches the real owner).
- There is no online payment yet; memberships and event fees are recorded by admins. Razorpay is the natural next step.
- Event reminder emails (for example "tomorrow's run") need a scheduled job; registration and waitlist emails already work.
