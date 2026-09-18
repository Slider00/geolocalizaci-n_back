import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

export const pgPool = new Pool({
  host: process.env.PGHOST || "localhost",
  user: process.env.PGUSER || "julian",
  password: process.env.PGPASSWORD || "",
  database: process.env.PGDATABASE || "julian",
  port: parseInt(process.env.PGPORT || "5432", 10),
});

export const connectPostgres = async () => {
  try {
    const client = await pgPool.connect();
    console.log(`🔌 PostgreSQL/PostGIS Conectado exitosamente en ${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`);
    
    // Verificar activación de PostGIS
    const res = await client.query("SELECT PostGIS_Full_Version();");
    console.log(`🗺️ PostGIS Activo: ${res.rows[0].postgis_full_version}`);
    client.release();
  } catch (error) {
    console.error(`❌ Error de conexión a PostgreSQL/PostGIS: ${(error as Error).message}`);
  }
};
