import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, TestServer } from './helpers';

const PNG = { name: 'avatar.png', type: 'image/png' };

describe('Perfil desde la app y enlaces de invitación', () => {
  let ctx: TestServer;
  let log: { uploaded: Array<{ url: string; publicId: string }>; deleted: string[] };
  let U: { t: string; id: string; name: string; email: string };

  before(async () => {
    ctx = await startTestServer();
    ({ mockStorageLog: log } = await import('../services/storage'));
    U = await ctx.register('Perfil');
  });
  after(async () => {
    await ctx.stop();
  });

  it('PATCH /me actualiza nombre, apodo, teléfono y avisos; null limpia', async () => {
    const r = await ctx.call(
      'PATCH',
      '/api/user/me',
      { name: 'Carla', lastName: 'Pérez', nickname: 'Carlita', phone: '+584121234567', notifyEmail: false },
      U.t
    );
    assert.equal(r.s, 200);
    assert.equal(r.d.name, 'Carla');
    assert.equal(r.d.nickname, 'Carlita');
    assert.equal(r.d.phone, '+584121234567');
    assert.equal(r.d.notifyEmail, false);

    const clear = await ctx.call('PATCH', '/api/user/me', { nickname: null, phone: null, lastName: null }, U.t);
    assert.equal(clear.s, 200);
    assert.equal(clear.d.nickname, undefined);
    assert.equal(clear.d.phone, undefined);
    assert.equal(clear.d.lastName, undefined);
  });

  it('sube la foto y DELETE /photo la quita y la borra del almacenamiento', async () => {
    const up = await ctx.upload('POST', '/api/user/upload', {}, { photo: PNG }, U.t);
    assert.equal(up.s, 200);
    assert.ok(up.d.photo);
    const deletedBefore = log.deleted.length;

    const del = await ctx.call('DELETE', '/api/user/photo', undefined, U.t);
    assert.equal(del.s, 200);
    assert.equal(del.d.photo, undefined);
    assert.equal(log.deleted.length, deletedBefore + 1);

    const me = await ctx.call('GET', '/api/user/me', undefined, U.t);
    assert.equal(me.d.photo, undefined);

    // Sin foto, quitarla de nuevo no falla
    const again = await ctx.call('DELETE', '/api/user/photo', undefined, U.t);
    assert.equal(again.s, 200);
  });

  it('DELETE /photo exige sesión', async () => {
    const r = await ctx.call('DELETE', '/api/user/photo');
    assert.equal(r.s, 401);
  });

  it('/join/:code muestra la página que abre la app con el código', async () => {
    const res = await fetch(`${ctx.baseUrl}/join/pana-ab12-c3`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /text\/html/);
    const html = await res.text();
    assert.ok(html.includes('PANA-AB12-C3'));
    assert.ok(html.includes('entrepanas://join/PANA-AB12-C3'));
  });

  it('/join/:code con un código inválido no inyecta HTML', async () => {
    const res = await fetch(`${ctx.baseUrl}/join/${encodeURIComponent('<script>x</script>')}`);
    assert.equal(res.status, 404);
    const html = await res.text();
    assert.ok(!html.includes('<script>'));
  });
});
