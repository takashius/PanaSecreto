import { Types } from 'mongoose';
import config from '../config/commons';
import { WEB_ACCESS_ROLES, ROLE_DESCRIPTIONS, isUserRole } from '@panasecreto/shared';
import { sendMail, sendMailBatch, type MailMessage } from './mail';
import * as tpl from './mailTemplates';
import { Group } from '../components/group/model';
import { Notification } from '../components/notification/model';
import { User } from '../components/user/model';
import { pushForNotifications, type PushSource } from './push';
import type { NotificationKind, NotificationTarget } from '@panasecreto/shared';
import '../components/user/model'; // registra User para populate

/**
 * Notificaciones por correo de EntrePanas.
 *
 * - Se disparan en segundo plano (no retrasan la respuesta HTTP) y nunca rompen el flujo que las llama.
 * - Nunca se envía a cuentas desactivadas.
 * - Ningún correo revela asignaciones del sorteo.
 * - En tests, `flushNotifications()` espera a que terminen todas las pendientes.
 */

const pending = new Set<Promise<unknown>>();

function background(task: () => Promise<unknown>, label: string): void {
  const p = task()
    .catch((error) => console.error(`[notify] Falló "${label}":`, error))
    .finally(() => pending.delete(p));
  pending.add(p);
}

/** Espera a que terminen todas las notificaciones en curso (útil en tests y al apagar el servidor) */
export async function flushNotifications(): Promise<void> {
  while (pending.size > 0) await Promise.allSettled([...pending]);
}

interface Recipient {
  id: string;
  name: string;
  lastName?: string;
  email: string;
  active?: boolean;
  /** false = el usuario apagó los correos de EntrePanas (no aplica a correos de seguridad) */
  notifyEmail?: boolean;
}

const fullName = (u: { name?: string; lastName?: string }) => [u.name, u.lastName].filter(Boolean).join(' ') || 'Pana';
const groupUrl = (id: string) => `${config.appUrl}/group/${id}`;
const joinUrl = (code: string) => `${config.appUrl}/join/${encodeURIComponent(code)}`;

function messageFor(r: Recipient, content: tpl.MailContent, customId: string): MailMessage {
  return { to: { email: r.email, name: fullName(r) }, ...content, customId };
}

interface GroupContext {
  id: string;
  inviteCode: string;
  creatorId: string;
  info: tpl.GroupMailInfo;
  members: Recipient[];
  maxParticipants: number;
}

async function loadGroupContext(groupId: string): Promise<GroupContext | null> {
  const g = await Group.findById(groupId)
    .populate('members.user', 'name lastName email active notifyEmail')
    .populate('creator', 'name lastName')
    .lean();
  if (!g) return null;
  const creator = g.creator as unknown as { _id: Types.ObjectId; name?: string; lastName?: string } | null;
  const members: Recipient[] = g.members
    .map(
      (m) =>
        m.user as unknown as {
          _id: Types.ObjectId;
          name?: string;
          lastName?: string;
          email?: string;
          active?: boolean;
          notifyEmail?: boolean;
        } | null
    )
    .filter((u): u is NonNullable<typeof u> => Boolean(u?.email))
    .map((u) => ({
      id: String(u._id),
      name: u.name ?? 'Pana',
      lastName: u.lastName,
      email: u.email!,
      active: u.active,
      notifyEmail: u.notifyEmail,
    }));
  return {
    id: String(g._id),
    inviteCode: g.inviteCode,
    creatorId: String(creator?._id ?? g.creator),
    maxParticipants: g.maxParticipants,
    members,
    info: {
      name: g.name,
      emoji: g.emoji,
      exchangeDate: g.exchangeDate,
      currency: g.currency,
      budgetMin: g.budgetMin,
      budgetMax: g.budgetMax,
      organizerName: fullName(creator ?? {}),
    },
  };
}

/* ------------------------------------------------------------------ Notificaciones en la app */

export interface InAppItem {
  userId: string;
  kind: NotificationKind;
  target: NotificationTarget;
  title: string;
  body: string;
  groupId?: string;
  wishId?: string;
  dedupeKey?: string;
}

/**
 * Inserta notificaciones ignorando duplicados por dedupeKey y envía la push de las nuevas.
 * Devuelve cuántas se crearon. Un fallo de la push nunca afecta a la campana.
 */
