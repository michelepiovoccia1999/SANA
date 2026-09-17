import "dotenv/config";
import WebSocket from "ws";
import { createClient } from "@supabase/supabase-js";

// Polyfill: su Node < 22 manca il WebSocket nativo richiesto dal client
// realtime di supabase-js, anche se qui non usiamo funzionalità realtime.
if (!globalThis.WebSocket) globalThis.WebSocket = WebSocket;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devono essere impostate in backend/.env");
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
