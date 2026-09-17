import { Router } from "express";
import { supabase } from "../db.js";

const router = Router();
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("plan_days")
    .select("*")
    .eq("user_id", req.userId);
  if (error) return res.status(500).json({ error: "Errore nel caricamento del piano" });
  res.json(data);
});

router.put("/:day", async (req, res) => {
  const { day } = req.params;
  if (!DAYS.includes(day)) return res.status(400).json({ error: "Giorno non valido" });

  const { label, meals } = req.body || {};
  const { data, error } = await supabase
    .from("plan_days")
    .upsert({
      user_id: req.userId,
      day,
      label: label || "",
      meals: meals || [],
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: "Errore nel salvataggio del piano" });
  res.json(data);
});

router.post("/:day/copy", async (req, res) => {
  const { day } = req.params;
  const { targetDay } = req.body || {};
  if (!DAYS.includes(day) || !DAYS.includes(targetDay)) {
    return res.status(400).json({ error: "Giorno non valido" });
  }

  const { data: source, error: srcErr } = await supabase
    .from("plan_days")
    .select("*")
    .eq("user_id", req.userId)
    .eq("day", day)
    .maybeSingle();
  if (srcErr || !source) return res.status(404).json({ error: "Giorno sorgente non trovato" });

  const { data, error } = await supabase
    .from("plan_days")
    .upsert({
      user_id: req.userId,
      day: targetDay,
      label: source.label,
      meals: source.meals,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: "Errore nella copia del piano" });
  res.json(data);
});

export default router;
