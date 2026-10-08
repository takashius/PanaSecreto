import { CorsOptions } from 'cors';
import config from './commons';

export function buildCorsOptions(): CorsOptions {
  if (config.corsOrigin === '*') {
    return {
      origin: true,
      credentials: true,
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