export async function insertInApp(items: InAppItem[], options: { push?: boolean } = {}): Promise<number> {
  return (await insertInAppDocs(items, options)).length;
}

/** Igual que insertInApp, pero devuelve las notificaciones creadas (para enviarlas aparte) */
export async function insertInAppDocs(items: InAppItem[], { push = true }: { push?: boolean } = {}): Promise<PushSource[]> {
  if (items.length === 0) return [];
  const docs = items.map((i) => ({
    user: new Types.ObjectId(i.userId),
    kind: i.kind,
    target: i.target,
    title: i.title.slice(0, 120),
    body: i.body.slice(0, 300),
    ...(i.groupId ? { group: new Types.ObjectId(i.groupId) } : {}),
    ...(i.wishId ? { wish: new Types.ObjectId(i.wishId) } : {}),
    ...(i.dedupeKey ? { dedupeKey: i.dedupeKey } : {}),
  }));
  let inserted: PushSource[];
  try {
    inserted = (await Notification.insertMany(docs, { ordered: false })) as unknown as PushSource[];
  } catch (error) {
    const e = error as { code?: number; insertedDocs?: unknown[]; writeErrors?: Array<{ code?: number; err?: { code?: number } }> };
    const onlyDuplicates =
      e.code === 11000 || (e.writeErrors?.length && e.writeErrors.every((w) => (w.code ?? w.err?.code) === 11000));
    if (!onlyDuplicates) throw error;
    inserted = (e.insertedDocs ?? []) as PushSource[];
  }
  if (push && inserted.length > 0) {
    await pushForNotifications(inserted).catch((error) => console.error('[push] Falló el envío:', error));
  }
  return inserted;
}

/** En segundo plano (no retrasa la respuesta) */
export function notifyInApp(items: InAppItem[], label = 'notificación en la app'): void {
  if (items.length === 0) return;
  background(() => insertInApp(items), label);
}

/** Puede recibir correos de grupo: cuenta activa y correos encendidos */
const reachable = (r: Recipient) => r.active !== false && r.notifyEmail !== false;
const activeOnly = (list: Recipient[]) => list.filter(reachable);

/* ------------------------------------------------------------------ Cuenta */

export function notifyWelcome(user: Recipient): void {
  background(
    () => sendMail(messageFor(user, tpl.welcomeEmail({ name: user.name, appUrl: config.appUrl }), `welcome-${user.id}`)),
    'bienvenida'
  );
}

export function notifyAccountCreated(user: Recipient, role: string): void {
  const isWebRole = isUserRole(role) && WEB_ACCESS_ROLES.includes(role);
  const roleLabel = isUserRole(role) ? ROLE_DESCRIPTIONS[role] : role;
  background(
    () =>
      sendMail(
        messageFor(
          user,
          tpl.accountCreatedEmail({
            name: user.name,
            email: user.email,
            roleLabel,
            isWebRole,
            loginUrl: isWebRole ? `${config.adminUrl}/login` : config.appUrl,
          }),
          `account-created-${user.id}`
        )
      ),
    'cuenta creada'
  );
}

export function notifyPasswordChanged(user: Recipient, reason: tpl.PasswordChangeReason): void {
  if (user.active === false) return;
  background(
    () =>
      sendMail(
        messageFor(user, tpl.passwordChangedEmail({ name: user.name, reason, when: new Date() }), `password-${user.id}`)
      ),
    'contraseña cambiada'
  );
}

/* ------------------------------------------------------------------ Grupos */

/** Invitaciones por correo: se esperan (el organizador recibe el resultado del envío). */
export async function sendGroupInvitations(params: {
  groupId: string;
  inviterName: string;
  emails: string[];
  personalMessage?: string;
}): Promise<{ sent: number; failed: number }> {
  const ctx = await loadGroupContext(params.groupId);
  if (!ctx) return { sent: 0, failed: params.emails.length };
  const content = tpl.groupInvitationEmail({
    group: ctx.info,
    inviterName: params.inviterName,
    inviteCode: ctx.inviteCode,
    joinUrl: joinUrl(ctx.inviteCode),
    personalMessage: params.personalMessage,
  });
  const result = await sendMailBatch(
    params.emails.map((email) => ({ to: { email }, ...content, customId: `invite-${ctx.id}` }))
  );
  return { sent: result.sent, failed: result.failed };
}

