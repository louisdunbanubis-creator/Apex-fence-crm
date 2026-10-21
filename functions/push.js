function b64url(bytes) {
  let binary = "";
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlToBytes(value) {
  const padded = String(value).replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function concat(parts) {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

async function hkdf(ikm, salt, info, bytes) {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, bytes * 8));
}

export async function ensurePushSchema(env) {
  if (!env.DB) return;
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS push_subscriptions (id TEXT PRIMARY KEY, endpoint TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL, p256dh TEXT, auth TEXT)").run();
  let names = new Set();
  try {
    const info = await env.DB.prepare("PRAGMA table_info(push_subscriptions)").all();
    names = new Set((info.results || []).map(column => column.name));
  } catch {}
  for (const column of ["p256dh", "auth"]) {
    if (names.has(column)) continue;
    try {
      await env.DB.prepare(`ALTER TABLE push_subscriptions ADD COLUMN ${column} TEXT`).run();
    } catch (error) {
      if (!/duplicate column/i.test(String(error?.message || error))) throw error;
    }
  }
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

export async function encryptPushPayload(message, p256dh, auth) {
  const payload = new TextEncoder().encode(message);
  const userPublicKey = b64urlToBytes(p256dh);
  const userAuth = b64urlToBytes(auth);
  const localKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const localPublicKey = new Uint8Array(await crypto.subtle.exportKey("raw", localKeyPair.publicKey));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({
    name: "ECDH",
    public: await crypto.subtle.importKey("raw", userPublicKey, { name: "ECDH", namedCurve: "P-256" }, false, [])
  }, localKeyPair.privateKey, 256));
  const ikm = await hkdf(sharedSecret, userAuth, concat([new TextEncoder().encode("WebPush: info\0"), userPublicKey, localPublicKey]), 32);
  const contentKey = await hkdf(ikm, salt, new TextEncoder().encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(ikm, salt, new TextEncoder().encode("Content-Encoding: nonce\0"), 12);
  const record = new Uint8Array(payload.length + 1);
  record.set(payload);
  record[payload.length] = 2;
  const aesKey = await crypto.subtle.importKey("raw", contentKey, "AES-GCM", false, ["encrypt"]);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, record));
  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096);
  return concat([salt, recordSize, new Uint8Array([localPublicKey.length]), localPublicKey, ciphertext]);
}

function alertText(lead) {
  if (lead.test) return { title: "Apex Fence", body: "Phone alerts are on. New website estimates will show up here.", tag: "apex-test" };
  const parts = [lead.name, lead.phone, lead.address].map(value => String(value || "").replace(/\s+/g, " ").trim()).filter(Boolean);
  const job = String(lead.projectType || "").trim();
  const body = [parts.join(" · "), job].filter(Boolean).join(" — ") || "A new estimate request is in Apex Hub.";
  return { title: "New Apex estimate", body, tag: lead.tag || "apex-lead" };
}

export async function notifyNewLead(env, lead = {}) {
  if (!env.DB || !env.VAPID_PRIVATE_JWK || !env.VAPID_PUBLIC_KEY) {
    return { ok: false, sent: 0, error: "Lead alerts are not configured yet." };
  }
  await ensurePushSchema(env);
  const rows = await env.DB.prepare("SELECT id, endpoint, p256dh, auth FROM push_subscriptions").all();
  const message = JSON.stringify({ ...alertText(lead), url: "/crm" });
  let sent = 0;
  let failed = 0;
  await Promise.allSettled((rows.results || []).map(async (row) => {
    try {
      const headers = {
        Authorization: await vapidAuthorization(row.endpoint, env),
        TTL: "86400",
        Urgency: "high"
      };
      let body;
      if (row.p256dh && row.auth) {
        body = await encryptPushPayload(message, row.p256dh, row.auth);
        headers["Content-Encoding"] = "aes128gcm";
        headers["Content-Type"] = "application/octet-stream";
      }
      const response = await fetch(row.endpoint, { method: "POST", headers, body });
      if (response.status === 404 || response.status === 410) {
        await env.DB.prepare("DELETE FROM push_subscriptions WHERE id = ?").bind(row.id).run();
        failed += 1;
        return;
      }
      if (response.ok) {
        sent += 1;
        return;
      }
      failed += 1;
      console.error("lead alert rejected", response.status, new URL(row.endpoint).host);
    } catch (error) {
      failed += 1;
      console.error("lead alert failed", error?.message || error);
    }
  }));
  const phones = (rows.results || []).length;
  const messageText = sent > 0
    ? `Test alert sent to ${sent} phone${sent === 1 ? "" : "s"}.`
    : phones === 0
      ? "No phone is signed up yet. Open Apex Hub on your phone and turn on phone alerts."
      : "The phone did not accept the alert. Turn phone alerts on again from Apex Hub.";
  return { ok: sent > 0, sent, failed, phones, message: lead.test ? messageText : undefined };
}
