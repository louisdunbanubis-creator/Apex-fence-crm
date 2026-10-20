import { ensurePushSchema } from "../push.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

function authorized(request, env) {
  const token = String(env.APEX_CRM_TOKEN || "");
  return !!token && request.headers.get("authorization") === "Bearer " + token;
}

export async function onRequestPost({ request, env }) {
  if (!authorized(request, env)) return json({ ok: false, error: "Unauthorized" }, 401);
  if (!env.DB) return json({ ok: false, error: "D1 is not connected." }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: "Missing alert subscription." }, 400); }
  const endpoint = String(body.endpoint || "");
  const p256dh = String(body.keys?.p256dh || "");
  const auth = String(body.keys?.auth || "");
  if (!endpoint.startsWith("https://")) return json({ ok: false, error: "Invalid alert subscription." }, 400);
  if (!/^[A-Za-z0-9_-]{16,200}$/.test(p256dh) || !/^[A-Za-z0-9_-]{16,200}$/.test(auth)) {
    return json({ ok: false, error: "This phone did not send alert keys." }, 400);
  }
  await ensurePushSchema(env);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare("INSERT INTO push_subscriptions (id, endpoint, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, created_at = excluded.created_at").bind(id, endpoint, p256dh, auth, now).run();
  return json({ ok: true });
}
