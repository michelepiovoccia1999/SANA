import { Router } from "express";
import { supabase } from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("plan_versions")
    .select("*")
    .eq("user_id", req.userId)
    .order("saved_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Errore nel caricamento delle versioni" });
  res.json(data);
});

router.post("/", async (req, res) => {
  const { label, days } = req.body || {};
  const { data, error } = await supabase
    .from("plan_versions")
    .insert({ user_id: req.userId, label: label || "", days: days || {} })
    .select()
    .single();
  if (error) return res.status(500).json({ error: "Errore nel salvataggio della versione" });
  res.json(data);
});

router.delete("/:id", async (req, res) => {
  const { error } = await supabase
    .from("plan_versions")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId);
  if (error) return res.status(500).json({ error: "Errore nell'eliminazione della versione" });
  res.json({ ok: true });
});

export default router;
