function b64url(bytes) {
  let binary = "";
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function vapidAuthorization(endpoint, env) {
  const jwk = JSON.parse(env.VAPID_PRIVATE_JWK);
  const header = b64url(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = b64url(new TextEncoder().encode(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: "mailto:Apexinstallsne@gmail.com"
  })));
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(`${header}.${payload}`));
  return `vapid t=${header}.${payload}.${b64url(signature)}, k=${env.VAPID_PUBLIC_KEY}`;
}

export async function notifyNewLead(env) {
  if (!env.DB || !env.VAPID_PRIVATE_JWK || !env.VAPID_PUBLIC_KEY) return;
  let rows;
  try {
    rows = await env.DB.prepare("SELECT id, endpoint FROM push_subscriptions").all();
  } catch {
    return;
  }
  await Promise.allSettled((rows.results || []).map(async (row) => {
    const response = await fetch(row.endpoint, {
      method: "POST",
      headers: { Authorization: await vapidAuthorization(row.endpoint, env), TTL: "86400" }
    });
    if (response.status === 404 || response.status === 410) {
      await env.DB.prepare("DELETE FROM push_subscriptions WHERE id = ?").bind(row.id).run();
    }
  }));
}
