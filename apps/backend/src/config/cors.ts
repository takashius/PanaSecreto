import { CorsOptions } from 'cors';
import config from './commons';

export function buildCorsOptions(): CorsOptions {
  if (config.corsOrigin === '*') {
    if (config.isDeployedEnv) {
      console.warn('[cors] CORS_ORIGIN=* en un entorno desplegado. Define los dominios permitidos separados por coma.');
    }
    // Comodín real sin credenciales (la API usa Bearer tokens, no cookies)
    return {
      origin: '*',
      credentials: false,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'responseType'],
    };
  }

  const allowedOrigins = config.corsOrigin.split(',').map((o) => o.trim());

  return {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'responseType'],
  };
}
