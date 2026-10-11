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
  if (!endpoint.startsWith("https://")) return json({ ok: false, error: "Invalid alert subscription." }, 400);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare("INSERT INTO push_subscriptions (id, endpoint, created_at) VALUES (?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET created_at = excluded.created_at").bind(id, endpoint, now).run();
  return json({ ok: true });
}
