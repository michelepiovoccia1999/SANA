# SANA
web app per la gestione del proprio piano alimentare

## Struttura

```
backend/    server Node/Express — API REST, auth JWT, unico punto che parla con Supabase
frontend/   pagina statica (HTML/CSS/JS separati) — chiama il backend via fetch
docs/       documentazione funzionale + schema SQL
```

Il frontend **non** parla mai direttamente con Supabase: chiama solo il backend, che usa la
service role key di Supabase (lato server) per leggere/scrivere i dati. L'autenticazione è
username + password gestita dal backend (password hashate con bcrypt, sessione via JWT) —
non usa Supabase Auth.

## Setup

### 1. Database (Supabase)

1. Crea un progetto su [supabase.com](https://supabase.com).
2. Nell'SQL editor esegui [docs/supabase-schema.sql](docs/supabase-schema.sql) — crea le tabelle `users`, `plan_days`, `logs`, `plan_versions`.
3. In *Project Settings → API* copia **Project URL** e **service_role key** (non la anon key: il backend usa la service role, che va tenuta segreta e non finisce mai nel frontend).

### 2. Backend

```
cd backend
cp .env.example .env
```

Compila `.env`:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=una-stringa-lunga-e-casuale
PORT=3001
```

Poi:

```
npm install
npm run dev
```

Il backend parte su `http://localhost:3001`.

### 3. Frontend

Il frontend è HTML/CSS/JS statico, va solo servito (non `file://`, per via dei moduli ES):

```
cd frontend
python3 -m http.server 5173
```

Apri `http://localhost:5173`. Se il backend gira su un URL diverso da `http://localhost:3001`, aggiorna `frontend/js/config.js` (`SANA_API_BASE`).

## Deploy su Vercel

Backend e frontend sono due progetti Vercel separati, entrambi puntati sullo stesso repo ma con **Root Directory** diversa.

### Backend

1. Su Vercel: **New Project** → importa il repo → **Root Directory** = `backend`.
2. Vercel lo riconosce come progetto Node grazie a `backend/vercel.json` e `backend/api/index.js` (adattano l'app Express a funzione serverless — non usa `app.listen()` in produzione).
3. In **Settings → Environment Variables** di questo progetto imposta:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   (`PORT` non serve, lo gestisce Vercel). Sono gli stessi valori che hai in `backend/.env` in locale.
4. Deploy. L'URL pubblico sarà tipo `https://sana-backend.vercel.app`.

### Frontend

1. Un secondo progetto Vercel → **Root Directory** = `frontend`.
2. Nessuna variabile d'ambiente necessaria: l'URL del backend non è un segreto, va scritto direttamente in `frontend/js/config.js` (`SANA_API_BASE`) **prima del deploy**, sostituendo `http://localhost:3001` con l'URL del backend deployato al punto precedente.
3. Deploy.

### In alternativa al backend su Vercel

Se preferisci non usare funzioni serverless, il backend è un Express "normale" (`backend/src/server.js` con `app.listen()`) e gira senza modifiche su qualunque hosting con un processo Node sempre attivo (Render, Railway, Fly.io...), impostando le stesse variabili d'ambiente.

Vedi [docs/SANA-README.md](docs/SANA-README.md) per la descrizione funzionale completa.
