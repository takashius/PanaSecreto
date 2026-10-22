/**
 * Alias, sobre, comentarios anónimos, notificaciones en la app, revelación, chat (REST + sockets),
 * tips y recordatorios.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { io as connect, type Socket } from 'socket.io-client';
import { startTestServer, TestServer, futureDate } from './helpers';

type U = { t: string; id: string; name: string; email: string };

describe('Interacción anónima: alias, comentarios, chat y notificaciones', () => {
  let ctx: TestServer;
  let SA: string;
  let O: U, A: U, B: U, C: U, X: U;
  let G: string;
  let code: string;
  let flush: () => Promise<void>;
  let mailLog: Array<{ to: string; subject: string; text: string }>;
  const aliasToUser = new Map<string, U>();
  const receiverOf = new Map<string, U>();
  const giverOf = new Map<string, U>();
  const sockets: Socket[] = [];

  const mails = async () => {
    await flush();
    return mailLog.splice(0, mailLog.length);
  };

  before(async () => {
    ctx = await startTestServer();
    ({ flushNotifications: flush } = await import('../services/notifications'));
    ({ mailLog } = await import('../services/mail'));
    SA = await ctx.superAdminToken();
    [O, A, B, C, X] = await Promise.all(['Orga', 'Ana', 'Beto', 'Caro', 'Extra'].map((n) => ctx.register(n)));
  });
  after(async () => {
    sockets.forEach((s) => s.disconnect());
    await flush();
    await ctx.stop();
  });

  describe('Perfil y grupo', () => {
    it('perfil: apodo, género y preferencias de correo', async () => {
      const r = await ctx.call('PATCH', '/user/me', { nickname: 'La Ana', gender: 'F', notifyComments: false }, A.t);
      assert.equal(r.s, 200);
      const me = (await ctx.call('GET', '/user/me', undefined, A.t)).d;
      assert.equal(me.nickname, 'La Ana');
      assert.equal(me.gender, 'F');
      assert.equal(me.notifyComments, false);
      assert.equal(me.notifyEmail, true);
      assert.equal((await ctx.call('PATCH', '/user/me', { gender: 'X' }, A.t)).s, 400);
      await ctx.call('PATCH', '/user/me', { gender: 'M' }, B.t);
    });

    it('grupo con lugar y nota; la vista previa muestra iniciales', async () => {
      const r = await ctx.call(
        'POST',
        '/group',
        {
          name: 'Parranda',
          exchangeDate: futureDate(5),
          location: { name: 'Casa de la abuela', address: 'Mérida' },
          note: 'Traigan hallacas',
        },
        O.t
      );
      assert.equal(r.s, 201);
      G = r.d.id;
      code = r.d.inviteCode;
      assert.deepEqual(r.d.location, { name: 'Casa de la abuela', address: 'Mérida' });
      assert.equal(r.d.note, 'Traigan hallacas');
      assert.equal(r.d.myAlias, null);
      assert.equal(r.d.envelopeOpened, false);
      const preview = await ctx.call('GET', `/group/code/${code}`, undefined, A.t);
      assert.equal(preview.d.location.name, 'Casa de la abuela');
      assert.deepEqual(preview.d.members, [{ initials: 'OT', photo: null }]);
      for (const p of [A, B, C]) assert.equal((await ctx.call('POST', '/group/join', { inviteCode: code }, p.t)).s, 201);
      const upd = await ctx.call('PATCH', `/group/${G}`, { note: null }, O.t);
      assert.equal(upd.d.note, null);
    });
  });

  describe('Alias', () => {
    it('5 sugerencias al azar según el género, sin repetir las ya vistas', async () => {
      const r = await ctx.call('GET', `/group/${G}/alias/suggestions`, undefined, A.t);
      assert.equal(r.s, 200);
      assert.equal(r.d.results.length, 5);
      assert.equal(r.d.gender, 'F');
      assert.ok(r.d.results.every((s: any) => s.gender === 'F' || s.gender === 'N'));
      const seen = r.d.results.map((s: any) => s.id);
      const more = await ctx.call('GET', `/group/${G}/alias/suggestions?exclude=${seen.join(',')}`, undefined, A.t);
      assert.ok(more.d.results.every((s: any) => !seen.includes(s.id)));
      const male = await ctx.call('GET', `/group/${G}/alias/suggestions?gender=M`, undefined, A.t);
      assert.ok(male.d.results.every((s: any) => s.gender === 'M' || s.gender === 'N'));
      assert.equal((await ctx.call('GET', `/group/${G}/alias/suggestions`, undefined, X.t)).s, 404);
    });

    it('elegir alias: valida largo, palabras ofensivas y que sea único en el grupo', async () => {
      assert.equal((await ctx.call('PUT', `/group/${G}/members/me/alias`, { alias: 'yo' }, A.t)).s, 400);
      const bad = await ctx.call('PUT', `/group/${G}/members/me/alias`, { alias: 'Pana M4mague vo' }, A.t);
      assert.equal(bad.s, 400);
      assert.equal(bad.d.code, 'ALIAS_NOT_ALLOWED');
      const ok = await ctx.call('PUT', `/group/${G}/members/me/alias`, { alias: 'La Gata Flora', emoji: '🐈' }, A.t);
      assert.equal(ok.s, 200);
      assert.equal(ok.d.alias, 'La Gata Flora');
      const taken = await ctx.call('PUT', `/group/${G}/members/me/alias`, { alias: 'la gata flora' }, B.t);
      assert.equal(taken.s, 409);
      assert.equal(taken.d.code, 'ALIAS_TAKEN');
      const fromCatalog = await ctx.call('PUT', `/group/${G}/members/me/alias`, { alias: 'Pana Arepero' }, B.t);
      assert.equal(fromCatalog.d.aliasEmoji, '🫓', 'emoji del catálogo');
      const detail = (await ctx.call('GET', `/group/${G}`, undefined, A.t)).d;
      assert.equal(detail.myAlias, 'La Gata Flora');
      assert.ok(!JSON.stringify(detail.members).includes('Gata'), 'el alias no se asocia a ningún miembro');
      assert.equal(detail.members.filter((m: any) => m.hasAlias).length, 2);
    });

    it('chat antes del sorteo: sin alias no se puede escribir', async () => {
      const r = await ctx.call('POST', `/group/${G}/chat`, { text: 'Hola' }, C.t);
      assert.equal(r.s, 409);
      assert.equal(r.d.code, 'ALIAS_REQUIRED');
      const pista = await ctx.call('POST', `/group/${G}/chat`, { text: 'Pista', kind: 'pista' }, A.t);
      assert.equal(pista.d.code, 'NOT_DRAWN_YET');
      const hello = await ctx.call('POST', `/group/${G}/chat`, { text: '¡Epa, panas!' }, A.t);
      assert.equal(hello.s, 201);
      assert.equal(hello.d.alias, 'La Gata Flora');
      assert.equal(hello.d.mine, true);
      assert.equal(hello.d.userId, undefined);
    });

    it('comentarios cerrados antes del sorteo', async () => {
      const w = (await ctx.call('POST', `/group/${G}/wishlist`, { title: 'Termo', category: 'hogar', storeName: 'Traki' }, A.t)).d;
      assert.equal(w.category, 'hogar');
      assert.equal(w.storeName, 'Traki');
      const r = await ctx.call('GET', `/group/${G}/wishlist/${w.id}/comments`, undefined, A.t);
      assert.equal(r.s, 409);
      assert.equal(r.d.code, 'NOT_DRAWN_YET');
      assert.equal((await ctx.call('GET', `/group/${G}/wishlist/${w.id}/comments`, undefined, B.t)).s, 404);
    });

    it('el sorteo asigna alias a quien no eligió y luego ya no se puede cambiar', async () => {
      await ctx.call('POST', `/group/${G}/wishlist`, { title: 'Perfume' }, B.t);
      await ctx.call('POST', `/group/${G}/wishlist`, { title: 'Libro' }, C.t);
      await ctx.call('POST', `/group/${G}/wishlist`, { title: 'Café' }, O.t);
      await mails();
      assert.equal((await ctx.call('POST', `/group/${G}/draw`, undefined, O.t)).s, 200);
      for (const p of [O, A, B, C]) {
        const d = (await ctx.call('GET', `/group/${G}`, undefined, p.t)).d;
        assert.ok(d.myAlias && d.myAliasEmoji);
        aliasToUser.set(d.myAlias, p);
      }
      assert.equal(aliasToUser.size, 4);
      const locked = await ctx.call('PUT', `/group/${G}/members/me/alias`, { alias: 'Otro Alias' }, C.t);
      assert.equal(locked.d.code, 'ALIAS_LOCKED');
      for (const p of [O, A, B, C]) {
        const a = (await ctx.call('GET', `/group/${G}/assignment`, undefined, p.t)).d;
        const receiver = aliasToUser.get(a.receiver.alias)!;
        receiverOf.set(p.id, receiver);
        giverOf.set(receiver.id, p);
      }
    });
  });

  describe('Sobre', () => {
    it('abrir el sobre queda registrado (idempotente)', async () => {
      const first = await ctx.call('POST', `/group/${G}/envelope/open`, undefined, A.t);
      assert.equal(first.s, 200);
      const again = await ctx.call('POST', `/group/${G}/envelope/open`, undefined, A.t);
      assert.equal(again.d.openedAt, first.d.openedAt);
      assert.equal((await ctx.call('GET', `/group/${G}/assignment`, undefined, A.t)).d.opened, true);
      assert.equal((await ctx.call('GET', `/group/${G}`, undefined, A.t)).d.envelopeOpened, true);
      assert.equal((await ctx.call('POST', `/group/${G}/envelope/open`, undefined, X.t)).s, 404);
      const mine = (await ctx.call('GET', '/group', undefined, A.t)).d.results.find((g: any) => g.id === G);
      assert.equal(mine.envelopeOpened, true);
      assert.equal(mine.myAlias, 'La Gata Flora');
    });

    it('la revelación es secreta hasta que el organizador revele', async () => {
      const r = await ctx.call('GET', `/group/${G}/reveal`, undefined, A.t);
      assert.equal(r.s, 403);
    });
  });

  describe('Comentarios anónimos', () => {
    let wishOfA: string;

    it('solo el dueño y quien le regala ven el hilo', async () => {
      wishOfA = (await ctx.call('GET', `/group/${G}/wishlist/me`, undefined, A.t)).d.results[0].id;
      const giver = giverOf.get(A.id)!;
      const outsider = [O, B, C].find((p) => p.id !== giver.id)!;
      assert.equal((await ctx.call('GET', `/group/${G}/wishlist/${wishOfA}/comments`, undefined, giver.t)).s, 200);
      assert.equal((await ctx.call('GET', `/group/${G}/wishlist/${wishOfA}/comments`, undefined, A.t)).s, 200);
      assert.equal((await ctx.call('GET', `/group/${G}/wishlist/${wishOfA}/comments`, undefined, outsider.t)).s, 404);
      assert.equal((await ctx.call('POST', `/group/${G}/wishlist/${wishOfA}/comments`, { text: 'Hola' }, outsider.t)).s, 404);
      assert.equal((await ctx.call('GET', `/group/${G}/wishlist/${wishOfA}/comments`, undefined, X.t)).s, 404);
    });

    it('quien regala pregunta; el dueño recibe aviso sin saber quién es (y sin correo si lo apagó)', async () => {
      const giver = giverOf.get(A.id)!;
      await mails();
      const r = await ctx.call('POST', `/group/${G}/wishlist/${wishOfA}/comments`, { text: '¿De qué color lo quieres?' }, giver.t);
      assert.equal(r.s, 201);
      assert.equal(r.d.author, 'me');
      assert.equal(r.d.authorRole, 'giver');
      assert.ok(!JSON.stringify(r.d).includes(giver.id));
      const sent = await mails();
      assert.equal(sent.filter((m) => m.to === A.email).length, 0, 'Ana apagó los correos de comentarios');
      const notes = (await ctx.call('GET', '/api/notifications?unread=true', undefined, A.t)).d;
      const n = notes.results.find((x: any) => x.kind === 'comment');
      assert.ok(n);
      assert.equal(n.target, 'myWish');
      assert.equal(n.wishId, wishOfA);
      assert.ok(!JSON.stringify(n).includes(giver.name), 'no revela a quien regala');
      const mine = (await ctx.call('GET', `/group/${G}/wishlist/me`, undefined, A.t)).d.results[0];
      assert.equal(mine.commentsCount, 1);
      assert.equal(mine.unansweredCount, 1);
    });

    it('el dueño responde; quien regala recibe aviso y correo', async () => {
      const giver = giverOf.get(A.id)!;
      await mails();
      const r = await ctx.call('POST', `/group/${G}/wishlist/${wishOfA}/comments`, { text: 'Azul, porfa' }, A.t);
      assert.equal(r.s, 201);
      assert.equal(r.d.authorRole, 'owner');
      const sent = await mails();
      assert.equal(sent.filter((m) => m.to === giver.email).length, 1);
      const thread = (await ctx.call('GET', `/group/${G}/wishlist/${wishOfA}/comments`, undefined, giver.t)).d;
      assert.deepEqual(thread.results.map((c: any) => [c.author, c.authorRole]), [['me', 'giver'], ['other', 'owner']]);
      assert.equal(thread.myRole, 'giver');
      const assigned = (await ctx.call('GET', `/group/${G}/wishlist/assigned`, undefined, giver.t)).d;
      const w = assigned.results.find((x: any) => x.id === wishOfA);
      assert.equal(w.commentsCount, 2);
      assert.equal(w.unansweredCount, 1);
      assert.equal(w.userId, undefined);
      const notes = (await ctx.call('GET', '/api/notifications', undefined, giver.t)).d;
      assert.ok(notes.results.some((x: any) => x.kind === 'reply' && x.target === 'wish'));
    });

    it('al borrar el deseo se borran sus comentarios', async () => {
      const w = (await ctx.call('POST', `/group/${G}/wishlist`, { title: 'Temporal' }, A.t)).d;
      const giver = giverOf.get(A.id)!;
      await ctx.call('POST', `/group/${G}/wishlist/${w.id}/comments`, { text: '¿Talla?' }, giver.t);
      assert.equal((await ctx.call('DELETE', `/group/${G}/wishlist/${w.id}`, undefined, A.t)).s, 200);
      const { WishComment } = await import('../components/comment/model');
      assert.equal(await WishComment.countDocuments({ wish: w.id }), 0);
    });
  });

  describe('Notificaciones en la app', () => {
    it('el sorteo avisó a todos; se pueden marcar como leídas', async () => {
      const list = (await ctx.call('GET', '/api/notifications', undefined, C.t)).d;
      assert.ok(list.results.some((n: any) => n.kind === 'draw' && n.target === 'envelope'));
      const count = (await ctx.call('GET', '/api/notifications/unread-count', undefined, C.t)).d.unread;
      assert.ok(count >= 1);
      const one = list.results[0];
      const read = await ctx.call('POST', `/api/notifications/${one.id}/read`, undefined, C.t);
      assert.equal(read.d.read, true);
      assert.equal((await ctx.call('POST', `/api/notifications/${one.id}/read`, undefined, A.t)).s, 404, 'ajena');
      await ctx.call('POST', '/api/notifications/read-all', undefined, C.t);
      assert.equal((await ctx.call('GET', '/api/notifications/unread-count', undefined, C.t)).d.unread, 0);
      const orgNotes = (await ctx.call('GET', '/api/notifications', undefined, O.t)).d;
      assert.ok(orgNotes.results.some((n: any) => n.kind === 'join'));
    });

    it('recordatorios: idempotentes', async () => {
      const { runReminders } = await import('../services/reminders');
      // Día y medio después del sorteo (faltan 3,5 días): sobres sin abrir de O, B y C
      const created = await runReminders(new Date(Date.now() + 1.5 * 864e5));
      assert.ok(created >= 3, 'sobres sin abrir');
      assert.equal(await runReminders(new Date(Date.now() + 1.5 * 864e5)), 0, 'no repite');
      const later = await runReminders(new Date(Date.now() + 2.5 * 864e5));
      assert.ok(later >= 4, 'faltan 3 días para todos');
      const notes = (await ctx.call('GET', '/api/notifications', undefined, C.t)).d.results;
      assert.ok(notes.some((n: any) => n.kind === 'reminder' && /sobre/.test(n.title)));
    });
  });

  describe('Chat del grupo', () => {
    it('historial con alias; "mine" solo para mis mensajes; no leídos', async () => {
      const giverOfA = giverOf.get(A.id)!;
      const pista = await ctx.call('POST', `/group/${G}/chat`, { text: 'Alguien aquí ama el azul 💙', kind: 'pista' }, giverOfA.t);
      assert.equal(pista.s, 201);
      assert.equal(pista.d.kind, 'pista');
      const hist = (await ctx.call('GET', `/group/${G}/chat`, undefined, A.t)).d;
      assert.equal(hist.results.length, 2);
      assert.deepEqual(hist.results.map((m: any) => m.mine), [true, false]);
      assert.ok(hist.results.every((m: any) => m.userId === undefined && m.user === undefined));
      assert.equal(hist.myAlias, 'La Gata Flora');
      const chats = (await ctx.call('GET', '/api/chat', undefined, A.t)).d;
      const mine = chats.results.find((c: any) => c.groupId === G);
      assert.equal(mine.unread, 1);
      assert.equal(mine.lastMessage.kind, 'pista');
      await ctx.call('POST', `/group/${G}/chat/read`, undefined, A.t);
      assert.equal((await ctx.call('GET', '/api/chat', undefined, A.t)).d.results.find((c: any) => c.groupId === G).unread, 0);
      await flush();
      const notes = (await ctx.call('GET', '/api/notifications', undefined, A.t)).d.results;
      assert.ok(notes.some((n: any) => n.kind === 'chat'));
      assert.equal((await ctx.call('GET', `/group/${G}/chat`, undefined, X.t)).s, 404);
      const page = (await ctx.call('GET', `/group/${G}/chat?limit=1`, undefined, A.t)).d;
      assert.equal(page.results.length, 1);
      assert.equal(page.hasMore, true);
      const older = (await ctx.call('GET', `/group/${G}/chat?limit=1&before=${page.results[0].id}`, undefined, A.t)).d;
      assert.equal(older.results[0].text, '¡Epa, panas!');
    });

    it('tiempo real: chat:join, chat:send con ack y chat:message a la sala', async () => {
      const url = `http://127.0.0.1:${ctx.port}`;
      const open = (token: string) =>
        new Promise<Socket>((resolve, reject) => {
          const s = connect(url, { auth: { token }, transports: ['websocket'], reconnection: false });
          sockets.push(s);
          s.on('connect', () => resolve(s));
          s.on('connect_error', reject);
        });
      await assert.rejects(open('token-invalido'));
      const sa = await open(A.t);
      const sb = await open(B.t);
      const sx = await open(X.t);
      const joinA = await sa.emitWithAck('chat:join', { groupId: G });
      assert.equal(joinA.ok, true);
      assert.equal(joinA.myAlias, 'La Gata Flora');
      assert.equal((await sb.emitWithAck('chat:join', { groupId: G })).ok, true);
      assert.equal((await sx.emitWithAck('chat:join', { groupId: G })).ok, false, 'no miembro');

      const received = new Promise<any>((resolve) => sa.once('chat:message', resolve));
      let outsiderGot = false;
      sx.on('chat:message', () => (outsiderGot = true));
      const ack = await sb.emitWithAck('chat:send', { groupId: G, text: 'Saludos desde el socket' });
      assert.equal(ack.ok, true);
      assert.equal(ack.message.mine, true);
      const msg = await received;
      assert.equal(msg.text, 'Saludos desde el socket');
      assert.equal(msg.alias, 'Pana Arepero');
      assert.equal(msg.mine, undefined);
      assert.equal(msg.userId, undefined);

      // Un mensaje por REST también llega por socket
      const viaRest = new Promise<any>((resolve) => sb.once('chat:message', resolve));
      await ctx.call('POST', `/group/${G}/chat`, { text: 'Por REST' }, C.t);
      assert.equal((await viaRest).text, 'Por REST');
      assert.equal(outsiderGot, false);

      const invalid = await sb.emitWithAck('chat:send', { groupId: G, text: '' });
      assert.equal(invalid.code, 'VALIDATION_ERROR');
      assert.equal((await sa.emitWithAck('chat:read', { groupId: G })).ok, true);
    });
  });

  describe('Revelación y cierre', () => {
    it('El Gran Día: a quién le regalé y quién me regaló', async () => {
      await mails();
      await ctx.call('POST', `/group/${G}/reveal`, undefined, O.t);
      const r = await ctx.call('GET', `/group/${G}/reveal`, undefined, A.t);
      assert.equal(r.s, 200);
      assert.equal(r.d.giftedTo.userId, receiverOf.get(A.id)!.id);
      assert.equal(r.d.giftedBy.userId, giverOf.get(A.id)!.id);
      assert.ok(r.d.giftedBy.alias && r.d.giftedBy.name);
      await flush();
      const notes = (await ctx.call('GET', '/api/notifications', undefined, B.t)).d.results;
      assert.ok(notes.some((n: any) => n.kind === 'reveal' && n.target === 'reveal'));
      const assigned = (await ctx.call('GET', `/group/${G}/wishlist/assigned`, undefined, A.t)).d;
      assert.equal(assigned.revealed, true);
      assert.equal(assigned.receiver.userId, receiverOf.get(A.id)!.id);
    });

    it('tras revelar el chat queda de solo lectura', async () => {
      const r = await ctx.call('POST', `/group/${G}/chat`, { text: '¿Sigo?' }, A.t);
      assert.equal(r.s, 409);
      assert.equal(r.d.code, 'CHAT_READ_ONLY');
      assert.equal((await ctx.call('GET', `/group/${G}/chat`, undefined, A.t)).d.readOnly, true);
    });

    it('al eliminar el grupo se borran comentarios, chat y notificaciones', async () => {
      assert.equal((await ctx.call('DELETE', `/group/${G}`, undefined, O.t)).s, 200);
      const { WishComment } = await import('../components/comment/model');
      const { ChatMessage } = await import('../components/chat/model');
      const { Notification } = await import('../components/notification/model');
      assert.equal(await WishComment.countDocuments({ group: G }), 0);
      assert.equal(await ChatMessage.countDocuments({ group: G }), 0);
      assert.equal(await Notification.countDocuments({ group: G }), 0);
    });
  });

  describe('Catálogos administrables', () => {
    it('tips: públicos por pantalla, en orden aleatorio, y CRUD solo para administradores', async () => {
      const r = await ctx.call('GET', '/api/tips?screen=sobre.lista');
      assert.equal(r.s, 200);
      assert.ok(r.d.results.length > 0);
      assert.ok(r.d.results.every((t: any) => t.screens.includes('sobre.lista') || t.screens.includes('general')));
      const only = await ctx.call('GET', '/api/tips?screen=sobre.lista&general=false');
      assert.ok(only.d.results.every((t: any) => t.screens.includes('sobre.lista')));
      assert.equal((await ctx.call('POST', '/api/tips/admin', { text: 'Tip nuevo de prueba', screens: ['chat.sala'] }, A.t)).s, 403);
      assert.equal((await ctx.call('POST', '/api/tips/admin', { text: 'Tip', screens: [] }, SA)).s, 400);
      const created = await ctx.call('POST', '/api/tips/admin', { text: 'Tip nuevo de prueba', screens: ['chat.sala'], weight: 3 }, SA);
      assert.equal(created.s, 201);
      const off = await ctx.call('PATCH', `/api/tips/admin/${created.d.id}`, { active: false }, SA);
      assert.equal(off.d.active, false);
      const chat = await ctx.call('GET', '/api/tips?screen=chat.sala&limit=50');
      assert.ok(!chat.d.results.some((t: any) => t.id === created.d.id), 'los inactivos no salen');
      const list = await ctx.call('GET', '/api/tips/admin?screen=chat.sala', undefined, SA);
      assert.ok(list.d.results.some((t: any) => t.id === created.d.id));
      assert.ok(list.d.activePerScreen['chat.sala'] >= 1);
      assert.equal((await ctx.call('DELETE', `/api/tips/admin/${created.d.id}`, undefined, SA)).s, 200);
    });

    it('alias: catálogo de ~100 por género, CRUD y alias propios para moderar', async () => {
      const list = await ctx.call('GET', '/api/alias/admin?gender=F&limit=5', undefined, SA);
      assert.equal(list.s, 200);
      assert.equal(list.d.results.length, 5);
      for (const g of ['M', 'F', 'N']) assert.ok(list.d.byGender[g].total >= 100);
      assert.equal((await ctx.call('GET', '/api/alias/admin', undefined, A.t)).s, 403);
      const created = await ctx.call('POST', '/api/alias/admin', { text: 'Pana Prueba', gender: 'N', emoji: '🧪' }, SA);
      assert.equal(created.s, 201);
      assert.equal((await ctx.call('POST', '/api/alias/admin', { text: 'pana prueba', gender: 'N' }, SA)).s, 409);
      assert.equal((await ctx.call('PATCH', `/api/alias/admin/${created.d.id}`, { active: false }, SA)).d.active, false);
      assert.equal((await ctx.call('DELETE', `/api/alias/admin/${created.d.id}`, undefined, SA)).s, 200);

      const g2 = (await ctx.call('POST', '/group', { name: 'Otro', exchangeDate: futureDate() }, O.t)).d;
      await ctx.call('PUT', `/group/${g2.id}/members/me/alias`, { alias: 'Mi Alias Inventado' }, O.t);
      const custom = await ctx.call('GET', '/api/alias/admin/custom', undefined, SA);
      const row = custom.d.results.find((x: any) => x.alias === 'Mi Alias Inventado');
      assert.ok(row);
      assert.equal(row.user.id, O.id);
      assert.equal((await ctx.call('DELETE', `/api/alias/admin/custom/${g2.id}/${O.id}`, undefined, SA)).s, 200);
      assert.equal((await ctx.call('GET', `/group/${g2.id}`, undefined, O.t)).d.myAlias, null);
    });
  });
});
