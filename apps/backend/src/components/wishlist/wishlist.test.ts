import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, TestServer, futureDate } from '../../test/helpers';

type U = { t: string; id: string; name: string; email: string };

describe('Lista de deseos', () => {
  let ctx: TestServer;
  let O: U, A: U, B: U, X: U;
  let G: string;
  let wishId: string;
  const base = () => `/group/${G}/wishlist`;

  before(async () => {
    ctx = await startTestServer();
    [O, A, B, X] = await Promise.all(['Org', 'Ana', 'Beto', 'Extra'].map((n) => ctx.register(n)));
    const g = (await ctx.call('POST', '/group', { name: 'Deseos', exchangeDate: futureDate(), currency: 'VES' }, O.t)).d;
    G = g.id;
    for (const p of [A, B]) await ctx.call('POST', '/group/join', { inviteCode: g.inviteCode }, p.t);
  });
  after(async () => {
    await ctx.stop();
  });

  it('un no-miembro no accede', async () => {
    assert.equal((await ctx.call('GET', `${base()}/me`, undefined, X.t)).s, 404);
    assert.equal((await ctx.call('POST', base(), { title: 'Algo' }, X.t)).s, 404);
  });

  it('valida título, precio y URL', async () => {
    assert.equal((await ctx.call('POST', base(), { title: 'A' }, A.t)).s, 400);
    assert.equal((await ctx.call('POST', base(), { title: 'Libro', estimatedPrice: -5 }, A.t)).s, 400);
    assert.equal((await ctx.call('POST', base(), { title: 'Libro', productUrl: 'javascript:alert(1)' }, A.t)).s, 400);
    assert.equal((await ctx.call('POST', base(), { title: 'Libro', userId: X.id }, A.t)).s, 400, 'campos extra rechazados');
  });

  it('agrega deseos (moneda del grupo por defecto)', async () => {
    const r = await ctx.call('POST', base(), { title: 'Cien años de soledad', estimatedPrice: 300, productUrl: 'https://ejemplo.com/libro' }, A.t);
    assert.equal(r.s, 201);
    assert.equal(r.d.currency, 'VES');
    wishId = r.d.id;
    const fav = await ctx.call('POST', base(), { title: 'Termo Stanley', isFavorite: true }, A.t);
    assert.equal(fav.s, 201);
  });

  it('mi lista aparece con los favoritos primero', async () => {
    const r = await ctx.call('GET', `${base()}/me`, undefined, A.t);
    assert.equal(r.s, 200);
    assert.equal(r.d.results.length, 2);
    assert.equal(r.d.results[0].title, 'Termo Stanley');
  });

  it('solo el dueño edita o elimina (404 para otros)', async () => {
    assert.equal((await ctx.call('PATCH', `${base()}/${wishId}`, { title: 'Hackeado' }, B.t)).s, 404);
    assert.equal((await ctx.call('DELETE', `${base()}/${wishId}`, undefined, B.t)).s, 404);
    const r = await ctx.call('PATCH', `${base()}/${wishId}`, { title: 'Cien años de soledad (tapa dura)', productUrl: null }, A.t);
    assert.equal(r.s, 200);
    assert.equal(r.d.productUrl, undefined);
  });

  it('respeta el máximo de 20 deseos', async () => {
    for (let i = 0; i < 18; i++) await ctx.call('POST', base(), { title: `Deseo ${i}` }, A.t);
    const r = await ctx.call('POST', base(), { title: 'Uno más' }, A.t);
    assert.equal(r.s, 409);
    assert.equal(r.d.code, 'WISHLIST_FULL');
  });

  it('mis grupos dice cuántos deseos tengo en cada uno', async () => {
    const mine = (await ctx.call('GET', '/group', undefined, A.t)).d.results.find((g: any) => g.id === G);
    assert.equal(mine.myWishCount, 20);
  });

  it('antes del sorteo no hay lista asignada', async () => {
    assert.equal((await ctx.call('GET', `${base()}/assigned`, undefined, B.t)).s, 409);
  });

  it('tras el sorteo veo la lista de mi amigo secreto, no la de otros', async () => {
    await ctx.call('POST', base(), { title: 'Café de Mérida' }, B.t);
    assert.equal((await ctx.call('POST', `/group/${G}/draw`, undefined, O.t)).s, 200);
    const giverOfB: string[] = [];
    for (const p of [O, A, B]) {
      const mine = await ctx.call('GET', `/group/${G}/assignment`, undefined, p.t);
      const r = await ctx.call('GET', `${base()}/assigned`, undefined, p.t);
      assert.equal(r.s, 200);
      assert.equal(r.d.receiver.alias, mine.d.receiver.alias);
      assert.equal(r.d.receiver.userId, undefined, 'solo el alias antes de revelar');
      assert.ok(r.d.results.every((w: any) => w.userId === undefined), 'los deseos no exponen al dueño');
      if (r.d.results.some((w: any) => w.title === 'Café de Mérida')) giverOfB.push(p.id);
    }
    assert.equal(giverOfB.length, 1, 'solo quien le regala a B ve su lista');
  });

  it('al eliminar el grupo se borran sus deseos', async () => {
    assert.equal((await ctx.call('DELETE', `/group/${G}`, undefined, O.t)).s, 200);
    assert.equal((await ctx.call('GET', `${base()}/me`, undefined, A.t)).s, 404);
  });
});
