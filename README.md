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

## Deploy

- **Backend**: va ospitato su una piattaforma che tiene un processo Node sempre attivo (Render, Railway, Fly.io, ecc. — non Vercel statico). Imposta le stesse variabili di `.env` come environment variables della piattaforma.
- **Frontend**: essendo statico, va bene Vercel/Netlify/GitHub Pages puntando alla cartella `frontend/`. Aggiorna `frontend/js/config.js` con l'URL pubblico del backend deployato.

Vedi [docs/SANA-README.md](docs/SANA-README.md) per la descrizione funzionale completa.
