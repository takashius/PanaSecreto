import { Types } from 'mongoose';
import config from '../config/commons';
import { WEB_ACCESS_ROLES, ROLE_DESCRIPTIONS, isUserRole } from '@panasecreto/shared';
import { sendMail, sendMailBatch, type MailMessage } from './mail';
import * as tpl from './mailTemplates';
import { Group } from '../components/group/model';
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
    .populate('members.user', 'name lastName email active')
    .populate('creator', 'name lastName')
    .lean();
  if (!g) return null;
  const creator = g.creator as unknown as { _id: Types.ObjectId; name?: string; lastName?: string } | null;
  const members: Recipient[] = g.members
    .map((m) => m.user as unknown as { _id: Types.ObjectId; name?: string; lastName?: string; email?: string; active?: boolean } | null)
    .filter((u): u is NonNullable<typeof u> => Boolean(u?.email))
    .map((u) => ({ id: String(u._id), name: u.name ?? 'Pana', lastName: u.lastName, email: u.email!, active: u.active }));
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

const activeOnly = (list: Recipient[]) => list.filter((r) => r.active !== false);

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
    if (member && member.active !== false) {
      messages.push(
        messageFor(member, tpl.joinedGroupEmail({ name: member.name, group: ctx.info, groupUrl: groupUrl(ctx.id) }), `joined-${ctx.id}`)
      );
    }
    if (organizer && member && organizer.active !== false && organizer.id !== member.id) {
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
    await sendMailBatch(
      activeOnly(ctx.members).map((m) =>
        messageFor(m, tpl.revealedEmail({ name: m.name, groupName: ctx.info.name, groupUrl: groupUrl(ctx.id) }), `revealed-${ctx.id}`)
      )
    );
  }, 'revelación');
}

/** Expulsión: el destinatario ya no está en el grupo, así que se pasa directamente */
export function notifyRemovedFromGroup(user: Recipient, groupName: string, organizerName: string): void {
  if (user.active === false) return;
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
