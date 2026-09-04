import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

// 1. Load Dynamic Environment Configurations
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

import { connectDB } from "./db";
import { syncUSGSEarthquakes } from "./services/usgsService";
import earthquakeRoutes from "./routes/earthquakeRoutes";
import reportRoutes from "./routes/reportRoutes";

const app = express();
const PORT = process.env.PORT || 4000;

// 2. Connect to MongoDB using Mongoose
connectDB();

// 3. Mount Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// 4. Mount API Routes
app.use("/api/earthquakes", earthquakeRoutes);
app.use("/api/reports", reportRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    env: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
});

// Helper for automated background USGS syncing
const startUSGSSyncTask = () => {
  const intervalMs = 15 * 60 * 1000; // 15 minutes

  // 1. Run initial synchronization on server boot
  console.log("⏳ [USGS Sync] Iniciando sincronización automática de sismos...");
  syncUSGSEarthquakes()
    .then((stats) => {
      console.log(`✅ [USGS Sync] Sincronización inicial completada con éxito. Nuevos sismos agregados: ${stats.added}`);
    })
    .catch((err) => {
      console.error("❌ [USGS Sync] Error en la sincronización inicial de la USGS:", err);
    });

  // 2. Schedule periodic updates every 15 minutes
  setInterval(async () => {
    console.log("⏳ [USGS Sync] Ejecutando sincronización periódica de sismos...");
    try {
      const stats = await syncUSGSEarthquakes();
      console.log(`✅ [USGS Sync] Sincronización periódica completada. Nuevos sismos agregados: ${stats.added}`);
    } catch (err) {
      console.error("❌ [USGS Sync] Error en la sincronización periódica de la USGS:", err);
    }
  }, intervalMs);
};

// 5. Start Server listening & trigger sync task
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en puerto ${PORT} (Entorno: ${process.env.NODE_ENV || "development"})`);
  startUSGSSyncTask();
});
