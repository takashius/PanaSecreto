import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, TestServer, futureDate } from '../../test/helpers';

describe('Estadísticas del dashboard', () => {
  let ctx: TestServer;
  let SA: string;
  let userToken: string;

  before(async () => {
    ctx = await startTestServer();
    SA = await ctx.superAdminToken();
    const [o, a, b] = await Promise.all(['Org', 'Ana', 'Beto'].map((n) => ctx.register(n)));
    userToken = a.t;
    const g = (await ctx.call('POST', '/group', { name: 'Navidad', emoji: '🎄', exchangeDate: futureDate(10) }, o.t)).d;
    await ctx.call('POST', '/group/join', { inviteCode: g.inviteCode }, a.t);
    await ctx.call('POST', '/group/join', { inviteCode: g.inviteCode }, b.t);
    await ctx.call('POST', `/group/${g.id}/draw`, undefined, o.t);
    await ctx.call('POST', '/group', { name: 'Oficina', exchangeDate: futureDate(5) }, o.t);
    await ctx.call('POST', `/group/${g.id}/wishlist`, { title: 'Libro' }, a.t);
  });
  after(async () => {
    await ctx.stop();
  });

  it('solo administradores', async () => {
    assert.equal((await ctx.call('GET', '/api/stats', undefined, userToken)).s, 403);
    assert.equal((await ctx.call('GET', '/api/stats')).s, 401);
  });

  it('devuelve conteos correctos', async () => {
    const r = await ctx.call('GET', '/api/stats', undefined, SA);
    assert.equal(r.s, 200);
    assert.equal(r.d.users.total, 4); // admin semilla + 3
    assert.equal(r.d.users.byRole.USER, 3);
    assert.equal(r.d.users.byRole.SUPER_ADMIN, 1);
    assert.equal(r.d.groups.total, 2);
    assert.equal(r.d.groups.byStatus.LOCKED, 1);
    assert.equal(r.d.groups.byStatus.WAITING, 1);
    assert.equal(r.d.groups.totalMembers, 4);
    assert.equal(r.d.wishes.total, 1);
  });

  it('serie de 30 días y próximos intercambios ordenados', async () => {
    const r = await ctx.call('GET', '/api/stats', undefined, SA);
    assert.equal(r.d.activityByDay.length, 30);
    const totalSignups = r.d.activityByDay.reduce((s: number, d: any) => s + d.signups, 0);
    assert.equal(totalSignups, 4);
    assert.deepEqual(r.d.upcomingExchanges.map((g: any) => g.name), ['Oficina', 'Navidad']);
  });
});
