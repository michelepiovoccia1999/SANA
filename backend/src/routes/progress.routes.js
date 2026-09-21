import { Router } from "express";
import { randomUUID } from "node:crypto";
import { supabase } from "../db.js";

const router = Router();

const BUCKET = "progress";
const SIGNED_URL_TTL = 60 * 60;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const handle = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  });

let bucketReady = null;
function ensureBucket() {
  if (!bucketReady) {
    bucketReady = (async () => {
      const { data } = await supabase.storage.getBucket(BUCKET);
      if (data) return;
      const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
      if (error && !/already exists/i.test(error.message)) throw error;
    })().catch((err) => {
      bucketReady = null;
      throw err;
    });
  }
  return bucketReady;
}

async function getOwnedFolder(req, res) {
  const { id } = req.params;
  if (!UUID_RE.test(id)) {
    res.status(404).json({ error: "Cartella non trovata" });
    return null;
  }
  const { data } = await supabase
    .from("progress_folders")
    .select("*")
    .eq("id", id)
    .eq("user_id", req.userId)
    .maybeSingle();
  if (!data) {
    res.status(404).json({ error: "Cartella non trovata" });
    return null;
  }
  return data;
}

function cleanName(raw) {
  const name = String(raw ?? "").trim();
  return name.length >= 1 && name.length <= 60 ? name : null;
}

async function withSignedUrls(rows) {
  if (!rows.length) return [];
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(rows.map((r) => r.path), SIGNED_URL_TTL);
  const urlByPath = new Map((data || []).map((d) => [d.path, d.signedUrl]));
  return rows.map(({ user_id, ...rest }) => ({ ...rest, url: urlByPath.get(rest.path) || null }));
}

router.get("/folders", handle(async (req, res) => {
  const { data, error } = await supabase
    .from("progress_folders")
    .select("id, name, created_at, progress_media(count)")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: true });
  if (error) return res.status(500).json({ error: "Errore nel caricamento delle cartelle" });
  res.json(data.map(({ progress_media, ...f }) => ({ ...f, count: progress_media?.[0]?.count ?? 0 })));
}));

router.post("/folders", handle(async (req, res) => {
  const name = cleanName(req.body?.name);
  if (!name) return res.status(400).json({ error: "Inserisci un nome (max 60 caratteri)" });
  const { data, error } = await supabase
    .from("progress_folders")
    .insert({ user_id: req.userId, name })
    .select("id, name, created_at")
    .single();
  if (error) return res.status(500).json({ error: "Errore nella creazione della cartella" });
  res.json({ ...data, count: 0 });
}));

router.patch("/folders/:id", handle(async (req, res) => {
  const folder = await getOwnedFolder(req, res);
  if (!folder) return;
  const name = cleanName(req.body?.name);
  if (!name) return res.status(400).json({ error: "Inserisci un nome (max 60 caratteri)" });
  const { data, error } = await supabase
    .from("progress_folders")
    .update({ name })
    .eq("id", folder.id)
    .select("id, name, created_at")
    .single();
  if (error) return res.status(500).json({ error: "Errore nel rinominare la cartella" });
  res.json(data);
}));

router.delete("/folders/:id", handle(async (req, res) => {
  const folder = await getOwnedFolder(req, res);
  if (!folder) return;
  const { data: media } = await supabase.from("progress_media").select("path").eq("folder_id", folder.id);
  if (media?.length) {
    await supabase.storage.from(BUCKET).remove(media.map((m) => m.path));
  }
  const { error } = await supabase.from("progress_folders").delete().eq("id", folder.id);
  if (error) return res.status(500).json({ error: "Errore nell'eliminazione della cartella" });
  res.json({ ok: true });
}));

router.get("/folders/:id/media", handle(async (req, res) => {
  const folder = await getOwnedFolder(req, res);
  if (!folder) return;
  const { data, error } = await supabase
    .from("progress_media")
    .select("*")
    .eq("folder_id", folder.id)
    .order("created_at", { ascending: true });
  if (error) return res.status(500).json({ error: "Errore nel caricamento dei file" });
  res.json(await withSignedUrls(data));
}));

router.post("/folders/:id/upload-url", handle(async (req, res) => {
  const folder = await getOwnedFolder(req, res);
  if (!folder) return;
  const { filename, contentType } = req.body || {};
  if (!/^(image|video)\//.test(contentType || "")) {
    return res.status(400).json({ error: "Sono ammesse solo foto e video" });
  }
  await ensureBucket();
  const safeName = String(filename || "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const path = `${req.userId}/${folder.id}/${randomUUID()}-${safeName}`;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) return res.status(500).json({ error: "Errore nella preparazione del caricamento" });
  res.json({ path, signedUrl: data.signedUrl });
}));

router.post("/folders/:id/media", handle(async (req, res) => {
  const folder = await getOwnedFolder(req, res);
  if (!folder) return;
  const { path, filename, contentType, size } = req.body || {};
  if (typeof path !== "string" || !path.startsWith(`${req.userId}/${folder.id}/`)) {
    return res.status(400).json({ error: "Percorso file non valido" });
  }
  if (!/^(image|video)\//.test(contentType || "")) {
    return res.status(400).json({ error: "Sono ammesse solo foto e video" });
  }
  const { data, error } = await supabase
    .from("progress_media")
    .insert({
      folder_id: folder.id,
      user_id: req.userId,
      path,
      filename: String(filename || "").slice(0, 200),
      type: contentType.startsWith("video/") ? "video" : "image",
      size: Number.isFinite(size) ? size : 0,
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: "Errore nel salvataggio del file" });
  const [item] = await withSignedUrls([data]);
  res.json(item);
}));

router.delete("/media/:id", handle(async (req, res) => {
  if (!UUID_RE.test(req.params.id)) return res.status(404).json({ error: "File non trovato" });
  const { data: media } = await supabase
    .from("progress_media")
    .select("id, path")
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .maybeSingle();
  if (!media) return res.status(404).json({ error: "File non trovato" });
  await supabase.storage.from(BUCKET).remove([media.path]);
  const { error } = await supabase.from("progress_media").delete().eq("id", media.id);
  if (error) return res.status(500).json({ error: "Errore nell'eliminazione del file" });
  res.json({ ok: true });
}));

export default router;
