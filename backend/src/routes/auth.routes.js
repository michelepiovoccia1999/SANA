import { Router } from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../db.js";

const router = Router();

function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

function normalize(username) {
  return (username || "").trim().toLowerCase();
}

router.post("/login", async (req, res) => {
  const normalized = normalize(req.body?.username);
  if (!normalized) return res.status(400).json({ error: "Inserisci uno username" });

  const { data: user } = await supabase.from("users").select("*").eq("username", normalized).maybeSingle();
  if (!user) return res.status(404).json({ error: "Username non trovato" });

  res.json({ token: signToken(user), username: user.username });
});

router.post("/register", async (req, res) => {
  const normalized = normalize(req.body?.username);
  if (!normalized) return res.status(400).json({ error: "Inserisci uno username" });

  const { data: existing } = await supabase.from("users").select("id").eq("username", normalized).maybeSingle();
  if (existing) return res.status(409).json({ error: "Username già in uso" });

  const { data: user, error } = await supabase.from("users").insert({ username: normalized }).select().single();
  if (error) return res.status(500).json({ error: "Errore durante la creazione dell'account" });

  res.json({ token: signToken(user), username: user.username });
});

export default router;
