import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, TestServer } from './helpers';

describe('Recuperación de contraseña', () => {
  let ctx: TestServer;
  let user: { t: string; id: string; email: string };

  before(async () => {
    ctx = await startTestServer();
    user = await ctx.register('Olvido');
  });
  after(async () => {
    await ctx.stop();
  });

  const request = (email: string) => ctx.call('POST', '/user/recovery/request', { email });
  const submit = (email: string, code: number, newPass = 'otraclave1') =>
    ctx.call('POST', '/user/recovery', { email, code, newPass });

  it('el paso 1 ya no se expone por GET', async () => {
    assert.equal((await ctx.call('GET', `/user/recovery/${user.email}`)).s, 404);
  });

  it('correo inexistente responde igual que uno existente', async () => {
    const r = await request('nadie@test.com');
    assert.equal(r.s, 200);
    assert.equal(r.d.devCode, undefined);
  });

  it('email ausente -> 400', async () => {
    assert.equal((await ctx.call('POST', '/user/recovery/request', {})).s, 400);
  });

  let code: number;
  it('genera un código de 6 dígitos (devCode solo en test/desarrollo)', async () => {
    const r = await request(user.email);
    assert.equal(r.s, 200);
    code = r.d.devCode;
    assert.ok(code >= 100000 && code <= 999999);
  });

  it('no reenvía otro código antes de 60 segundos', async () => {
    const r = await request(user.email);
    assert.equal(r.s, 200);
    assert.equal(r.d.devCode, undefined, 'no se generó un código nuevo');
  });

  it('el código se invalida tras 5 intentos fallidos', async () => {
    const wrong = code === 111111 ? 222222 : 111111;
    for (let i = 0; i < 5; i++) assert.equal((await submit(user.email, wrong)).s, 400);
    assert.equal((await submit(user.email, code)).s, 400);
  });

  it('con un código nuevo restablece la contraseña y cierra las sesiones', async () => {
    const r = await request(user.email);
    const ok = await submit(user.email, r.d.devCode);
    assert.equal(ok.s, 200);
    assert.equal((await ctx.call('GET', '/user/me', undefined, user.t)).s, 401);
    assert.equal((await ctx.login(user.email, 'otraclave1')).s, 200);
  });

  it('el código no se puede reutilizar', async () => {
    const r = await request(user.email);
    // cooldown: tras un restablecimiento exitoso no hay código vigente, así que se genera uno nuevo
    assert.ok(r.d.devCode);
    assert.equal((await submit(user.email, r.d.devCode, 'tercera1')).s, 200);
    assert.equal((await submit(user.email, r.d.devCode, 'cuarta11')).s, 400);
  });

  it('nueva contraseña corta -> 400', async () => {
    const u = await ctx.register('Corta');
    const r = await request(u.email);
    assert.equal((await submit(u.email, r.d.devCode, '123')).s, 400);
  });

  it('una cuenta desactivada no recibe código', async () => {
    const u = await ctx.register('Inactiva');
    const sa = await ctx.superAdminToken();
    await ctx.call('PATCH', `/user/admin/${u.id}/active`, { active: false }, sa);
    const r = await request(u.email);
    assert.equal(r.s, 200);
    assert.equal(r.d.devCode, undefined);
  });
});
