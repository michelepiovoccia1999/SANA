// URL del backend Express.
// - In locale (frontend e backend su porte diverse) punta a localhost:3001.
// - In produzione con deploy unico (stesso progetto Vercel per frontend e
//   backend, vedi vercel.json in root) frontend e API sono sullo stesso
//   dominio: stringa vuota = fetch relative, niente da configurare.
const isLocalDev = ["localhost", "127.0.0.1"].includes(location.hostname);
window.SANA_API_BASE = isLocalDev ? "http://localhost:3001" : "";
