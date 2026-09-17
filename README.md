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

## Deploy su Vercel (progetto unico)

Frontend e backend restano codice separato (`frontend/`, `backend/`), ma si deployano insieme come **un solo progetto Vercel**, grazie al `vercel.json` nella root del repo: le richieste a `/api/*` vanno alla funzione serverless del backend (`backend/api/index.js`), tutto il resto serve i file statici di `frontend/`. Stesso dominio per entrambi → il frontend chiama l'API con path relativi, niente CORS, niente URL da configurare a mano.

1. Su Vercel: **New Project** → importa il repo → **lascia Root Directory sul default** (la root del repo, non `backend` né `frontend`).
2. In **Settings → Environment Variables** imposta (gli stessi valori che hai in `backend/.env`):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
3. Deploy. Un solo URL (es. `https://sana.vercel.app`) serve sia l'app che le API su `/api/...`.

`frontend/js/config.js` rileva da solo se sei in locale (`localhost`) o in produzione: in locale punta a `http://localhost:3001`, in produzione usa lo stesso dominio automaticamente — non richiede modifiche prima del deploy.

### Alternativa: due progetti Vercel separati

Se in futuro preferisci scalare/gestire backend e frontend indipendentemente, restano deployabili anche come due progetti distinti (Root Directory `backend` e `frontend`), usando `backend/vercel.json` invece di quello in root — ma allora `frontend/js/config.js` va aggiornato a mano con l'URL pubblico del backend.

### Alternativa: backend non su Vercel

Il backend è anche un Express "normale" (`backend/src/server.js` con `app.listen()`) e gira senza modifiche su qualunque hosting con un processo Node sempre attivo (Render, Railway, Fly.io...), impostando le stesse variabili d'ambiente.

Vedi [docs/SANA-README.md](docs/SANA-README.md) per la descrizione funzionale completa.
