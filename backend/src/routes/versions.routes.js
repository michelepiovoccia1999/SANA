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

export default router;