/** Al unirse: bienvenida al nuevo miembro + aviso al organizador */
export function notifyMemberJoined(groupId: string, memberId: string): void {
  background(async () => {
    const ctx = await loadGroupContext(groupId);
    if (!ctx) return;
    const member = ctx.members.find((m) => m.id === memberId);
    const organizer = ctx.members.find((m) => m.id === ctx.creatorId);
    const messages: MailMessage[] = [];
    if (member && reachable(member)) {
      messages.push(
        messageFor(member, tpl.joinedGroupEmail({ name: member.name, group: ctx.info, groupUrl: groupUrl(ctx.id) }), `joined-${ctx.id}`)
      );
    }
    if (organizer && member && organizer.active !== false && organizer.id !== member.id) {
      await insertInApp([
        {
          userId: organizer.id,
          kind: 'join',
          target: 'group',
          groupId: ctx.id,
          title: `${ctx.info.emoji ?? '🎁'} ${ctx.info.name}`,
          body: `${fullName(member)} se unió al grupo (${ctx.members.length}/${ctx.maxParticipants}).`,
        },
      ]);
    }
    if (organizer && member && reachable(organizer) && organizer.id !== member.id) {
      messages.push(
        messageFor(
          organizer,
          tpl.memberJoinedEmail({
            organizerName: organizer.name,
            memberName: fullName(member),
            groupName: ctx.info.name,
            memberCount: ctx.members.length,
            maxParticipants: ctx.maxParticipants,
            groupUrl: groupUrl(ctx.id),
          }),
          `member-joined-${ctx.id}`
        )
      );
    }
    await sendMailBatch(messages);
  }, 'miembro nuevo');
}

/** Sorteo realizado: a todos los miembros (sin revelar asignaciones) */
export function notifyDrawCompleted(groupId: string): void {
  background(async () => {
    const ctx = await loadGroupContext(groupId);
    if (!ctx) return;
    await insertInApp(
      ctx.members
        .filter((m) => m.active !== false)
        .map((m) => ({
          userId: m.id,
          kind: 'draw' as const,
          target: 'envelope' as const,
          groupId: ctx.id,
          title: '¡Ya se hizo el sorteo! ✉️',
          body: `Tu sobre de «${ctx.info.name}» está listo. Ábrelo pa’ ver a quién le regalas.`,
        }))
    );
    await sendMailBatch(
      activeOnly(ctx.members).map((m) =>
        messageFor(m, tpl.drawCompletedEmail({ name: m.name, group: ctx.info, groupUrl: groupUrl(ctx.id) }), `draw-${ctx.id}`)
      )
    );
  }, 'sorteo realizado');
}

/** Sorteo deshecho: avisa que la asignación anterior ya no vale */
export function notifyDrawReset(groupId: string): void {
  background(async () => {
    const ctx = await loadGroupContext(groupId);
    if (!ctx) return;
    await insertInApp(
      ctx.members
        .filter((m) => m.active !== false && m.id !== ctx.creatorId)
        .map((m) => ({
          userId: m.id,
          kind: 'draw' as const,
          target: 'group' as const,
          groupId: ctx.id,
          title: 'Se reinició el sorteo 🔄',
          body: `El organizador deshizo el sorteo de «${ctx.info.name}». Tu sobre anterior ya no vale.`,
        }))
    );
    await sendMailBatch(
      activeOnly(ctx.members)
        .filter((m) => m.id !== ctx.creatorId)
        .map((m) =>
          messageFor(
            m,
            tpl.drawResetEmail({ name: m.name, groupName: ctx.info.name, organizerName: ctx.info.organizerName, groupUrl: groupUrl(ctx.id) }),
            `draw-reset-${ctx.id}`
          )
        )
    );
  }, 'sorteo reiniciado');
}

