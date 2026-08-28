import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error("❌ Error: MONGODB_URI no está definido en las variables de entorno.");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoURI);
    console.log(`🔌 MongoDB Conectado: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ Error de conexión a MongoDB: ${(error as Error).message}`);
    console.warn("⚠️ Advertencia: El servidor backend arrancó sin base de datos activa. Revisa tu conexión a MongoDB.");
  }
};
