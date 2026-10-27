import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, TestServer, futureDate } from './helpers';

type U = { t: string; id: string; name: string; email: string };

describe('Avisos push desde el panel', () => {
  let ctx: TestServer;
  let SA: string;
  let pushLog: Array<{ to: string; title: string; body: string; data: Record<string, string | null> }>;
  let O: U, A: U, B: U, C: U;
  let G: string;

  const sent = () => pushLog.splice(0, pushLog.length);

  before(async () => {
    ctx = await startTestServer();
    ({ pushLog } = await import('../services/push'));
    SA = await ctx.superAdminToken();
    [O, A, B, C] = await Promise.all(['Org', 'Ana', 'Beto', 'Caro'].map((n) => ctx.register(n)));
    // O, A y B tienen la app; C no. B apagó las push.
    await ctx.call('POST', '/api/push/token', { token: 'ExponentPushToken[org]', platform: 'android' }, O.t);
    await ctx.call('POST', '/api/push/token', { token: 'ExponentPushToken[ana-1]', platform: 'android' }, A.t);
    await ctx.call('POST', '/api/push/token', { token: 'ExponentPushToken[ana-2]', platform: 'ios' }, A.t);
    await ctx.call('POST', '/api/push/token', { token: 'ExponentPushToken[beto]' }, B.t);
    await ctx.call('PATCH', '/api/user/me', { notifyPush: false }, B.t);
    const g = (await ctx.call('POST', '/group', { name: 'Avisos', exchangeDate: futureDate() }, O.t)).d;
    G = g.id;
    for (const p of [A, C]) await ctx.call('POST', '/group/join', { inviteCode: g.inviteCode }, p.t);
    const { flushNotifications } = await import('../services/notifications');
    await flushNotifications();
    sent();
  });
  after(async () => {
    await ctx.stop();
  });

  it('solo administradores', async () => {
    assert.equal((await ctx.call('GET', '/api/push/admin/stats', undefined, A.t)).s, 403);
    assert.equal((await ctx.call('POST', '/api/push/admin/send', { audience: 'all', title: 'x', body: 'y' }, A.t)).s, 403);
  });

  it('estadísticas y vista previa de destinatarios', async () => {
    const stats = await ctx.call('GET', '/api/push/admin/stats', undefined, SA);
    assert.equal(stats.s, 200);
    assert.equal(stats.d.devices, 4);
    assert.equal(stats.d.android, 2);
    assert.equal(stats.d.ios, 1);
    assert.equal(stats.d.usersWithDevice, 3);
    assert.equal(stats.d.reachable, 2);

    const group = await ctx.call('GET', `/api/push/admin/audience?audience=group&groupId=${G}`, undefined, SA);
    assert.equal(group.s, 200);
    assert.equal(group.d.selected, 3); // O, A, C
    assert.equal(group.d.withDevice, 2);
    assert.equal(group.d.reachable, 2);
    assert.equal(group.d.devices, 3);
    assert.match(group.d.groupName, /Avisos/);

    const users = await ctx.call('GET', `/api/push/admin/audience?audience=users&userIds=${B.id},${C.id}`, undefined, SA);
    assert.deepEqual(
      { selected: users.d.selected, reachable: users.d.reachable, optedOut: users.d.optedOut },
      { selected: 2, reachable: 0, optedOut: 1 }
    );
  });

  it('valida el contenido y los destinatarios', async () => {
    assert.equal((await ctx.call('POST', '/api/push/admin/send', { audience: 'all', title: '', body: 'y' }, SA)).d.code, 'TITLE_REQUIRED');
    assert.equal((await ctx.call('POST', '/api/push/admin/send', { audience: 'all', title: 'x'.repeat(81), body: 'y' }, SA)).d.code, 'TITLE_TOO_LONG');
    assert.equal((await ctx.call('POST', '/api/push/admin/send', { audience: 'nadie', title: 'x', body: 'y' }, SA)).d.code, 'INVALID_AUDIENCE');
    assert.equal((await ctx.call('POST', '/api/push/admin/send', { audience: 'group', title: 'x', body: 'y' }, SA)).d.code, 'GROUP_REQUIRED');
    assert.equal((await ctx.call('POST', '/api/push/admin/send', { audience: 'users', userIds: [], title: 'x', body: 'y' }, SA)).d.code, 'USERS_REQUIRED');
    const none = await ctx.call('POST', '/api/push/admin/send', { audience: 'users', userIds: [B.id, C.id], title: 'x', body: 'y' }, SA);
    assert.equal(none.s, 409);
    assert.equal(none.d.code, 'NO_RECIPIENTS');
    assert.equal(sent().length, 0);
  });

  it('a un grupo: solo a los miembros con push activas, y abre el grupo al tocarla', async () => {
    const r = await ctx.call('POST', '/api/push/admin/send', { audience: 'group', groupId: G, title: '¡Pilas!', body: 'El sorteo es mañana.' }, SA);
    assert.equal(r.s, 201);
    assert.equal(r.d.sent, 3);
    const msgs = sent();
    assert.deepEqual(msgs.map((m) => m.to).sort(), ['ExponentPushToken[ana-1]', 'ExponentPushToken[ana-2]', 'ExponentPushToken[org]']);
    assert.equal(msgs[0].data.groupId, G);
    assert.equal(msgs[0].data.target, 'group');
    assert.equal(msgs[0].data.kind, 'announcement');
    // Sin «también en la campana» no se crea notificación
    const list = await ctx.call('GET', '/api/notifications', undefined, A.t);
    assert.ok(!list.d.results.some((n: { title: string }) => n.title === '¡Pilas!'));
  });

  it('a todos y también en la campana (incluso a quien no tiene la app)', async () => {
    const r = await ctx.call('POST', '/api/push/admin/send', { audience: 'all', title: 'Novedades', body: 'Ya puedes chatear en vivo.', inApp: true }, SA);
    assert.equal(r.s, 201);
    assert.equal(r.d.reachable, 2);
    const msgs = sent();
    assert.equal(msgs.length, 3, 'O (1) + Ana (2); Beto tiene las push apagadas');
    assert.ok(msgs.every((m) => m.data.notificationId), 'con campana, la push trae la notificación para marcarla leída');
    for (const u of [B, C]) {
      const list = await ctx.call('GET', '/api/notifications', undefined, u.t);
      const n = list.d.results.find((x: { title: string }) => x.title === 'Novedades');
      assert.ok(n, 'queda en la campana');
      assert.equal(n.kind, 'announcement');
    }
  });

  it('a usuarios elegidos y el historial', async () => {
    const r = await ctx.call('POST', '/api/push/admin/send', { audience: 'users', userIds: [A.id], title: 'Hola Ana', body: 'Prueba directa' }, SA);
    assert.equal(r.s, 201);
    assert.equal(sent().length, 2);
    const h = await ctx.call('GET', '/api/push/admin/campaigns', undefined, SA);
    assert.equal(h.s, 200);
    assert.equal(h.d.total, 3);
    const last = h.d.results[0];
    assert.equal(last.title, 'Hola Ana');
    assert.equal(last.audience, 'users');
    assert.equal(last.users[0].email, A.email);
    assert.equal(last.devices, 2);
    assert.ok(last.sentByName);
    assert.equal(h.d.results[2].groupName.includes('Avisos'), true);
  });
});
