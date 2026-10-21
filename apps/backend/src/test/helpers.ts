/**
 * Utilidades para tests de integración: MongoDB en memoria + app Express en un puerto efímero.
 *
 * Uso:
 *   const ctx = await startTestServer();
 *   const r = await ctx.call('POST', '/user/login', { ... });
 *   await ctx.stop();
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { AddressInfo } from 'net';
import type { Server } from 'http';

export interface ApiResponse<T = any> {
  s: number;
  d: T;
}

export interface TestServer {
  baseUrl: string;
  call: <T = any>(method: string, path: string, body?: unknown, token?: string) => Promise<ApiResponse<T>>;
  /** Envía multipart/form-data: campos de texto + archivos opcionales */
  upload: <T = any>(
    method: string,
    path: string,
    fields: Record<string, string>,
    files: Record<string, TestFile>,
    token?: string
  ) => Promise<ApiResponse<T>>;
  register: (name: string) => Promise<{ t: string; id: string; name: string; email: string }>;
  login: (email: string, password: string) => Promise<ApiResponse>;
  superAdminToken: () => Promise<string>;
  stop: () => Promise<void>;
}

export interface TestFile {
  name: string;
  type: string;
  size?: number;
}

/** PNG mínimo válido (1x1) para pruebas de subida */
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

export const SEED_ADMIN = { email: 'admin@panasecreto.local', password: 'Admin123456!' };
export const TEST_PASSWORD = 'secret123';

export async function startTestServer(): Promise<TestServer> {
  const mongo = await MongoMemoryServer.create();

  // La configuración se lee al importar: definir el entorno antes de cargar la app
  process.env.NODE_ENV = 'test';
  process.env.MONGO_URI = mongo.getUri('panasecreto_test');
  process.env.MAIL_TRANSPORT = 'log';
  process.env.UPLOAD_TRANSPORT = 'mock';

  const mongoose = (await import('mongoose')).default;
  const { createApp } = await import('../app');
  const { seedAppData } = await import('../middleware/seed');

  await mongoose.connect(process.env.MONGO_URI);
  await seedAppData();

  const app = createApp();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  const call: TestServer['call'] = async (method, path, body, token) => {
    const res = await fetch(baseUrl + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { s: res.status, d: data };
  };

  const upload: TestServer['upload'] = async (method, path, fields, files, token) => {
    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) form.append(k, v);
    for (const [k, f] of Object.entries(files)) {
      const content = f.size ? Buffer.alloc(f.size, 1) : PNG_1X1;
      form.append(k, new Blob([content], { type: f.type }), f.name);
    }
    const res = await fetch(baseUrl + path, {
      method,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { s: res.status, d: data };
  };

  let counter = 0;
  const register: TestServer['register'] = async (name) => {
    counter += 1;
    const email = `${name.toLowerCase()}.${counter}@test.com`;
    const r = await call('POST', '/user/register', { name, lastName: 'Test', email, password: TEST_PASSWORD });
    if (r.s !== 201) throw new Error(`No se pudo registrar ${name}: ${JSON.stringify(r.d)}`);
    return { t: r.d.token, id: r.d._id, name, email };
  };

  const login: TestServer['login'] = (email, password) => call('POST', '/user/login', { email, password });

  let saToken: string | undefined;
  const superAdminToken = async () => {
    if (!saToken) {
      const r = await login(SEED_ADMIN.email, SEED_ADMIN.password);
      saToken = r.d.token as string;
    }
    return saToken;
  };

  const stop = async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
    await mongo.stop();
  };

  return { baseUrl, call, upload, register, login, superAdminToken, stop };
}

export const futureDate = (days = 30) => new Date(Date.now() + days * 864e5).toISOString();
