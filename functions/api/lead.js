const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 25 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg","image/png","image/webp","image/heic","image/heif"]);

function json(data, status=200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {"content-type":"application/json; charset=utf-8","cache-control":"no-store"}
  });
}

function ext(name, type) {
  const fromName = String(name || "").split(".").pop().toLowerCase();
  if (["jpg","jpeg","png","webp","heic","heif"].includes(fromName)) return fromName === "jpeg" ? "jpg" : fromName;
  return ({ "image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/heic":"heic","image/heif":"heif" }[type] || "bin");
}

export async function onRequestPost({request, env}) {
  if (!env.DB || !env.PHOTOS) return json({ok:false,error:"Apex cloud storage is not connected yet."},503);

  let form;
  try { form = await request.formData(); }
  catch { return json({ok:false,error:"Invalid form submission."},400); }

  if (String(form.get("website") || "").trim()) return json({ok:true,message:"Request received."});
  const name = String(form.get("Name") || "").trim();
  const phone = String(form.get("Phone") || "").trim();
  const email = String(form.get("Email") || "").trim();
  const address = String(form.get("Address") || "").trim();
  const projectType = String(form.get("Project Type") || "Other").trim();
  const details = String(form.get("Project Details") || "").trim();

  if (!name || !phone || !address) return json({ok:false,error:"Name, phone and project address are required."},400);

  const photos = form.getAll("photos").filter(x => x && typeof x === "object" && "arrayBuffer" in x);
  if (photos.length > MAX_PHOTOS) return json({ok:false,error:"Please upload no more than 5 photos."},400);

  let total = 0;
  for (const file of photos) {
    if (!ALLOWED.has(String(file.type || "").toLowerCase())) return json({ok:false,error:"One of the selected files is not a supported image type."},400);
    if (file.size > MAX_PHOTO_BYTES) return json({ok:false,error:"Each photo must be 8 MB or smaller."},400);
    total += file.size;
  }
  if (total > MAX_TOTAL_BYTES) return json({ok:false,error:"Please keep the total photo upload under 25 MB."},400);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    await env.DB.prepare(
      "INSERT INTO online_leads (id,name,phone,email,address,project_type,details,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)"
    ).bind(id,name,phone,email,address,projectType,details,"New",now,now).run();

    for (const file of photos) {
      const photoId = crypto.randomUUID();
      const key = "leads/" + id + "/" + photoId + "." + ext(file.name,file.type);
      await env.PHOTOS.put(key, file.stream(), {
        httpMetadata: {contentType: file.type || "application/octet-stream"},
        customMetadata: {leadId:id, originalName:String(file.name || "")}
      });
      storedKeys.push(key);
      await env.DB.prepare(
        "INSERT INTO lead_photos (id,lead_id,object_key,filename,content_type,size_bytes,created_at) VALUES (?,?,?,?,?,?,?)"
      ).bind(photoId,id,key,String(file.name || "photo"),String(file.type || ""),file.size,now).run();
    }
  } catch (e) {
    const storedKeys = [];

  try { await env.DB.prepare("DELETE FROM online_leads WHERE id=?").bind(id).run(); } catch {}
    return json({ok:false,error:"We could not save the estimate request. Please call Apex Fence directly."},500);
  }

  return json({ok:true,leadId:id,message:"Thanks! Your estimate request was received."},201);
}
