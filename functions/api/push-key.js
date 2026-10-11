function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

export function onRequestGet({ env }) {
  if (!env.VAPID_PUBLIC_KEY) return json({ ok: false, error: "Lead alerts are not configured yet." }, 503);
  return json({ ok: true, publicKey: env.VAPID_PUBLIC_KEY });
}