/** Revelación: todos pueden ver quién le regaló a quién */
export function notifyRevealed(groupId: string): void {
  background(async () => {
    const ctx = await loadGroupContext(groupId);
    if (!ctx) return;
    await insertInApp(
      ctx.members
        .filter((m) => m.active !== false)
        .map((m) => ({
          userId: m.id,
          kind: 'reveal' as const,
          target: 'reveal' as const,
          groupId: ctx.id,
          title: '¡Llegó el destape! 🎉',
          body: `Ya puedes ver quién era tu pana secreto en «${ctx.info.name}».`,
        }))
    );
    await sendMailBatch(
      activeOnly(ctx.members).map((m) =>
        messageFor(m, tpl.revealedEmail({ name: m.name, groupName: ctx.info.name, groupUrl: groupUrl(ctx.id) }), `revealed-${ctx.id}`)
      )
    );
  }, 'revelación');
}

/** Expulsión: el destinatario ya no está en el grupo, así que se pasa directamente */
export function notifyRemovedFromGroup(user: Recipient, groupName: string, organizerName: string): void {
  if (!reachable(user)) return;
  background(
    () => sendMail(messageFor(user, tpl.removedFromGroupEmail({ name: user.name, groupName, organizerName }), 'removed')),
    'expulsión'
  );
}

/** Grupo eliminado: a los miembros (excepto quien lo eliminó) */
export function notifyGroupDeleted(groupName: string, recipients: Recipient[]): void {
  background(
    () =>
      sendMailBatch(
        activeOnly(recipients).map((r) => messageFor(r, tpl.groupDeletedEmail({ name: r.name, groupName }), 'group-deleted'))
      ),
    'grupo eliminado'
  );
}

/** Carga destinatarios (para flujos donde el grupo dejará de existir o el miembro ya salió) */
export async function recipientsOfGroup(groupId: string): Promise<{ members: Recipient[]; creatorId: string; info: tpl.GroupMailInfo } | null> {
  const ctx = await loadGroupContext(groupId);
  return ctx ? { members: ctx.members, creatorId: ctx.creatorId, info: ctx.info } : null;
}

/* ------------------------------------------------------------------ Comentarios y chat */

/**
 * Comentario en un deseo.
 * - El que regala comenta → avisa al dueño del deseo (sin decir quién es).
 * - El dueño responde → avisa a quien le regala.
 * Correo solo si el destinatario tiene notifyEmail y notifyComments encendidos.
 */
export function notifyWishComment(params: {
  groupId: string;
  groupName: string;
  wishId: string;
  wishTitle: string;
  recipientId: string;
  fromRole: 'owner' | 'giver';
  preview: string;
}): void {
  background(async () => {
    const toOwner = params.fromRole === 'giver';
    await insertInApp([
      {
        userId: params.recipientId,
        kind: toOwner ? 'comment' : 'reply',
        target: toOwner ? 'myWish' : 'wish',
        groupId: params.groupId,
        wishId: params.wishId,
        title: toOwner ? 'Tu pana secreto comentó 🤫' : 'Te respondieron 💬',
        body: `«${params.wishTitle}»: ${params.preview}`,
      },
    ]);
    const user = await User.findById(params.recipientId).select('name lastName email active notifyEmail notifyComments').lean();
    if (!user?.email || user.active === false || user.notifyEmail === false || user.notifyComments === false) return;
    await sendMail(
      messageFor(
        { id: String(user._id), name: user.name ?? 'Pana', lastName: user.lastName, email: user.email },
        tpl.wishCommentEmail({
          name: user.name ?? 'Pana',
          groupName: params.groupName,
          wishTitle: params.wishTitle,
          fromRole: params.fromRole,
          preview: params.preview,
          groupUrl: groupUrl(params.groupId),
        }),
        `comment-${params.groupId}`
      )
    );
  }, 'comentario en deseo');
}

/** Pista nueva en el chat: aviso en la app a los demás miembros (máx. una por hora y grupo) */
export function notifyChatClue(params: { groupId: string; groupName: string; senderId: string; alias: string; memberIds: string[] }): void {
  const hour = Math.floor(Date.now() / 3600e3);
  notifyInApp(
    params.memberIds
      .filter((id) => id !== params.senderId)
      .map((id) => ({
        userId: id,
        kind: 'chat' as const,
        target: 'chat' as const,
        groupId: params.groupId,
        title: `Pista nueva en «${params.groupName}» 🔎`,
        body: `${params.alias} soltó una pista en el chat. ¿Será pa’ ti?`,
        dedupeKey: `chat:${params.groupId}:${id}:${hour}`,
      })),
    'pista en el chat'
  );
}
