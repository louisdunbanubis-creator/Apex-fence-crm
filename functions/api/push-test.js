import { notifyNewLead } from "../push.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

function authorized(request, env) {
  const token = String(env.APEX_CRM_TOKEN || "");
  return !!token && request.headers.get("authorization") === "Bearer " + token;
}

export async function onRequestPost({ request, env }) {
  if (!authorized(request, env)) return json({ ok: false, error: "Unauthorized" }, 401);
  const result = await notifyNewLead(env, { test: true });
  if (!result.ok && result.error) return json(result, 503);
  return json(result, 200);
}
