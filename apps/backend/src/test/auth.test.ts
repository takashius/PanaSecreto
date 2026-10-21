import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, TestServer, SEED_ADMIN } from './helpers';

describe('Autenticación y gestión de usuarios', () => {
  let ctx: TestServer;
  let SA: string;
  let saId: string;
  let U: string;
  let uId: string;
  let uEmail: string;
  let A: string;
  let aId: string;

  before(async () => {
    ctx = await startTestServer();
  });
  after(async () => {
    await ctx.stop();
  });

  it('el admin semilla inicia sesión y debe cambiar su contraseña', async () => {
    const r = await ctx.call('POST', '/user/login', { ...SEED_ADMIN, client: 'web' });
    assert.equal(r.s, 200);
    assert.equal(r.d.forcePasswordChangeOnNextLogin, true);
    SA = r.d.token;
    saId = r.d._id;
  });

  it('credenciales incorrectas -> 400 sin revelar cuál falló', async () => {
    const r = await ctx.login(SEED_ADMIN.email, 'malaclave');
    assert.equal(r.s, 400);
    assert.equal(r.d.code, 'INVALID_CREDENTIALS');
  });

  it('un USER no puede entrar al panel web', async () => {
    const u = await ctx.register('Web');
    const r = await ctx.call('POST', '/user/login', { email: u.email, password: 'secret123', client: 'web' });
    assert.equal(r.s, 403);
    assert.equal(r.d.code, 'WEB_ACCESS_DENIED');
  });

  it('registro público', async () => {
    const u = await ctx.register('Pana');
    U = u.t;
    uId = u.id;
    uEmail = u.email;
    assert.ok(U && uId);
  });

  it('registro con email duplicado -> 400', async () => {
    const r = await ctx.call('POST', '/user/register', { name: 'Otro', email: uEmail, password: 'secret123' });
    assert.equal(r.s, 400);
  });

  it('PATCH /user/me no permite cambiar la contraseña', async () => {
    const r = await ctx.call('PATCH', '/user/me', { password: 'hacked1' }, U);
    assert.equal(r.s, 400);
  });

  it('PATCH /user/me actualiza datos de perfil y no expone campos internos', async () => {
    const r = await ctx.call('PATCH', '/user/me', { name: 'Pana Nuevo', phone: '+58 412 0000000' }, U);
    assert.equal(r.s, 200);
    assert.equal(r.d.name, 'Pana Nuevo');
    for (const field of ['password', 'tokens', 'recoveryCode', 'recoveryAttempts']) {
      assert.equal(r.d[field], undefined, `no debe exponer ${field}`);
    }
  });

  it('change_password_required sin flag -> 403', async () => {
    const r = await ctx.call('POST', '/user/change_password_required', { password: 'hacked1' }, U);
    assert.equal(r.s, 403);
  });

  it('change_password_required con flag -> 200', async () => {
    const r = await ctx.call('POST', '/user/change_password_required', { password: 'NuevaSuper1' }, SA);
    assert.equal(r.s, 200);
  });

  it('el SUPER_ADMIN crea un ADMIN', async () => {
    const r = await ctx.call('POST', '/user/admin', { name: 'Ad', email: 'ad@test.com', password: 'adpass1', role: 'ADMIN' }, SA);
    assert.equal(r.s, 201);
    assert.equal(r.d.forcePasswordChangeOnNextLogin, true);
    const l = await ctx.call('POST', '/user/login', { email: 'ad@test.com', password: 'adpass1', client: 'web' });
    A = l.d.token;
    aId = l.d._id;
  });

  it('un ADMIN no puede crear un SUPER_ADMIN', async () => {
    const r = await ctx.call('POST', '/user/admin', { name: 'X', email: 'x@test.com', password: 'xpass11', role: 'SUPER_ADMIN' }, A);
    assert.equal(r.s, 403);
  });

  it('rol inválido -> 400', async () => {
    const r = await ctx.call('POST', '/user/admin', { name: 'X', email: 'x2@test.com', password: 'xpass11', role: 'NOPE' }, A);
    assert.equal(r.s, 400);
  });

  it('un USER no accede a la administración de usuarios', async () => {
    const r = await ctx.call('GET', '/user/admin', undefined, U);
    assert.equal(r.s, 403);
  });

  it('un ADMIN no puede resetear, desactivar ni editar a un SUPER_ADMIN', async () => {
    assert.equal((await ctx.call('PATCH', `/user/admin/${saId}/password`, { password: 'pwned12' }, A)).s, 403);
    assert.equal((await ctx.call('PATCH', `/user/admin/${saId}/active`, { active: false }, A)).s, 403);
    assert.equal((await ctx.call('PATCH', `/user/admin/${saId}`, { name: 'pwn' }, A)).s, 403);
    assert.equal((await ctx.call('PATCH', `/user/admin/${saId}/force-password-change`, { forcePasswordChangeOnNextLogin: true }, A)).s, 403);
  });

  it('nadie puede desactivarse a sí mismo', async () => {
    const r = await ctx.call('PATCH', `/user/admin/${aId}/active`, { active: false }, A);
    assert.equal(r.s, 400);
  });

  it('un ADMIN edita a un USER', async () => {
    const r = await ctx.call('PATCH', `/user/admin/${uId}`, { name: 'Pana Editado' }, A);
    assert.equal(r.s, 200);
    assert.equal(r.d.name, 'Pana Editado');
  });

  it('desactivar un usuario revoca sus sesiones', async () => {
    const victim = await ctx.register('Inactivo');
    assert.equal((await ctx.call('PATCH', `/user/admin/${victim.id}/active`, { active: false }, A)).s, 200);
    assert.equal((await ctx.call('GET', '/user/me', undefined, victim.t)).s, 401);
    assert.equal((await ctx.login(victim.email, 'secret123')).s, 400);
  });

  it('la búsqueda con caracteres de regex no rompe', async () => {
    const r = await ctx.call('GET', '/user/admin?q=' + encodeURIComponent('(['), undefined, A);
    assert.equal(r.s, 200);
  });

  it('cambio voluntario: exige la actual y revoca las demás sesiones', async () => {
    const u = await ctx.register('Cambio');
    const l2 = await ctx.login(u.email, 'secret123');
    const bad = await ctx.call('POST', '/user/change-password', { oldPassword: 'mala', newPassword: 'clave777' }, u.t);
    assert.equal(bad.s, 400);
    const ok = await ctx.call('POST', '/user/change-password', { oldPassword: 'secret123', newPassword: 'clave777' }, u.t);
    assert.equal(ok.s, 200);
    assert.equal((await ctx.call('GET', '/user/me', undefined, u.t)).s, 200, 'la sesión actual sigue viva');
    assert.equal((await ctx.call('GET', '/user/me', undefined, l2.d.token)).s, 401, 'otra sesión revocada');
  });

  it('logout invalida el token', async () => {
    const u = await ctx.register('Salir');
    assert.equal((await ctx.call('POST', '/user/logout', undefined, u.t)).s, 200);
    assert.equal((await ctx.call('GET', '/user/me', undefined, u.t)).s, 401);
  });

  it('token ausente o corrupto -> 401', async () => {
    assert.equal((await ctx.call('GET', '/user/me')).s, 401);
    assert.equal((await ctx.call('GET', '/user/me', undefined, 'abc.def.ghi')).s, 401);
  });

  it('cambio de rol: solo SUPER_ADMIN, nunca el propio, y cierra las sesiones del usuario', async () => {
    const u = await ctx.register('Ascenso');
    // un ADMIN no puede cambiar roles
    assert.equal((await ctx.call('PATCH', `/user/admin/${u.id}/role`, { role: 'ORGANIZER' }, A)).s, 403);
    // rol inválido
    assert.equal((await ctx.call('PATCH', `/user/admin/${u.id}/role`, { role: 'REY' }, SA)).s, 400);
    // propio rol
    const own = await ctx.call('PATCH', `/user/admin/${saId}/role`, { role: 'USER' }, SA);
    assert.equal(own.s, 400);
    assert.equal(own.d.code, 'CANNOT_CHANGE_OWN_ROLE');
    // cambio válido
    const r = await ctx.call('PATCH', `/user/admin/${u.id}/role`, { role: 'ORGANIZER' }, SA);
    assert.equal(r.s, 200);
    assert.deepEqual(r.d.role, ['ORGANIZER']);
    assert.equal((await ctx.call('GET', '/user/me', undefined, u.t)).s, 401, 'sesiones cerradas');
    const web = await ctx.call('POST', '/user/login', { email: u.email, password: 'secret123', client: 'web' });
    assert.equal(web.s, 200, 'ahora puede entrar al panel');
  });

  it('siempre queda al menos un SUPER_ADMIN (nadie cambia su propio rol)', async () => {
    const other = await ctx.register('Super2');
    assert.equal((await ctx.call('PATCH', `/user/admin/${other.id}/role`, { role: 'SUPER_ADMIN' }, SA)).s, 200);
    const l = await ctx.call('POST', '/user/login', { email: other.email, password: 'secret123', client: 'web' });
    // con dos super admins, uno puede degradar al otro
    assert.equal((await ctx.call('PATCH', `/user/admin/${saId}/role`, { role: 'ADMIN' }, l.d.token)).s, 200);
    // ahora "other" es el único: nadie puede degradarlo (ni siquiera él mismo)
    const self = await ctx.call('PATCH', `/user/admin/${other.id}/role`, { role: 'ADMIN' }, l.d.token);
    assert.equal(self.s, 400);
  });
});
