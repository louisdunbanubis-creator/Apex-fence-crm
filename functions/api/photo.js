function authorized(request, env) {
  const token = String(env.APEX_CRM_TOKEN || "");
  return !!token && request.headers.get("authorization") === "Bearer " + token;
}
export async function onRequestGet({request,env}) {
  if (!authorized(request,env)) return new Response("Unauthorized",{status:401});
  if (!env.PHOTOS) return new Response("Photo storage is not connected.",{status:503});
  const key = new URL(request.url).searchParams.get("key");
  if (!key || !key.startsWith("leads/")) return new Response("Not found",{status:404});
  const object = await env.PHOTOS.get(key);
  if (!object) return new Response("Not found",{status:404});
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag",object.httpEtag);
  headers.set("cache-control","private, max-age=3600");
  return new Response(object.body,{headers});
}
