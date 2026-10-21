import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, TestServer, futureDate } from '../../test/helpers';

type U = { t: string; id: string; name: string; email: string };
const PNG = { name: 'termo.png', type: 'image/png' };

describe('Imágenes de la lista de deseos (Cloudinary simulado)', () => {
  let ctx: TestServer;
  let log: { uploaded: Array<{ url: string; publicId: string }>; deleted: string[] };
  let O: U, A: U, B: U, X: U;
  let G: string;
  let wishId: string;
  let firstImage: string;
  const base = () => `/group/${G}/wishlist`;

  before(async () => {
    ctx = await startTestServer();
    ({ mockStorageLog: log } = await import('../../services/storage'));
    [O, A, B, X] = await Promise.all(['Org', 'Ana', 'Beto', 'Extra'].map((n) => ctx.register(n)));
    const g = (await ctx.call('POST', '/group', { name: 'Con fotos', exchangeDate: futureDate() }, O.t)).d;
    G = g.id;
    for (const p of [A, B]) await ctx.call('POST', '/group/join', { inviteCode: g.inviteCode }, p.t);
  });
  after(async () => {
    await ctx.stop();
  });

  it('crea un deseo con imagen vía multipart y convierte los campos', async () => {
    const r = await ctx.upload('POST', base(), { title: 'Termo Stanley', estimatedPrice: '45.5', isFavorite: 'true' }, { image: PNG }, A.t);
    assert.equal(r.s, 201, JSON.stringify(r.d));
    assert.match(r.d.imageUrl, /\/EntrePanas\/wishlist\/.+\.png$/);
    assert.equal(r.d.estimatedPrice, 45.5);
    assert.equal(r.d.isFavorite, true);
    wishId = r.d.id;
    firstImage = r.d.imageUrl;
  });

  it('rechaza tipos no permitidos y archivos muy grandes', async () => {
    const bad = await ctx.upload('POST', base(), { title: 'Texto' }, { image: { name: 'x.txt', type: 'text/plain' } }, A.t);
    assert.equal(bad.s, 400);
    assert.equal(bad.d.code, 'INVALID_FILE_TYPE');
    const svg = await ctx.upload('POST', base(), { title: 'Vector' }, { image: { name: 'x.svg', type: 'image/svg+xml' } }, A.t);
    assert.equal(svg.s, 400);
    const big = await ctx.upload('POST', base(), { title: 'Enorme' }, { image: { name: 'big.png', type: 'image/png', size: 9 * 1024 * 1024 } }, A.t);
    assert.equal(big.s, 413);
    assert.equal(big.d.code, 'FILE_TOO_LARGE');
  });

  it('un no-miembro no puede subir nada', async () => {
    const before = log.uploaded.length;
    const r = await ctx.upload('POST', base(), { title: 'Intruso' }, { image: PNG }, X.t);
    assert.equal(r.s, 404);
    assert.equal(log.uploaded.length, before, 'no se subió a Cloudinary');
  });

  it('si la validación falla, la imagen subida se borra (sin huérfanas)', async () => {
    const r = await ctx.upload('POST', base(), { title: 'A' }, { image: PNG }, A.t);
    assert.equal(r.s, 400);
    const orphan = log.uploaded[log.uploaded.length - 1];
    assert.ok(log.deleted.includes(orphan.publicId));
  });

  it('reemplazar la imagen borra la anterior', async () => {
    const r = await ctx.upload('PATCH', `${base()}/${wishId}`, {}, { image: { name: 'nuevo.jpg', type: 'image/jpeg' } }, A.t);
    assert.equal(r.s, 200);
    assert.notEqual(r.d.imageUrl, firstImage);
    assert.ok(log.deleted.some((id) => firstImage.includes(id)));
  });

  it('removeImage quita la imagen', async () => {
    const current = (await ctx.call('GET', `${base()}/me`, undefined, A.t)).d.results.find((w: any) => w.id === wishId).imageUrl;
    const r = await ctx.call('PATCH', `${base()}/${wishId}`, { removeImage: true }, A.t);
    assert.equal(r.s, 200);
    assert.equal(r.d.imageUrl, undefined);
    assert.ok(log.deleted.some((id) => current.includes(id)));
  });

  it('eliminar un deseo borra su imagen', async () => {
    const w = (await ctx.upload('POST', base(), { title: 'Café de Mérida' }, { image: PNG }, B.t)).d;
    assert.equal((await ctx.call('DELETE', `${base()}/${w.id}`, undefined, B.t)).s, 200);
    assert.ok(log.deleted.some((id) => w.imageUrl.includes(id)));
  });

  it('el amigo secreto ve la imagen, y al eliminar el grupo se borran todas', async () => {
    const w = (await ctx.upload('POST', base(), { title: 'Audífonos' }, { image: PNG }, B.t)).d;
    await ctx.upload('POST', base(), { title: 'Libro' }, { image: PNG }, O.t);
    await ctx.call('POST', `/group/${G}/draw`, undefined, O.t);
    const lists = await Promise.all([O, A, B].map((p) => ctx.call('GET', `${base()}/assigned`, undefined, p.t)));
    assert.ok(lists.some((l) => l.d.results.some((x: any) => x.imageUrl === w.imageUrl)));
    const deletedBefore = log.deleted.length;
    assert.equal((await ctx.call('DELETE', `/group/${G}`, undefined, O.t)).s, 200);
    assert.ok(log.deleted.length >= deletedBefore + 2, 'imágenes de los deseos borradas');
  });

  it('avatar: subir uno nuevo borra el anterior', async () => {
    const first = await ctx.upload('POST', '/user/upload', {}, { photo: PNG }, A.t);
    assert.equal(first.s, 200);
    assert.match(first.d.photo, /\/avatars\//);
    const second = await ctx.upload('POST', '/user/upload', {}, { photo: PNG }, A.t);
    assert.ok(log.deleted.some((id) => first.d.photo.includes(id)));
    assert.notEqual(second.d.photo, first.d.photo);
  });
});
