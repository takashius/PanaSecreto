/**
 * Inicio de sesión con Google: flujo por navegador (start → callback → ticket) y con ID token.
 * Google se simula con un servidor local (token + JWKS) y claves RSA generadas en la prueba.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import type { AddressInfo } from 'net';
import { generateKeyPairSync } from 'crypto';
import { sign } from 'jsonwebtoken';
import { startTestServer, TestServer } from './helpers';

const CLIENT_ID = 'web-client.apps.googleusercontent.com';
const APP_REDIRECT = 'exp://192.168.1.5:8081/--/auth/google';

describe('Iniciar sesión con Google', () => {
  let ctx: TestServer;
  let google: http.Server;
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const codes = new Map<string, Record<string, unknown>>();

  const idToken = (claims: Record<string, unknown>, aud = CLIENT_ID) =>
    sign({ iss: 'https://accounts.google.com', aud, email_verified: true, ...claims }, privateKey, {
      algorithm: 'RS256',
      keyid: 'test-key',
      expiresIn: '5m',
    });

  /** Simula el viaje por el navegador: start → (Google) → callback. Devuelve la URL final de regreso a la app */
  const browserFlow = async (claims: Record<string, unknown>, opts: { badNonce?: boolean; cancel?: boolean } = {}) => {
    const start = await fetch(`${ctx.baseUrl}/api/user/google/start?redirect=${encodeURIComponent(APP_REDIRECT)}`, {
      redirect: 'manual',
    });
    assert.equal(start.status, 302);
    const toGoogle = new URL(start.headers.get('location')!);
    const state = toGoogle.searchParams.get('state')!;
    const nonce = toGoogle.searchParams.get('nonce')!;
    const code = `code-${codes.size + 1}`;
    codes.set(code, { ...claims, nonce: opts.badNonce ? 'otro' : nonce });
    const query = opts.cancel ? `error=access_denied&state=${state}` : `code=${code}&state=${state}`;
    const cb = await fetch(`${ctx.baseUrl}/api/user/google/callback?${query}`, { redirect: 'manual' });
    assert.equal(cb.status, 302);
    return new URL(cb.headers.get('location')!.replace('exp://', 'http://'));
  };

  before(async () => {
    google = http.createServer((req, res) => {
      if (req.url?.startsWith('/certs')) {
        const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', alg: 'RS256', use: 'sig' };
        res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'max-age=60' });
        res.end(JSON.stringify({ keys: [jwk] }));
        return;
      }
      if (req.url?.startsWith('/token')) {
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          const params = new URLSearchParams(body);
          const claims = codes.get(params.get('code') || '');
          const okClient = params.get('client_id') === CLIENT_ID && params.get('client_secret') === 'secreto';
          if (!claims || !okClient || params.get('grant_type') !== 'authorization_code') {
            res.writeHead(400, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ error: 'invalid_grant' }));
            return;
          }
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ id_token: idToken(claims), access_token: 'x' }));
        });
        return;
      }
      res.writeHead(404).end();
    });
    await new Promise<void>((r) => google.listen(0, r));
    const base = `http://127.0.0.1:${(google.address() as AddressInfo).port}`;
    process.env.GOOGLE_WEB_CLIENT_ID = CLIENT_ID;
    process.env.GOOGLE_WEB_CLIENT_SECRET = 'secreto';
    process.env.GOOGLE_TOKEN_URL = `${base}/token`;
    process.env.GOOGLE_JWKS_URL = `${base}/certs`;
    process.env.GOOGLE_AUTH_URL = 'https://accounts.google.test/auth';
    ctx = await startTestServer();
  });
  after(async () => {
    await ctx.stop();
    await new Promise<void>((r) => google.close(() => r()));
  });

  it('la app sabe si Google está configurado', async () => {
    const r = await ctx.call('GET', '/api/user/google/config');
    assert.deepEqual(r.d, { enabled: true });
  });

  it('start: solo vuelve a la app (esquemas permitidos) y manda a Google con state y nonce', async () => {
    const bad = await fetch(`${ctx.baseUrl}/api/user/google/start?redirect=${encodeURIComponent('https://malo.com/robar')}`, {
      redirect: 'manual',
    });
    assert.equal(bad.status, 400);
    const ok = await fetch(`${ctx.baseUrl}/api/user/google/start?redirect=${encodeURIComponent(APP_REDIRECT)}`, {
      redirect: 'manual',
    });
    const url = new URL(ok.headers.get('location')!);
    assert.equal(url.origin + url.pathname, 'https://accounts.google.test/auth');
    assert.equal(url.searchParams.get('client_id'), CLIENT_ID);
    assert.match(url.searchParams.get('redirect_uri')!, /\/api\/user\/google\/callback$/);
    assert.equal(url.searchParams.get('scope'), 'openid email profile');
    assert.ok(url.searchParams.get('state') && url.searchParams.get('nonce'));
  });

  it('cuenta nueva: vuelve a la app con un ticket de un solo uso y se canjea por la sesión', async () => {
    const back = await browserFlow({ sub: 'g-1', email: 'Nuevo.Pana@gmail.com', given_name: 'Nuevo', family_name: 'Pana', picture: 'https://foto/1.jpg' });
    assert.equal(back.pathname, '/--/auth/google');
    const ticket = back.searchParams.get('ticket')!;
    assert.ok(ticket);
    assert.ok(!back.href.includes('eyJ'), 'el JWT nunca viaja en la URL');
    const r = await ctx.call('POST', '/api/user/google/exchange', { ticket });
    assert.equal(r.s, 200);
    assert.equal(r.d.email, 'nuevo.pana@gmail.com');
    assert.equal(r.d.name, 'Nuevo');
    assert.equal(r.d.lastName, 'Pana');
    assert.equal(r.d.photo, 'https://foto/1.jpg');
    assert.equal(r.d.isNew, true);
    assert.equal(r.d.hasPassword, false);
    assert.equal(r.d.googleLinked, true);
    assert.ok(r.d.token);
    assert.equal((await ctx.call('POST', '/api/user/google/exchange', { ticket })).s, 400, 'solo una vez');
    const me = await ctx.call('GET', '/user/me', undefined, r.d.token);
    assert.equal(me.s, 200);
    assert.equal(me.d.googleId, undefined, 'no se expone el googleId');

    // La segunda vez entra a la misma cuenta
    const again = await browserFlow({ sub: 'g-1', email: 'nuevo.pana@gmail.com', given_name: 'Nuevo' });
    const r2 = await ctx.call('POST', '/api/user/google/exchange', { ticket: again.searchParams.get('ticket') });
    assert.equal(r2.d._id, r.d._id);
    assert.equal(r2.d.isNew, false);
  });

  it('cuenta de Google sin contraseña: crea la suya sin pedir la actual y luego entra con correo', async () => {
    const back = await browserFlow({ sub: 'g-3', email: 'sinclave@gmail.com', name: 'Sin Clave Pérez' });
    const s = (await ctx.call('POST', '/api/user/google/exchange', { ticket: back.searchParams.get('ticket') })).d;
    assert.equal(s.name, 'Sin');
    assert.equal(s.lastName, 'Clave Pérez');
    const r = await ctx.call('POST', '/user/change-password', { newPassword: 'MiClave2026' }, s.token);
    assert.equal(r.s, 200);
    const login = await ctx.login('sinclave@gmail.com', 'MiClave2026');
    assert.equal(login.s, 200);
    assert.equal(login.d.hasPassword, true);
    // Ya tiene contraseña: ahora sí se pide la actual
    assert.equal((await ctx.call('POST', '/user/change-password', { newPassword: 'OtraClave1' }, login.d.token)).s, 400);
  });

  it('vincula una cuenta existente con el mismo correo (ID token directo)', async () => {
    const ana = await ctx.register('Ana');
    const r = await ctx.call('POST', '/api/user/google', { idToken: idToken({ sub: 'g-2', email: ana.email }) });
    assert.equal(r.s, 200);
    assert.equal(r.d._id, ana.id);
    assert.equal(r.d.isNew, false);
    assert.equal(r.d.hasPassword, true);
    assert.equal(r.d.googleLinked, true);
    // Sigue pudiendo entrar con su contraseña
    assert.equal((await ctx.login(ana.email, 'secret123')).s, 200);
    // El registro con ese correo avisa que ya existe
    const reg = await ctx.call('POST', '/user/register', { name: 'Otra', email: 'nuevo.pana@gmail.com', password: 'secret123' });
    assert.equal(reg.s, 400);
    assert.equal(reg.d.code, 'EMAIL_TAKEN');
    assert.match(reg.d.message, /Google/);
  });

  it('rechaza tokens inválidos, correos sin verificar y cancelaciones', async () => {
    const otherAud = await ctx.call('POST', '/api/user/google', { idToken: idToken({ sub: 'x', email: 'x@gmail.com' }, 'otro-cliente') });
    assert.equal(otherAud.s, 401);
    assert.equal(otherAud.d.code, 'GOOGLE_TOKEN_INVALID');
    const garbage = await ctx.call('POST', '/api/user/google', { idToken: 'no.es.token' });
    assert.equal(garbage.s, 401);
    const unverified = await ctx.call('POST', '/api/user/google', {
      idToken: idToken({ sub: 'y', email: 'y@gmail.com', email_verified: false }),
    });
    assert.equal(unverified.s, 403);
    assert.equal(unverified.d.code, 'GOOGLE_EMAIL_NOT_VERIFIED');

    const badNonce = await browserFlow({ sub: 'z', email: 'z@gmail.com' }, { badNonce: true });
    assert.equal(badNonce.searchParams.get('error'), 'GOOGLE_TOKEN_INVALID');
    const cancelled = await browserFlow({ sub: 'z', email: 'z@gmail.com' }, { cancel: true });
    assert.equal(cancelled.searchParams.get('error'), 'GOOGLE_CANCELLED');

    const forged = await fetch(`${ctx.baseUrl}/api/user/google/callback?code=x&state=falso`, { redirect: 'manual' });
    assert.equal(forged.status, 400, 'state falso: no redirige a ningún lado');
  });

  it('una cuenta desactivada no entra con Google', async () => {
    const SA = await ctx.superAdminToken();
    const beto = await ctx.register('Beto');
    assert.equal((await ctx.call('PATCH', `/user/admin/${beto.id}/active`, { active: false }, SA)).s, 200);
    const r = await ctx.call('POST', '/api/user/google', { idToken: idToken({ sub: 'g-9', email: beto.email }) });
    assert.equal(r.s, 403);
    assert.equal(r.d.code, 'USER_INACTIVE');
  });
});
