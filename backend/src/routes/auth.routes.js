import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../db.js";

const router = Router();

function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

router.post("/register", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username e password sono obbligatori" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "La password deve avere almeno 6 caratteri" });
  }
  const normalized = username.trim().toLowerCase();

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("username", normalized)
    .maybeSingle();
  if (existing) return res.status(409).json({ error: "Username già in uso" });

  const passwordHash = await bcrypt.hash(password, 10);
  const { data: user, error } = await supabase
    .from("users")
    .insert({ username: normalized, password_hash: passwordHash })
    .select()
    .single();
  if (error) return res.status(500).json({ error: "Errore durante la registrazione" });

  res.json({ token: signToken(user), username: user.username });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username e password sono obbligatori" });
  }
  const normalized = username.trim().toLowerCase();

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("username", normalized)
    .maybeSingle();
  if (!user) return res.status(401).json({ error: "Username o password errati" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Username o password errati" });

  res.json({ token: signToken(user), username: user.username });
});

export default router;
