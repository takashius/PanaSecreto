import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { startTestServer, TestServer, futureDate } from './helpers';

type U = { t: string; id: string; name: string; email: string };
const TOKEN_O = 'ExponentPushToken[organizador-123]';
const TOKEN_A = 'ExponentPushToken[ana-456]';

describe('Notificaciones push (Expo)', () => {
  let ctx: TestServer;
  let pushLog: Array<{ to: string; title: string; body: string; data: Record<string, string | null>; badge?: number }>;
  let flush: () => Promise<void>;
  let insertInApp: typeof import('../services/notifications').insertInApp;
  let push: typeof import('../services/push');
  let O: U, A: U, B: U;

  const sent = async () => {
    await flush();
    return pushLog.splice(0, pushLog.length);
  };

  before(async () => {
    ctx = await startTestServer();
    push = await import('../services/push');
    pushLog = push.pushLog;
    ({ flushNotifications: flush, insertInApp } = await import('../services/notifications'));
    [O, A, B] = await Promise.all(['Org', 'Ana', 'Beto'].map((n) => ctx.register(n)));
  });
  after(async () => {
    await ctx.stop();
  });

  it('valida y registra el token del teléfono', async () => {
    const bad = await ctx.call('POST', '/api/push/token', { token: 'no-es-un-token' }, O.t);
    assert.equal(bad.s, 400);
    assert.equal(bad.d.code, 'INVALID_PUSH_TOKEN');
    const anon = await ctx.call('POST', '/api/push/token', { token: TOKEN_O });
    assert.equal(anon.s, 401);
    const ok = await ctx.call('POST', '/api/push/token', { token: TOKEN_O, platform: 'android', deviceName: 'Pixel' }, O.t);
    assert.equal(ok.s, 200);
    // Registrar dos veces no duplica
    assert.equal((await ctx.call('POST', '/api/push/token', { token: TOKEN_O, platform: 'android' }, O.t)).s, 200);
    assert.equal((await ctx.call('POST', '/api/push/token', { token: TOKEN_A }, A.t)).s, 200);
  });

  it('cada notificación nueva sale como push con su destino y el contador de no leídas', async () => {
    await sent();
    const g = (await ctx.call('POST', '/group', { name: 'Con push', exchangeDate: futureDate() }, O.t)).d;
    await ctx.call('POST', '/group/join', { inviteCode: g.inviteCode }, A.t);
    const msgs = await sent();
    const toOrg = msgs.filter((m) => m.to === TOKEN_O);
    assert.equal(toOrg.length, 1);
    assert.equal(toOrg[0].data.kind, 'join');
    assert.equal(toOrg[0].data.target, 'group');
    assert.equal(toOrg[0].data.groupId, g.id);
    assert.ok(toOrg[0].data.notificationId);
    assert.ok((toOrg[0].badge ?? 0) >= 1);
    assert.equal(msgs.filter((m) => m.to === TOKEN_A).length, 0, 'quien se une no recibe aviso de su propia entrada');
  });

  it('respeta notifyPush y notifyComments', async () => {
    await ctx.call('PATCH', '/api/user/me', { notifyComments: false }, A.t);
    await insertInApp([
      { userId: A.id, kind: 'comment', target: 'myWish', title: 'Comentario', body: 'x' },
      { userId: A.id, kind: 'draw', target: 'envelope', title: 'Sorteo', body: 'y' },
    ]);
    let msgs = await sent();
    assert.deepEqual(
      msgs.map((m) => m.title),
      ['Sorteo'],
      'con los avisos de comentarios apagados solo llega lo demás'
    );

    await ctx.call('PATCH', '/api/user/me', { notifyPush: false }, A.t);
    const me = await ctx.call('GET', '/api/user/me', undefined, A.t);
    assert.equal(me.d.notifyPush, false);
    await insertInApp([{ userId: A.id, kind: 'draw', target: 'envelope', title: 'Sorteo 2', body: 'y' }]);
    msgs = await sent();
    assert.equal(msgs.length, 0, 'push apagadas: nada (la notificación sigue en la campana)');
    const list = await ctx.call('GET', '/api/notifications', undefined, A.t);
    assert.ok(list.d.results.some((n: { title: string }) => n.title === 'Sorteo 2'));
    await ctx.call('PATCH', '/api/user/me', { notifyPush: true, notifyComments: true }, A.t);
  });

  it('los recordatorios no se envían como push de noche', async () => {
    assert.equal(push.isQuietHours(new Date('2026-12-01T07:00:00Z')), true); // 3 a. m. en Caracas
    assert.equal(push.isQuietHours(new Date('2026-12-01T16:00:00Z')), false); // 12 m.
    const { Types } = await import('mongoose');
    const night = new Date('2026-12-01T07:00:00Z');
    const src = { _id: new Types.ObjectId(), user: new Types.ObjectId(O.id), title: 'R', body: 'b' };
    assert.equal(await push.pushForNotifications([{ ...src, kind: 'reminder', target: 'group' }], night), 0);
    assert.equal(await push.pushForNotifications([{ ...src, kind: 'draw', target: 'group' }], night), 1);
    await sent();
  });

  it('un token registrado por otra cuenta pasa a la nueva (mismo teléfono)', async () => {
    await ctx.call('POST', '/api/push/token', { token: TOKEN_A }, B.t);
    await insertInApp([{ userId: A.id, kind: 'draw', target: 'envelope', title: 'Para Ana', body: 'x' }]);
    await insertInApp([{ userId: B.id, kind: 'draw', target: 'envelope', title: 'Para Beto', body: 'x' }]);
    const msgs = await sent();
    assert.deepEqual(msgs.map((m) => m.title), ['Para Beto']);
  });

  it('quitar el token (cerrar sesión) deja de enviar', async () => {
    assert.equal((await ctx.call('DELETE', '/api/push/token', { token: TOKEN_A }, B.t)).s, 200);
    await insertInApp([{ userId: B.id, kind: 'draw', target: 'envelope', title: 'Nada', body: 'x' }]);
    assert.equal((await sent()).length, 0);
  });

  it('con Expo: borra los tokens que Expo reporta como no registrados', async () => {
    const config = (await import('../config/commons')).default;
    const received: unknown[] = [];
    const fake = http.createServer((req, res) => {
      let raw = '';
      req.on('data', (c) => (raw += c));
      req.on('end', () => {
        const msgs = JSON.parse(raw) as Array<{ to: string }>;
        received.push(...msgs);
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            data: msgs.map((m) =>
              m.to === TOKEN_O ? { status: 'error', message: 'gone', details: { error: 'DeviceNotRegistered' } } : { status: 'ok', id: 'x' }
            ),
          })
        );
      });
    });
    await new Promise<void>((r) => fake.listen(0, r));
    const prev = { ...config.push };
    config.push.transport = 'expo';
    config.push.sendUrl = `http://127.0.0.1:${(fake.address() as AddressInfo).port}/send`;
    try {
      await insertInApp([{ userId: O.id, kind: 'draw', target: 'envelope', title: 'Último', body: 'x' }]);
      assert.equal(received.length, 1);
      const { PushToken } = await import('../components/push/model');
      assert.equal(await PushToken.countDocuments({ token: TOKEN_O }), 0, 'el token muerto se borró');
    } finally {
      Object.assign(config.push, prev);
      fake.close();
    }
  });

  it('cerrar todas las sesiones quita los teléfonos de la cuenta', async () => {
    await ctx.call('POST', '/api/push/token', { token: TOKEN_O }, O.t);
    await ctx.call('POST', '/user/me/logoutall', undefined, O.t);
    const { PushToken } = await import('../components/push/model');
    assert.equal(await PushToken.countDocuments({ token: TOKEN_O }), 0);
  });
});
