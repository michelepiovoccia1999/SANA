import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import planRoutes from "./routes/plan.routes.js";
import logsRoutes from "./routes/logs.routes.js";
import versionsRoutes from "./routes/versions.routes.js";
import { requireAuth } from "./middleware/auth.js";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET deve essere impostata in backend/.env");
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/plan", requireAuth, planRoutes);
app.use("/api/logs", requireAuth, logsRoutes);
app.use("/api/versions", requireAuth, versionsRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SANA backend in ascolto su http://localhost:${PORT}`));
