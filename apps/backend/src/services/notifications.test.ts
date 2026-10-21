import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, TestServer, futureDate } from '../test/helpers';

type U = { t: string; id: string; name: string; email: string };

describe('Correos transaccionales', () => {
  let ctx: TestServer;
  let mailLog: Array<{ to: string; subject: string; text: string; customId?: string }>;
  let flush: () => Promise<void>;
  let SA: string;
  let O: U, A: U, B: U, C: U;
  let G: string;
  let code: string;

  const sent = async () => {
    await flush();
    return mailLog.splice(0, mailLog.length);
  };
  const to = (list: typeof mailLog, email: string) => list.filter((m) => m.to === email);

  before(async () => {
    ctx = await startTestServer();
    ({ mailLog } = await import('./mail'));
    ({ flushNotifications: flush } = await import('./notifications'));
    SA = await ctx.superAdminToken();
  });
  beforeEach(async () => {
    await flush();
  });
  after(async () => {
    await ctx.stop();
  });

  it('bienvenida al registrarse', async () => {
    await sent();
    O = await ctx.register('Org');
    const mails = await sent();
    assert.equal(to(mails, O.email).length, 1);
    assert.match(mails[0].subject, /Bienvenido a EntrePanas/);
    [A, B, C] = await Promise.all(['Ana', 'Beto', 'Caro'].map((n) => ctx.register(n)));
    await sent();
  });

  it('cuenta creada por un administrador (sin incluir la contraseña)', async () => {
    await ctx.call('POST', '/user/admin', { name: 'Nuevo', email: 'nuevo@test.com', password: 'Temporal123', role: 'ORGANIZER' }, SA);
    const mails = await sent();
    const m = to(mails, 'nuevo@test.com');
    assert.equal(m.length, 1);
    assert.match(m[0].subject, /Se creó tu cuenta/);
    assert.ok(!m[0].text.includes('Temporal123'), 'nunca se envía la contraseña');
  });

  it('aviso de seguridad al cambiar la contraseña', async () => {
    await ctx.call('POST', '/user/change-password', { oldPassword: 'secret123', newPassword: 'secret123' }, C.t);
    const mails = await sent();
    assert.equal(to(mails, C.email).length, 1);
    assert.match(mails[0].subject, /contraseña de EntrePanas cambió/);
  });

  it('invitación por correo: omite a los miembros y valida permisos', async () => {
    const g = (await ctx.call('POST', '/group', { name: 'Hallacas', emoji: '🫔', exchangeDate: futureDate(), currency: 'VES', budgetMin: 450, budgetMax: 1600 }, O.t)).d;
    G = g.id;
    code = g.inviteCode;
    await sent();
    assert.equal((await ctx.call('POST', `/group/${G}/invitations`, { emails: ['malo'] }, O.t)).s, 400);
    assert.equal((await ctx.call('POST', `/group/${G}/invitations`, { emails: ['x@test.com'] }, A.t)).s, 404, 'no-miembro');
    const r = await ctx.call('POST', `/group/${G}/invitations`, { emails: ['amigo@test.com', 'AMIGO@test.com', O.email], message: '¡Vente pa la parranda!' }, O.t);
    assert.equal(r.s, 200);
    assert.deepEqual(r.d.invited, ['amigo@test.com']);
    assert.deepEqual(r.d.alreadyMembers, [O.email]);
    const mails = await sent();
    const inv = to(mails, 'amigo@test.com');
    assert.equal(inv.length, 1);
    assert.match(inv[0].subject, /te invitó/);
    assert.ok(inv[0].text.includes(code), 'incluye el código');
    assert.ok(inv[0].text.includes('Bs.'), 'presupuesto en bolívares');
    assert.ok(inv[0].text.includes('Vente pa la parranda'));
  });

  it('al unirse: bienvenida al miembro y aviso al organizador', async () => {
    await ctx.call('POST', '/group/join', { inviteCode: code }, A.t);
    const mails = await sent();
    assert.match(to(mails, A.email)[0].subject, /Ya estás en/);
    assert.match(to(mails, O.email)[0].subject, /se unió/);
    await ctx.call('POST', '/group/join', { inviteCode: code }, B.t);
    await ctx.call('POST', '/group/join', { inviteCode: code }, C.t);
    await ctx.call('POST', '/group/join', { inviteCode: code }, A.t); // repetido: no reenvía
    const more = await sent();
    assert.equal(to(more, A.email).length, 0);
  });

  it('expulsión: avisa al expulsado', async () => {
    await ctx.call('DELETE', `/group/${G}/members/${C.id}`, undefined, O.t);
    const mails = await sent();
    assert.match(to(mails, C.email)[0].subject, /Ya no participas/);
    await ctx.call('POST', '/group/join', { inviteCode: code }, C.t);
    await sent();
  });

  it('sorteo: todos reciben aviso y ningún correo revela asignaciones', async () => {
    await ctx.call('POST', `/group/${G}/draw`, undefined, O.t);
    const mails = await sent();
    for (const p of [O, A, B, C]) assert.equal(to(mails, p.email).length, 1, `aviso a ${p.name}`);
    for (const m of mails) {
      assert.match(m.subject, /sorteo/i);
      // Solo puede mencionar al organizador (dato público); nunca a otros participantes
      for (const p of [A, B, C]) assert.ok(!m.text.includes(`${p.name} Test`), 'no menciona participantes');
    }
  });

  it('una cuenta desactivada no recibe correos', async () => {
    await ctx.call('PATCH', `/user/admin/${B.id}/active`, { active: false }, SA);
    await ctx.call('DELETE', `/group/${G}/draw`, undefined, O.t);
    const mails = await sent();
    assert.equal(to(mails, B.email).length, 0);
    assert.equal(to(mails, A.email).length, 1, 'reinicio del sorteo a los demás');
    assert.equal(to(mails, O.email).length, 0, 'el organizador no se avisa a sí mismo');
  });

  it('revelación y eliminación del grupo', async () => {
    await ctx.call('POST', `/group/${G}/draw`, undefined, O.t);
    await sent();
    await ctx.call('POST', `/group/${G}/reveal`, undefined, O.t);
    const rev = await sent();
    assert.match(to(rev, A.email)[0].subject, /revelaron/);
    await ctx.call('DELETE', `/group/${G}`, undefined, O.t);
    const del = await sent();
    assert.match(to(del, A.email)[0].subject, /fue eliminado/);
    assert.equal(to(del, O.email).length, 0, 'quien elimina no recibe aviso');
  });

  it('invitar está bloqueado tras el sorteo', async () => {
    const g = (await ctx.call('POST', '/group', { name: 'Cerrado', exchangeDate: futureDate() }, O.t)).d;
    for (const p of [A, C]) await ctx.call('POST', '/group/join', { inviteCode: g.inviteCode }, p.t);
    await ctx.call('POST', `/group/${g.id}/draw`, undefined, O.t);
    const r = await ctx.call('POST', `/group/${g.id}/invitations`, { emails: ['tarde@test.com'] }, O.t);
    assert.equal(r.s, 409);
  });
});
