function unauthorized() {
  return new Response(JSON.stringify({ok:false,error:"Unauthorized"}), {
    status:401, headers:{"content-type":"application/json","cache-control":"no-store"}
  });
}
function authorized(request, env) {
  const token = String(env.APEX_CRM_TOKEN || "");
  if (!token) return false;
  return request.headers.get("authorization") === "Bearer " + token;
}
function json(data, status=200) {
  return new Response(JSON.stringify(data), {
    status, headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}
  });
}

export async function onRequestGet({request,env}) {
  if (!authorized(request,env)) return unauthorized();
  if (!env.DB) return json({ok:false,error:"D1 is not connected."},503);

  try {
    const rows = await env.DB.prepare(
    "SELECT id,name,phone,email,address,project_type,details,status,created_at,updated_at FROM online_leads ORDER BY created_at DESC LIMIT 200"
  ).all();

  const leads = [];
  for (const l of rows.results || []) {
    const photos = await env.DB.prepare(
      "SELECT id,object_key,filename,content_type,size_bytes,created_at FROM lead_photos WHERE lead_id=? ORDER BY created_at"
    ).bind(l.id).all();
    leads.push({
      id:l.id,name:l.name,phone:l.phone,email:l.email,address:l.address,
      jobType:l.project_type,notes:l.details,status:l.status || "New",
      source:"Online Estimate",createdAt:l.created_at,updatedAt:l.updated_at,
      photos:(photos.results || []).map(p=>({
        id:p.id,key:p.object_key,filename:p.filename,type:p.content_type,size:p.size_bytes,
        url:"/api/photo?key="+encodeURIComponent(p.object_key)
      }))
    });
  }
    return json({ok:true,leads});
  } catch (e) {
    return json({ok:false,error:"Unable to load online leads."},500);
  }
}
