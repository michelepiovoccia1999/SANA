import { Router } from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../db.js";

const router = Router();

function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

router.post("/login", async (req, res) => {
  const { username } = req.body || {};
  if (!username || !username.trim()) {
    return res.status(400).json({ error: "Inserisci uno username" });
  }
  const normalized = username.trim().toLowerCase();

  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("username", normalized)
    .maybeSingle();

  if (existing) {
    return res.json({ token: signToken(existing), username: existing.username });
  }

  const { data: user, error } = await supabase
    .from("users")
    .insert({ username: normalized })
    .select()
    .single();
  if (error) return res.status(500).json({ error: "Errore durante la creazione dell'account" });

  res.json({ token: signToken(user), username: user.username });
});

export default router;
