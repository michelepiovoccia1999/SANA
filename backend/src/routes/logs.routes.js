import { Router } from "express";
import { supabase } from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  const { from, to } = req.query;
  let query = supabase.from("logs").select("*").eq("user_id", req.userId);
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: "Errore nel caricamento dello storico" });
  res.json(data);
});

router.put("/:date", async (req, res) => {
  const { date } = req.params;
  const { day, meals } = req.body || {};
  const { data, error } = await supabase
    .from("logs")
    .upsert({
      user_id: req.userId,
      date,
      day,
      meals: meals || {},
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: "Errore nel salvataggio del log" });
  res.json(data);
});

export default router;
