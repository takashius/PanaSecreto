import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, TestServer, futureDate } from '../../test/helpers';

type U = { t: string; id: string; name: string; email: string };

describe('API de grupos', () => {
  let ctx: TestServer;
  let O: U, P1: U, P2: U, P3: U, P4: U, X: U;
  let SA: string;
  let G: string;
  let code: string;
  const member = (d: any, id: string) => d.members.find((m: any) => m.userId === id);

  before(async () => {
    ctx = await startTestServer();
    [O, P1, P2, P3, P4, X] = await Promise.all(['Org', 'Ana', 'Beto', 'Caro', 'Dani', 'Extra'].map((n) => ctx.register(n)));
    SA = await ctx.superAdminToken();
  });
  after(async () => {
    await ctx.stop();
  });

  describe('Creación y validación', () => {
    it('rechaza fecha pasada, rango invertido y nombre corto', async () => {
      assert.equal((await ctx.call('POST', '/group', { name: 'Hallacas', exchangeDate: '2020-01-01' }, O.t)).s, 400);
      assert.equal((await ctx.call('POST', '/group', { name: 'Hallacas', exchangeDate: futureDate(), budgetMin: 50, budgetMax: 10 }, O.t)).s, 400);
      assert.equal((await ctx.call('POST', '/group', { name: 'X', exchangeDate: futureDate() }, O.t)).s, 400);
    });

    it('requiere autenticación', async () => {
      assert.equal((await ctx.call('POST', '/group', { name: 'Sin token', exchangeDate: futureDate() })).s, 401);
    });

    it('crea el grupo con código PANA-XXXX-XX y el creador como organizador', async () => {
      const r = await ctx.call(
        'POST',
        '/group',
        { name: 'Hallacas con los Primos', emoji: '🫔', exchangeDate: futureDate(), currency: 'VES', budgetMin: 450, budgetMax: 1600, maxParticipants: 5 },
        O.t
      );
      assert.equal(r.s, 201);
      assert.equal(r.d.status, 'WAITING');
      assert.match(r.d.inviteCode, /^PANA-[A-Z2-9]{4}-[A-Z2-9]{2}$/);
      assert.equal(r.d.isCreator, true);
      assert.equal(r.d.memberCount, 1);
      G = r.d.id;
      code = r.d.inviteCode;
    });
  });

  describe('Invitaciones y membresía', () => {
    it('un no-miembro recibe 404 (no se revela que existe)', async () => {
      assert.equal((await ctx.call('GET', `/group/${G}`, undefined, X.t)).s, 404);
      assert.equal((await ctx.call('GET', '/group/123', undefined, O.t)).s, 404);
    });

    it('vista previa por código sin importar mayúsculas', async () => {
      const r = await ctx.call('GET', `/group/code/${code.toLowerCase()}`, undefined, P1.t);
      assert.equal(r.s, 200);
      assert.equal(r.d.canJoin, true);
      assert.equal(r.d.alreadyMember, false);
      assert.equal(r.d.creatorName, 'Org Test');
    });

    it('código inexistente -> 404', async () => {
      const r = await ctx.call('POST', '/group/join', { inviteCode: 'PANA-ZZZZ-ZZ' }, P1.t);
      assert.equal(r.s, 404);
      assert.equal(r.d.code, 'INVALID_INVITE_CODE');
    });

    it('los participantes se unen; repetir es idempotente', async () => {
      for (const p of [P1, P2, P3]) assert.equal((await ctx.call('POST', '/group/join', { inviteCode: code }, p.t)).s, 201);
      const again = await ctx.call('POST', '/group/join', { inviteCode: code }, P1.t);
      assert.equal(again.s, 200);
      assert.equal(again.d.memberCount, 4);
    });

    it('un participante no ve emails ni exclusiones; el organizador sí', async () => {
      const asP = await ctx.call('GET', `/group/${G}`, undefined, P1.t);
      assert.ok(asP.d.members.every((m: any) => m.email === undefined && m.exclusions === undefined));
      const asO = await ctx.call('GET', `/group/${G}`, undefined, O.t);
      assert.ok(asO.d.members.every((m: any) => m.email && Array.isArray(m.exclusions)));
    });

    it('respeta el cupo máximo', async () => {
      assert.equal((await ctx.call('POST', '/group/join', { inviteCode: code }, P4.t)).s, 201);
      const full = await ctx.call('POST', '/group/join', { inviteCode: code }, X.t);
      assert.equal(full.s, 409);
      assert.equal(full.d.code, 'GROUP_FULL');
    });

    it('un participante sale; el organizador no puede salir', async () => {
      assert.equal((await ctx.call('DELETE', `/group/${G}/members/me`, undefined, P4.t)).s, 200);
      assert.equal((await ctx.call('DELETE', `/group/${G}/members/me`, undefined, O.t)).s, 409);
    });

    it('solo el organizador expulsa', async () => {
      await ctx.call('POST', '/group/join', { inviteCode: code }, P4.t);
      assert.equal((await ctx.call('DELETE', `/group/${G}/members/${P4.id}`, undefined, P1.t)).s, 403);
      const r = await ctx.call('DELETE', `/group/${G}/members/${P4.id}`, undefined, O.t);
      assert.equal(r.s, 200);
      assert.equal(r.d.memberCount, 4);
    });

    it('el cupo nunca se excede con uniones simultáneas', async () => {
      const g = (await ctx.call('POST', '/group', { name: 'Carrera', exchangeDate: futureDate(), maxParticipants: 3 }, O.t)).d;
      await ctx.call('POST', '/group/join', { inviteCode: g.inviteCode }, P1.t);
      const race = await Promise.all([P2, P3, P4, X].map((p) => ctx.call('POST', '/group/join', { inviteCode: g.inviteCode }, p.t)));
      assert.equal(race.filter((x) => x.s === 201).length, 1);
      assert.equal((await ctx.call('GET', `/group/${g.id}`, undefined, O.t)).d.memberCount, 3);
      await ctx.call('DELETE', `/group/${g.id}`, undefined, O.t);
    });
  });

  describe('Edición', () => {
    it('solo el organizador edita', async () => {
      assert.equal((await ctx.call('PATCH', `/group/${G}`, { name: 'Hackeado' }, P1.t)).s, 403);
    });

    it('valida cupo, estado y presupuesto', async () => {
      const below = await ctx.call('PATCH', `/group/${G}`, { maxParticipants: 3 }, O.t);
      assert.equal(below.s, 409);
      assert.equal(below.d.code, 'MAX_BELOW_MEMBERS');
      assert.equal((await ctx.call('PATCH', `/group/${G}`, { status: 'COMPLETED' }, O.t)).s, 400);
      assert.equal((await ctx.call('PATCH', `/group/${G}`, { budgetMax: 400 }, O.t)).s, 400);
    });

    it('el organizador edita', async () => {
      const r = await ctx.call('PATCH', `/group/${G}`, { name: 'Hallacas 2026' }, O.t);
      assert.equal(r.s, 200);
      assert.equal(r.d.name, 'Hallacas 2026');
    });

    it('regenera el código de invitación', async () => {
      const r = await ctx.call('POST', `/group/${G}/invite-code`, undefined, O.t);
      assert.equal(r.s, 200);
      assert.notEqual(r.d.inviteCode, code);
      code = r.d.inviteCode;
    });
  });

  describe('Exclusiones', () => {
    it('rechaza exclusiones con no-miembros', async () => {
      const r = await ctx.call('PUT', `/group/${G}/members/${P1.id}/exclusions`, { exclusions: [X.id] }, O.t);
      assert.equal(r.s, 400);
      assert.equal(r.d.code, 'INVALID_EXCLUSIONS');
    });

    it('exclusión mutua por defecto', async () => {
      const r = await ctx.call('PUT', `/group/${G}/members/${P1.id}/exclusions`, { exclusions: [P2.id] }, O.t);
      assert.equal(r.s, 200);
      assert.ok(member(r.d, P1.id).exclusions.includes(P2.id));
      assert.ok(member(r.d, P2.id).exclusions.includes(P1.id));
      assert.equal(r.d.drawPossible, true);
    });

    it('avisa y rechaza cuando el sorteo es imposible', async () => {
      const g = (await ctx.call('POST', '/group', { name: 'Imposible', exchangeDate: futureDate() }, O.t)).d;
      await ctx.call('POST', '/group/join', { inviteCode: g.inviteCode }, P1.t);
      await ctx.call('POST', '/group/join', { inviteCode: g.inviteCode }, P2.t);
      const ex = await ctx.call('PUT', `/group/${g.id}/members/${O.id}/exclusions`, { exclusions: [P1.id, P2.id], mutual: false }, O.t);
      assert.equal(ex.d.drawPossible, false);
      const draw = await ctx.call('POST', `/group/${g.id}/draw`, undefined, O.t);
      assert.equal(draw.s, 422);
      assert.equal(draw.d.code, 'NO_VALID_ASSIGNMENT');
      assert.ok(draw.d.blockedMembers.length > 0);
      await ctx.call('DELETE', `/group/${g.id}`, undefined, O.t);
    });

    it('menos de 3 participantes -> 422', async () => {
      const g = (await ctx.call('POST', '/group', { name: 'Solitos', exchangeDate: futureDate() }, O.t)).d;
      const r = await ctx.call('POST', `/group/${g.id}/draw`, undefined, O.t);
      assert.equal(r.s, 422);
      assert.equal(r.d.code, 'NOT_ENOUGH_PARTICIPANTS');
      await ctx.call('DELETE', `/group/${g.id}`, undefined, O.t);
    });
  });

  describe('Sorteo y sobres', () => {
    it('no hay sobre antes del sorteo', async () => {
      const r = await ctx.call('GET', `/group/${G}/assignment`, undefined, P1.t);
      assert.equal(r.s, 409);
      assert.equal(r.d.code, 'NOT_DRAWN_YET');
    });

    it('solo el organizador sortea, y una sola vez', async () => {
      assert.equal((await ctx.call('POST', `/group/${G}/draw`, undefined, P1.t)).s, 403);
      const r = await ctx.call('POST', `/group/${G}/draw`, undefined, O.t);
      assert.equal(r.s, 200);
      assert.equal(r.d.status, 'LOCKED');
      assert.ok(r.d.drawnAt);
      const again = await ctx.call('POST', `/group/${G}/draw`, undefined, O.t);
      assert.equal(again.s, 409);
      assert.equal(again.d.code, 'ALREADY_DRAWN');
    });

    it('tras el sorteo no se puede unir, salir ni cambiar exclusiones', async () => {
      const join = await ctx.call('POST', '/group/join', { inviteCode: code }, X.t);
      assert.equal(join.s, 409);
      assert.equal(join.d.code, 'GROUP_NOT_WAITING');
      assert.equal((await ctx.call('DELETE', `/group/${G}/members/me`, undefined, P3.t)).s, 409);
      assert.equal((await ctx.call('PUT', `/group/${G}/members/${P1.id}/exclusions`, { exclusions: [] }, O.t)).s, 409);
    });

    it('cada miembro abre su sobre: válido, respeta exclusiones y no expone emails', async () => {
      const receivers = new Set<string>();
      for (const p of [O, P1, P2, P3]) {
        const a = await ctx.call('GET', `/group/${G}/assignment`, undefined, p.t);
        assert.equal(a.s, 200);
        assert.notEqual(a.d.receiver.userId, p.id);
        assert.equal(a.d.receiver.email, undefined);
        if (p === P1) assert.notEqual(a.d.receiver.userId, P2.id);
        if (p === P2) assert.notEqual(a.d.receiver.userId, P1.id);
        receivers.add(a.d.receiver.userId);
      }
      assert.equal(receivers.size, 4);
    });

    it('privacidad: no-miembros, lista completa y detalle no revelan asignaciones', async () => {
      assert.equal((await ctx.call('GET', `/group/${G}/assignment`, undefined, X.t)).s, 404);
      assert.equal((await ctx.call('GET', `/group/${G}/assignments`, undefined, P1.t)).s, 403);
      const detail = JSON.stringify((await ctx.call('GET', `/group/${G}`, undefined, O.t)).d);
      assert.ok(!detail.includes('receiver') && !detail.includes('assigned'));
    });

    it('mis grupos muestra rol y sobre disponible', async () => {
      const joined = await ctx.call('GET', '/group?scope=joined', undefined, P1.t);
      assert.ok(joined.d.results.some((g: any) => g.id === G && g.hasAssignment && g.myRole === 'PARTICIPANT'));
      const created = await ctx.call('GET', '/group?scope=created', undefined, O.t);
      assert.ok(created.d.results.every((g: any) => g.myRole === 'CREATOR'));
      assert.equal((await ctx.call('GET', '/group', undefined, X.t)).d.total, 0);
    });

    it('deshacer el sorteo vuelve a WAITING y borra los sobres', async () => {
      const r = await ctx.call('DELETE', `/group/${G}/draw`, undefined, O.t);
      assert.equal(r.s, 200);
      assert.equal(r.d.status, 'WAITING');
      assert.equal((await ctx.call('GET', `/group/${G}/assignment`, undefined, P1.t)).s, 409);
    });

    it('revelar, listar y finalizar', async () => {
      await ctx.call('POST', `/group/${G}/draw`, undefined, O.t);
      const rev = await ctx.call('POST', `/group/${G}/reveal`, undefined, O.t);
      assert.equal(rev.d.status, 'REVEALED');
      assert.equal((await ctx.call('DELETE', `/group/${G}/draw`, undefined, O.t)).s, 409);
      const list = await ctx.call('GET', `/group/${G}/assignments`, undefined, P3.t);
      assert.equal(list.s, 200);
      assert.equal(list.d.results.length, 4);
      const done = await ctx.call('POST', `/group/${G}/complete`, undefined, O.t);
      assert.equal(done.d.status, 'COMPLETED');
      assert.equal((await ctx.call('PATCH', `/group/${G}`, { name: 'Otro nombre' }, O.t)).s, 409);
    });
  });

  describe('Administración', () => {
    it('solo administradores listan todos los grupos', async () => {
      assert.equal((await ctx.call('GET', '/group/admin', undefined, P1.t)).s, 403);
      assert.equal((await ctx.call('GET', '/group/admin?q=' + encodeURIComponent('(['), undefined, SA)).s, 200);
      const r = await ctx.call('GET', '/group/admin', undefined, SA);
      assert.equal(r.s, 200);
      assert.ok(r.d.total >= 1);
    });

    it('un admin ve y elimina grupos ajenos; un participante no', async () => {
      const g = (await ctx.call('POST', '/group', { name: 'Para borrar', exchangeDate: futureDate() }, O.t)).d;
      await ctx.call('POST', '/group/join', { inviteCode: g.inviteCode }, P1.t);
      assert.equal((await ctx.call('GET', `/group/${g.id}`, undefined, SA)).s, 200);
      assert.equal((await ctx.call('DELETE', `/group/${g.id}`, undefined, P1.t)).s, 403);
      assert.equal((await ctx.call('DELETE', `/group/${g.id}`, undefined, SA)).s, 200);
      assert.equal((await ctx.call('GET', `/group/${g.id}`, undefined, O.t)).s, 404);
    });
  });
});
