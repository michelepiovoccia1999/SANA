import { app } from "./app.js";

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SANA backend in ascolto su http://localhost:${PORT}`));
