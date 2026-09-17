# SANA
web app per la gestione del proprio piano alimentare

## Setup

1. Crea un progetto su [supabase.com](https://supabase.com).
2. Nell'SQL editor del progetto esegui lo script [docs/supabase-schema.sql](docs/supabase-schema.sql) (crea le tabelle `plan_days`, `logs`, `plan_versions` con Row Level Security per-utente).
3. In *Project Settings > API* copia **Project URL** e **anon public key**.
4. Copia [config.example.js](config.example.js) in `config.js` (quest'ultimo è ignorato da git, vedi `.gitignore`) e incolla lì i due valori.
5. Servi la cartella con un web server statico e apri `sana.html` (evita di aprirlo con doppio click/`file://`, altrimenti `config.js` non viene caricato correttamente):
   ```
   python3 -m http.server 8000
   ```
   poi vai su `http://localhost:8000/sana.html`.

Il login richiede solo **username e password**: internamente viene creata un'email fittizia `username@sana.local` per usare Supabase Auth, in modo trasparente per chi usa l'app. Dalla schermata di login si può sia accedere sia registrarsi (link "Registrati").

Vedi [docs/SANA-README.md](docs/SANA-README.md) per la descrizione funzionale completa.
