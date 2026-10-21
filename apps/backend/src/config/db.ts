import mongoose from 'mongoose';

function redactMongoUrl(url: string) {
  return url.replace(/\/\/([^:/@]+):([^@]+)@/, '//$1:***@');
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Conecta a MongoDB con reintentos. Si tras los reintentos no hay conexión, lanza error
 * para que el proceso termine (y el orquestador lo reinicie) en lugar de quedar en "modo degradado"
 * con peticiones colgadas.
 */
export default async function connectDb(url: string, retries = 5): Promise<void> {
  // Falla rápido si la conexión se pierde en vez de encolar operaciones indefinidamente
  mongoose.set('bufferTimeoutMS', 5000);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(url, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
        minPoolSize: 1,
      });
      console.log('[db] Conexión exitosa a MongoDB:', redactMongoUrl(url));
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[db] Intento ${attempt}/${retries} fallido (${message}).`);
      if (attempt === retries) throw err;
      await sleep(Math.min(1000 * 2 ** (attempt - 1), 10000));
    }
  }
}
