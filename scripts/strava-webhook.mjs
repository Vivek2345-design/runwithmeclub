// One-off: register the Strava webhook subscription once the app is deployed on a public HTTPS URL.
//   node --env-file=.env scripts/strava-webhook.mjs create
//   node --env-file=.env scripts/strava-webhook.mjs list
//   node --env-file=.env scripts/strava-webhook.mjs delete <id>
const { STRAVA_CLIENT_ID: id, STRAVA_CLIENT_SECRET: secret, STRAVA_WEBHOOK_VERIFY_TOKEN: token, APP_URL } = process.env;
const url = "https://www.strava.com/api/v3/push_subscriptions";
const [cmd, arg] = process.argv.slice(2);
const q = new URLSearchParams({ client_id: id, client_secret: secret });

let res;
if (cmd === "create") {
  q.set("callback_url", `${APP_URL}/api/strava/webhook`);
  q.set("verify_token", token);
  res = await fetch(url, { method: "POST", body: q });
} else if (cmd === "list") {
  res = await fetch(`${url}?${q}`);
} else if (cmd === "delete" && arg) {
  res = await fetch(`${url}/${arg}?${q}`, { method: "DELETE" });
} else {
  console.log("usage: create | list | delete <id>");
  process.exit(1);
}
console.log(res.status, await res.text());
