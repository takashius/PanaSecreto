import mongoose from 'mongoose';

function redactMongoUrl(url: string) {
  return url.replace(/\/\/([^:/@]+):([^@]+)@/, '//$1:***@');
}

export default async function connectDb(url: string): Promise<void> {
  try {
    await mongoose.connect(url, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });
    console.log('[db] Conexión exitosa a MongoDB:', redactMongoUrl(url));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[db] Advertencia: No se pudo conectar a MongoDB (${message}). Modo degradado.`);
  }
}
