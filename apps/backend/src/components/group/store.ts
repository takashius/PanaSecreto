import { randomInt } from 'crypto';
import { Types, type FilterQuery } from 'mongoose';
import {
  GROUP_MIN_PARTICIPANTS,
  GroupStatusEnum,
  MemberRoleEnum,
  type AssignmentView,
  type CreateGroupDTO,
  type GroupStatus,
  type GroupSummary,
  type InviteByEmailDTO,
  type SetExclusionsDTO,
  type UpdateGroupDTO,
} from '@panasecreto/shared';
import { Assignment, Group, IGroup, IGroupMember } from './model';
import '../user/model'; // registra el modelo User para populate
import { deleteWishesOfGroup, deleteWishesOfMember } from '../wishlist/cleanup';
import { drawSecretFriends } from './draw';
import { StoreResponse } from '../../types/general';
import {
  notifyDrawCompleted,
  notifyDrawReset,
  notifyGroupDeleted,
  notifyMemberJoined,
  notifyRemovedFromGroup,
  notifyRevealed,
  recipientsOfGroup,
  sendGroupInvitations,
} from '../../services/notifications';

/* ==============================================================
   Utilidades
   ============================================================== */

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I para evitar confusiones
const USER_PUBLIC_FIELDS = 'name lastName photo';
const USER_CREATOR_FIELDS = 'name lastName photo email active';
const ACTIVE_DRAW_STATUSES: GroupStatus[] = [
  GroupStatusEnum.LOCKED,
  GroupStatusEnum.REVEALED,
  GroupStatusEnum.COMPLETED,
];

function fail(status: number, code: string, message: string, extra: Record<string, unknown> = {}): StoreResponse {
  return { status, message: { code, message, ...extra } };
}

const notFound = () => fail(404, 'GROUP_NOT_FOUND', 'Grupo no encontrado.');
const notCreator = () =>
  fail(403, 'NOT_GROUP_CREATOR', 'Solo el organizador del grupo puede realizar esta acción.');
const notWaiting = () =>
  fail(409, 'GROUP_NOT_WAITING', 'Esta acción solo está disponible antes del sorteo.');
const concurrentChange = () =>
  fail(409, 'CONCURRENT_CHANGE', 'El grupo cambió mientras se procesaba la solicitud. Intenta de nuevo.');

function randomChars(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) out += INVITE_ALPHABET[randomInt(0, INVITE_ALPHABET.length)];
  return out;
}

/** Formato: PANA-XXXX-XX (≈ 1.000 millones de combinaciones) */
export function generateInviteCode(): string {
  return `PANA-${randomChars(4)}-${randomChars(2)}`;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const isValidId = (id: string) => Types.ObjectId.isValid(id) && String(new Types.ObjectId(id)) === id;

/** Usuario poblado (populate) con los campos públicos */
interface PopulatedUser {
  _id: Types.ObjectId;
  name?: string;
  lastName?: string;
  photo?: string | null;
  email?: string;
  active?: boolean;
}

type IdLike = Types.ObjectId | string | { _id: Types.ObjectId | string } | null | undefined;

const idOf = (value: IdLike | unknown): string => {
  const v = value as { _id?: unknown } | null | undefined;
  return String(v && typeof v === 'object' && '_id' in v ? v._id : value);
};

const asUser = (value: unknown) => (value && typeof value === 'object' ? (value as PopulatedUser) : undefined);

function findMember(group: IGroup, userId: string) {
  return group.members.find((m) => idOf(m.user) === userId);
}

const isCreator = (group: IGroup, userId: string) => idOf(group.creator) === userId;

function displayName(value: unknown): string {
  const user = asUser(value);
  if (!user) return 'Usuario';
  return [user.name, user.lastName].filter(Boolean).join(' ');
}

function plainMembers(group: IGroup): IGroupMember[] {
  return group.members.map((m) => ({
    user: new Types.ObjectId(idOf(m.user)),
    role: m.role,
    joinedAt: m.joinedAt,
    exclusions: (m.exclusions || []).map((e) => new Types.ObjectId(idOf(e))),
  }));
}

function exclusionMap(members: IGroupMember[]): Map<string, Set<string>> {
  return new Map(members.map((m) => [idOf(m.user), new Set(m.exclusions.map((e) => idOf(e)))]));
}

/**
 * Serializa el grupo para un espectador.
 * Email y exclusiones solo se exponen al organizador (o a un administrador).
 */
function serializeGroup(group: IGroup, viewerId: string, privileged = false) {
  const creatorView = privileged || isCreator(group, viewerId);
  const me = findMember(group, viewerId);
  return {
    id: idOf(group._id),
    name: group.name,
    description: group.description,
    emoji: group.emoji,
    creatorId: idOf(group.creator),
    creatorName: displayName(group.creator),
    status: group.status,
    exchangeDate: group.exchangeDate,
    currency: group.currency,
    budgetMin: group.budgetMin ?? null,
    budgetMax: group.budgetMax ?? null,
    maxParticipants: group.maxParticipants,
    anonymousClues: group.anonymousClues,
    inviteCode: group.inviteCode,
    memberCount: group.members.length,
    myRole: me?.role ?? null,
    isCreator: isCreator(group, viewerId),
    drawnAt: group.drawnAt,
    revealedAt: group.revealedAt,
    completedAt: group.completedAt,
    members: group.members.map((m) => {
      const u = asUser(m.user);
      return {
        userId: idOf(u),
        name: u?.name ?? 'Usuario',
        lastName: u?.lastName,
        photo: u?.photo ?? null,
        role: m.role,
        joinedAt: m.joinedAt,
        ...(creatorView
          ? { email: u?.email, exclusions: (m.exclusions || []).map((e) => idOf(e)) }
          : {}),
      };
    }),
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}

async function loadGroup(id: string, privilegedFields = false): Promise<IGroup | null> {
  if (!isValidId(id)) return null;
  return Group.findById(id)
    .populate('members.user', privilegedFields ? USER_CREATOR_FIELDS : USER_PUBLIC_FIELDS)
    .populate('creator', 'name lastName');
}

/** Carga el grupo exigiendo que el actor sea su organizador. */
async function loadAsCreator(actorId: string, id: string): Promise<{ group?: IGroup; error?: StoreResponse }> {
  const group = await loadGroup(id, true);
  if (!group || !findMember(group, actorId)) return { error: notFound() };
  if (!isCreator(group, actorId)) return { error: notCreator() };
  return { group };
}

async function respondWithGroup(id: string, viewerId: string, status = 200): Promise<StoreResponse> {
  const fresh = await loadGroup(id, true);
  if (!fresh) return notFound();
  return { status, message: serializeGroup(fresh, viewerId) };
}

/* ==============================================================
   CRUD
   ============================================================== */

export async function createGroup(userId: string, dto: CreateGroupDTO): Promise<StoreResponse> {
  try {
    if (dto.exchangeDate.getTime() <= Date.now()) {
      return fail(400, 'VALIDATION_ERROR', 'La fecha del intercambio debe ser futura.');
    }

    const creator = new Types.ObjectId(userId);
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const group = await Group.create({
          name: dto.name,
          description: dto.description,
          emoji: dto.emoji,
          creator,
          exchangeDate: dto.exchangeDate,
          currency: dto.currency,
          budgetMin: dto.budgetMin ?? null,
          budgetMax: dto.budgetMax ?? null,
          maxParticipants: dto.maxParticipants,
          anonymousClues: dto.anonymousClues,
          inviteCode: generateInviteCode(),
          members: [{ user: creator, role: MemberRoleEnum.CREATOR, joinedAt: new Date(), exclusions: [] }],
        });
        return respondWithGroup(idOf(group._id), userId, 201);
      } catch (error) {
        const e = error as { code?: number; keyPattern?: Record<string, unknown> };
        const dupInviteCode = e?.code === 11000 && e?.keyPattern?.inviteCode;
        if (!dupInviteCode) throw error;
      }
    }
    return { status: 500, message: 'No se pudo generar un código de invitación único.' };
  } catch (error) {
    return { status: 500, message: 'Error al crear el grupo.', detail: error };
  }
}

export async function listMyGroups(
  userId: string,
  scope: 'all' | 'created' | 'joined' = 'all'
): Promise<StoreResponse> {
  try {
    const uid = new Types.ObjectId(userId);
    const query: FilterQuery<IGroup> = { 'members.user': uid };
    if (scope === 'created') query.creator = uid;
    if (scope === 'joined') query.creator = { $ne: uid };

    const groups = await Group.find(query)
      .sort({ exchangeDate: 1 })
      .populate('creator', 'name lastName')
      .lean();

    const assigned = await Assignment.find({ giver: uid, group: { $in: groups.map((g) => g._id) } })
      .select('group')
      .lean();
    const assignedSet = new Set(assigned.map((a) => idOf(a.group)));

    const results: GroupSummary[] = groups.map((g) => {
      const me = g.members.find((m) => idOf(m.user) === userId);
      return {
        id: idOf(g._id),
        name: g.name,
        emoji: g.emoji,
        status: g.status,
        exchangeDate: g.exchangeDate,
        currency: g.currency,
        budgetMin: g.budgetMin ?? null,
        budgetMax: g.budgetMax ?? null,
        maxParticipants: g.maxParticipants,
        memberCount: g.members.length,
        myRole: me?.role ?? MemberRoleEnum.PARTICIPANT,
        creatorName: displayName(g.creator),
        hasAssignment: assignedSet.has(idOf(g._id)),
      };
    });

    return { status: 200, message: { results, total: results.length } };
  } catch (error) {
    return { status: 500, message: 'Error al listar tus grupos.', detail: error };
  }
}

export async function getGroup(viewerId: string, id: string, viewerIsAdmin = false): Promise<StoreResponse> {
  try {
    const group = await loadGroup(id, true);
    // 404 también para no-miembros: no revela que el grupo existe
    if (!group || (!findMember(group, viewerId) && !viewerIsAdmin)) return notFound();
    return { status: 200, message: serializeGroup(group, viewerId, viewerIsAdmin) };
  } catch (error) {
    return { status: 500, message: 'Error al consultar el grupo.', detail: error };
  }
}

export async function updateGroup(actorId: string, id: string, dto: UpdateGroupDTO): Promise<StoreResponse> {
  try {
    const { group, error } = await loadAsCreator(actorId, id);
    if (error) return error;

    if (group!.status === GroupStatusEnum.COMPLETED) {
      return fail(409, 'GROUP_COMPLETED', 'El grupo ya finalizó y no puede editarse.');
    }

    const touchesRules =
      dto.currency !== undefined ||
      dto.budgetMin !== undefined ||
      dto.budgetMax !== undefined ||
      dto.maxParticipants !== undefined;
    if (touchesRules && group!.status !== GroupStatusEnum.WAITING) {
      return fail(409, 'GROUP_NOT_WAITING', 'El presupuesto, la moneda y el cupo solo se cambian antes del sorteo.');
    }

    if (dto.exchangeDate && dto.exchangeDate.getTime() <= Date.now()) {
      return fail(400, 'VALIDATION_ERROR', 'La fecha del intercambio debe ser futura.');
    }

    const nextMin = dto.budgetMin !== undefined ? dto.budgetMin : group!.budgetMin;
    const nextMax = dto.budgetMax !== undefined ? dto.budgetMax : group!.budgetMax;
    if (nextMin != null && nextMax != null && nextMin > nextMax) {
      return fail(400, 'VALIDATION_ERROR', 'El presupuesto mínimo no puede ser mayor que el máximo.');
    }

    if (dto.maxParticipants !== undefined && dto.maxParticipants < group!.members.length) {
      return fail(
        409,
        'MAX_BELOW_MEMBERS',
        `El grupo ya tiene ${group!.members.length} miembros; el cupo no puede ser menor.`
      );
    }

    const set: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) set[key] = value;
    }

    const filter: FilterQuery<IGroup> = { _id: group!._id, status: group!.status };
    if (dto.maxParticipants !== undefined) {
      filter.$expr = { $lte: [{ $size: '$members' }, dto.maxParticipants] };
    }
    const result = await Group.updateOne(filter, { $set: set });
    if (result.matchedCount === 0) return concurrentChange();

    return respondWithGroup(id, actorId);
  } catch (error) {
    return { status: 500, message: 'Error al actualizar el grupo.', detail: error };
  }
}

export async function deleteGroup(actorId: string, id: string, actorIsAdmin = false): Promise<StoreResponse> {
  try {
    const group = await loadGroup(id);
    if (!group || (!findMember(group, actorId) && !actorIsAdmin)) return notFound();
    if (!isCreator(group, actorId) && !actorIsAdmin) return notCreator();

    // Destinatarios antes de borrar (después ya no existe el grupo)
    const audience = await recipientsOfGroup(idOf(group._id));
    await Assignment.deleteMany({ group: group._id });
    await deleteWishesOfGroup(group._id);
    await Group.deleteOne({ _id: group._id });
    if (audience) notifyGroupDeleted(group.name, audience.members.filter((m) => m.id !== actorId));
    return { status: 200, message: { ok: true, message: 'Grupo eliminado.' } };
  } catch (error) {
    return { status: 500, message: 'Error al eliminar el grupo.', detail: error };
  }
}

/* ==============================================================
   Invitaciones y membresía
   ============================================================== */

export async function previewByCode(userId: string, inviteCode: string): Promise<StoreResponse> {
  try {
    const group = await Group.findOne({ inviteCode }).populate('creator', 'name lastName');
    if (!group) return fail(404, 'INVALID_INVITE_CODE', 'No existe un grupo con ese código.');
    return {
      status: 200,
      message: {
        id: idOf(group._id),
        name: group.name,
        emoji: group.emoji,
        creatorName: displayName(group.creator),
        status: group.status,
        exchangeDate: group.exchangeDate,
        currency: group.currency,
        budgetMin: group.budgetMin ?? null,
        budgetMax: group.budgetMax ?? null,
        memberCount: group.members.length,
        maxParticipants: group.maxParticipants,
        alreadyMember: Boolean(findMember(group, userId)),
        canJoin:
          group.status === GroupStatusEnum.WAITING && group.members.length < group.maxParticipants,
      },
    };
  } catch (error) {
    return { status: 500, message: 'Error al consultar el código.', detail: error };
  }
}

export async function joinGroup(userId: string, inviteCode: string): Promise<StoreResponse> {
  try {
    const uid = new Types.ObjectId(userId);
    const updated = await Group.findOneAndUpdate(
      {
        inviteCode,
        status: GroupStatusEnum.WAITING,
        'members.user': { $ne: uid },
        $expr: { $lt: [{ $size: '$members' }, '$maxParticipants'] },
      },
      {
        $push: {
          members: { user: uid, role: MemberRoleEnum.PARTICIPANT, joinedAt: new Date(), exclusions: [] },
        },
        $inc: { membersVersion: 1 },
      },
      { new: true }
    );
    if (updated) {
      notifyMemberJoined(idOf(updated._id), userId);
      return respondWithGroup(idOf(updated._id), userId, 201);
    }

    // Determinar por qué no se pudo unir
    const group = await Group.findOne({ inviteCode });
    if (!group) return fail(404, 'INVALID_INVITE_CODE', 'No existe un grupo con ese código.');
    if (findMember(group, userId)) return respondWithGroup(idOf(group._id), userId, 200);
    if (group.status !== GroupStatusEnum.WAITING) {
      return fail(409, 'GROUP_NOT_WAITING', 'El sorteo de este grupo ya se realizó; no admite nuevos miembros.');
    }
    return fail(409, 'GROUP_FULL', 'El grupo alcanzó su cupo máximo de participantes.');
  } catch (error) {
    return { status: 500, message: 'Error al unirse al grupo.', detail: error };
  }
}

/** Quita un miembro y limpia las referencias a él en las exclusiones de los demás. */
async function removeMemberInternal(group: IGroup, targetId: string): Promise<boolean> {
  const members = plainMembers(group)
    .filter((m) => idOf(m.user) !== targetId)
    .map((m) => ({ ...m, exclusions: m.exclusions.filter((e) => idOf(e) !== targetId) }));
  const result = await Group.updateOne(
    { _id: group._id, status: GroupStatusEnum.WAITING, membersVersion: group.membersVersion },
    { $set: { members }, $inc: { membersVersion: 1 } }
  );
  if (result.matchedCount === 1) {
    // Su lista de deseos ya no tiene sentido en el grupo
    await deleteWishesOfMember(group._id, targetId);
  }
  return result.matchedCount === 1;
}

export async function leaveGroup(userId: string, id: string): Promise<StoreResponse> {
  try {
    const group = await loadGroup(id);
    if (!group || !findMember(group, userId)) return notFound();
    if (isCreator(group, userId)) {
      return fail(
        409,
        'CREATOR_CANNOT_LEAVE',
        'El organizador no puede salir del grupo. Puedes eliminarlo si ya no se hará el intercambio.'
      );
    }
    if (group.status !== GroupStatusEnum.WAITING) return notWaiting();
    if (!(await removeMemberInternal(group, userId))) return concurrentChange();
    return { status: 200, message: { ok: true, message: 'Saliste del grupo.' } };
  } catch (error) {
    return { status: 500, message: 'Error al salir del grupo.', detail: error };
  }
}

export async function removeMember(actorId: string, id: string, targetId: string): Promise<StoreResponse> {
  try {
    const { group, error } = await loadAsCreator(actorId, id);
    if (error) return error;
    if (targetId === actorId) return fail(400, 'CANNOT_REMOVE_SELF', 'No puedes expulsarte a ti mismo.');
    if (!findMember(group!, targetId)) return fail(404, 'MEMBER_NOT_FOUND', 'Ese usuario no es miembro del grupo.');
    if (group!.status !== GroupStatusEnum.WAITING) return notWaiting();
    const target = asUser(findMember(group!, targetId)!.user);
    if (!(await removeMemberInternal(group!, targetId))) return concurrentChange();
    if (target?.email) {
      notifyRemovedFromGroup(
        { id: targetId, name: target.name ?? 'Pana', lastName: target.lastName, email: target.email, active: target.active },
        group!.name,
        displayName(group!.creator)
      );
    }
    return respondWithGroup(id, actorId);
  } catch (error) {
    return { status: 500, message: 'Error al expulsar al miembro.', detail: error };
  }
}

export async function setExclusions(
  actorId: string,
  id: string,
  targetId: string,
  dto: SetExclusionsDTO
): Promise<StoreResponse> {
  try {
    const { group, error } = await loadAsCreator(actorId, id);
    if (error) return error;
    if (group!.status !== GroupStatusEnum.WAITING) return notWaiting();
    if (!findMember(group!, targetId)) return fail(404, 'MEMBER_NOT_FOUND', 'Ese usuario no es miembro del grupo.');

    const memberIds = new Set(group!.members.map((m) => idOf(m.user)));
    const requested = Array.from(new Set(dto.exclusions));
    const invalid = requested.filter((e) => e === targetId || !memberIds.has(e));
    if (invalid.length > 0) {
      return fail(400, 'INVALID_EXCLUSIONS', 'Las exclusiones deben ser otros miembros del grupo.', { invalid });
    }

    const members = plainMembers(group!);
    const target = members.find((m) => idOf(m.user) === targetId)!;
    const previous = new Set(target.exclusions.map((e) => idOf(e)));
    const next = new Set(requested);
    target.exclusions = requested.map((e) => new Types.ObjectId(e));

    if (dto.mutual) {
      for (const m of members) {
        const mid = idOf(m.user);
        if (mid === targetId) continue;
        const has = m.exclusions.some((e) => idOf(e) === targetId);
        if (next.has(mid) && !has) m.exclusions.push(new Types.ObjectId(targetId));
        if (!next.has(mid) && previous.has(mid) && has) {
          m.exclusions = m.exclusions.filter((e) => idOf(e) !== targetId);
        }
      }
    }

    const result = await Group.updateOne(
      { _id: group!._id, status: GroupStatusEnum.WAITING, membersVersion: group!.membersVersion },
      { $set: { members }, $inc: { membersVersion: 1 } }
    );
    if (result.matchedCount === 0) return concurrentChange();

    // Avisa si con estas exclusiones el sorteo ya no es posible
    const feasibility = drawSecretFriends(
      members.map((m) => idOf(m.user)),
      exclusionMap(members),
      GROUP_MIN_PARTICIPANTS
    );
    const response = await respondWithGroup(id, actorId);
    if (response.status === 200) {
      response.message = {
        ...(response.message as Record<string, unknown>),
        drawPossible: feasibility.ok || feasibility.reason === 'NOT_ENOUGH_PARTICIPANTS',
      };
    }
    return response;
  } catch (error) {
    return { status: 500, message: 'Error al guardar las exclusiones.', detail: error };
  }
}

export async function regenerateInviteCode(actorId: string, id: string): Promise<StoreResponse> {
  try {
    const { group, error } = await loadAsCreator(actorId, id);
    if (error) return error;
    if (group!.status !== GroupStatusEnum.WAITING) return notWaiting();
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await Group.updateOne({ _id: group!._id }, { $set: { inviteCode: generateInviteCode() } });
        return respondWithGroup(id, actorId);
      } catch (err) {
        if ((err as { code?: number })?.code !== 11000) throw err;
      }
    }
    return { status: 500, message: 'No se pudo generar un código de invitación único.' };
  } catch (error) {
    return { status: 500, message: 'Error al regenerar el código.', detail: error };
  }
}

/** Invita por correo a una lista de personas (solo el organizador, antes del sorteo y con cupo). */
export async function inviteByEmail(actorId: string, id: string, dto: InviteByEmailDTO): Promise<StoreResponse> {
  try {
    const { group, error } = await loadAsCreator(actorId, id);
    if (error) return error;
    if (group!.status !== GroupStatusEnum.WAITING) return notWaiting();
    if (group!.members.length >= group!.maxParticipants) {
      return fail(409, 'GROUP_FULL', 'El grupo alcanzó su cupo máximo; no tiene sentido invitar a más personas.');
    }

    const memberEmails = new Set(
      group!.members.map((m) => asUser(m.user)?.email?.toLowerCase()).filter((x): x is string => Boolean(x))
    );
    const unique = Array.from(new Set(dto.emails));
    const alreadyMembers = unique.filter((em) => memberEmails.has(em));
    const toInvite = unique.filter((em) => !memberEmails.has(em));
    if (toInvite.length === 0) {
      return fail(400, 'NOTHING_TO_SEND', 'Todas esas personas ya son miembros del grupo.', { alreadyMembers });
    }

    const result = await sendGroupInvitations({
      groupId: idOf(group!._id),
      inviterName: displayName(group!.creator),
      emails: toInvite,
      personalMessage: dto.message,
    });
    return {
      status: 200,
      message: { sent: result.sent, failed: result.failed, invited: toInvite, alreadyMembers },
    };
  } catch (error) {
    return { status: 500, message: 'Error al enviar las invitaciones.', detail: error };
  }
}

/* ==============================================================
   Sorteo y ciclo de vida
   ============================================================== */

export async function drawGroup(actorId: string, id: string): Promise<StoreResponse> {
  try {
    const { group, error } = await loadAsCreator(actorId, id);
    if (error) return error;
    if (group!.status !== GroupStatusEnum.WAITING) {
      return fail(409, 'ALREADY_DRAWN', 'El sorteo de este grupo ya se realizó.');
    }

    const members = plainMembers(group!);
    const result = drawSecretFriends(
      members.map((m) => idOf(m.user)),
      exclusionMap(members),
      GROUP_MIN_PARTICIPANTS
    );

    if (!result.ok) {
      if (result.reason === 'NOT_ENOUGH_PARTICIPANTS') {
        return fail(
          422,
          'NOT_ENOUGH_PARTICIPANTS',
          `Se necesitan al menos ${GROUP_MIN_PARTICIPANTS} participantes para sortear.`
        );
      }
      const names = (result.blocked || []).map((uid) => {
        const m = group!.members.find((mm) => idOf(mm.user) === uid);
        return displayName(m?.user);
      });
      return fail(
        422,
        'NO_VALID_ASSIGNMENT',
        'Con las exclusiones actuales no existe un sorteo posible. Revisa las exclusiones.',
        { blockedMembers: names }
      );
    }

    // Bloquea el grupo solo si nadie lo modificó mientras se calculaba
    const locked = await Group.findOneAndUpdate(
      { _id: group!._id, status: GroupStatusEnum.WAITING, membersVersion: group!.membersVersion },
      { $set: { status: GroupStatusEnum.LOCKED, drawnAt: new Date() } },
      { new: true }
    );
    if (!locked) return concurrentChange();

    try {
      await Assignment.deleteMany({ group: group!._id });
      await Assignment.insertMany(
        result.pairs.map((p) => ({
          group: group!._id,
          giver: new Types.ObjectId(p.giver),
          receiver: new Types.ObjectId(p.receiver),
        }))
      );
    } catch (insertError) {
      // Revierte para no dejar un grupo bloqueado sin asignaciones
      await Assignment.deleteMany({ group: group!._id });
      await Group.updateOne({ _id: group!._id }, { $set: { status: GroupStatusEnum.WAITING }, $unset: { drawnAt: 1 } });
      throw insertError;
    }

    notifyDrawCompleted(id);
    return respondWithGroup(id, actorId);
  } catch (error) {
    return { status: 500, message: 'Error al realizar el sorteo.', detail: error };
  }
}

export async function resetDraw(actorId: string, id: string): Promise<StoreResponse> {
  try {
    const { group, error } = await loadAsCreator(actorId, id);
    if (error) return error;
    if (group!.status !== GroupStatusEnum.LOCKED) {
      return fail(409, 'INVALID_STATUS', 'Solo se puede deshacer un sorteo que aún no se ha revelado.');
    }
    const result = await Group.updateOne(
      { _id: group!._id, status: GroupStatusEnum.LOCKED },
      { $set: { status: GroupStatusEnum.WAITING }, $unset: { drawnAt: 1 }, $inc: { membersVersion: 1 } }
    );
    if (result.matchedCount === 0) return concurrentChange();
    await Assignment.deleteMany({ group: group!._id });
    notifyDrawReset(id);
    return respondWithGroup(id, actorId);
  } catch (error) {
    return { status: 500, message: 'Error al deshacer el sorteo.', detail: error };
  }
}

async function transition(
  actorId: string,
  id: string,
  from: GroupStatus[],
  to: GroupStatus,
  stampField: 'revealedAt' | 'completedAt',
  errorMessage: string
): Promise<StoreResponse> {
  const { group, error } = await loadAsCreator(actorId, id);
  if (error) return error;
  if (!from.includes(group!.status)) return fail(409, 'INVALID_STATUS', errorMessage);
  const result = await Group.updateOne(
    { _id: group!._id, status: { $in: from } },
    { $set: { status: to, [stampField]: new Date() } }
  );
  if (result.matchedCount === 0) return concurrentChange();
  return respondWithGroup(id, actorId);
}

export async function revealGroup(actorId: string, id: string): Promise<StoreResponse> {
  try {
    const result = await transition(
      actorId,
      id,
      [GroupStatusEnum.LOCKED],
      GroupStatusEnum.REVEALED,
      'revealedAt',
      'Solo se puede revelar un grupo ya sorteado.'
    );
    if (result.status === 200) notifyRevealed(id);
    return result;
  } catch (error) {
    return { status: 500, message: 'Error al revelar el sorteo.', detail: error };
  }
}

export async function completeGroup(actorId: string, id: string): Promise<StoreResponse> {
  try {
    return await transition(
      actorId,
      id,
      [GroupStatusEnum.LOCKED, GroupStatusEnum.REVEALED],
      GroupStatusEnum.COMPLETED,
      'completedAt',
      'Solo se puede finalizar un grupo ya sorteado.'
    );
  } catch (error) {
    return { status: 500, message: 'Error al finalizar el grupo.', detail: error };
  }
}

/** "Abrir el sobre": a quién le regala el usuario. */
export async function getMyAssignment(userId: string, id: string): Promise<StoreResponse> {
  try {
    const group = await loadGroup(id);
    if (!group || !findMember(group, userId)) return notFound();
    if (!ACTIVE_DRAW_STATUSES.includes(group.status)) {
      return fail(409, 'NOT_DRAWN_YET', 'El sorteo aún no se ha realizado.');
    }
    const assignment = await Assignment.findOne({ group: group._id, giver: new Types.ObjectId(userId) })
      .populate('receiver', USER_PUBLIC_FIELDS)
      .lean();
    if (!assignment) return fail(404, 'ASSIGNMENT_NOT_FOUND', 'No tienes una asignación en este grupo.');

    const receiver = asUser(assignment.receiver);
    const view: AssignmentView = {
      groupId: idOf(group._id),
      receiver: {
        userId: idOf(receiver),
        name: receiver?.name ?? 'Usuario',
        lastName: receiver?.lastName,
        photo: receiver?.photo ?? null,
      },
    };
    return { status: 200, message: view };
  } catch (error) {
    return { status: 500, message: 'Error al consultar tu asignación.', detail: error };
  }
}

/** Lista completa de quién le regaló a quién: solo tras revelar. */
export async function listAssignments(userId: string, id: string): Promise<StoreResponse> {
  try {
    const group = await loadGroup(id);
    if (!group || !findMember(group, userId)) return notFound();
    if (group.status !== GroupStatusEnum.REVEALED && group.status !== GroupStatusEnum.COMPLETED) {
      return fail(403, 'NOT_REVEALED', 'Las asignaciones son secretas hasta que el organizador las revele.');
    }
    const assignments = await Assignment.find({ group: group._id })
      .populate('giver', USER_PUBLIC_FIELDS)
      .populate('receiver', USER_PUBLIC_FIELDS)
      .lean();
    const person = (value: unknown) => {
      const u = asUser(value);
      return { userId: idOf(value), name: u?.name ?? 'Usuario', lastName: u?.lastName, photo: u?.photo ?? null };
    };
    return {
      status: 200,
      message: { results: assignments.map((a) => ({ giver: person(a.giver), receiver: person(a.receiver) })) },
    };
  } catch (error) {
    return { status: 500, message: 'Error al consultar las asignaciones.', detail: error };
  }
}

/* ==============================================================
   Administración (panel web)
   ============================================================== */

export async function adminListGroups(filters: {
  q?: unknown;
  status?: unknown;
  page?: unknown;
  limit?: unknown;
}): Promise<StoreResponse> {
  try {
    const query: FilterQuery<IGroup> = {};
    if (typeof filters.status === 'string' && (Object.values(GroupStatusEnum) as string[]).includes(filters.status)) {
      query.status = filters.status;
    }
    if (typeof filters.q === 'string' && filters.q.trim()) {
      const regex = new RegExp(escapeRegex(filters.q.trim().slice(0, 100)), 'i');
      query.$or = [{ name: regex }, { inviteCode: regex }];
    }
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 20));

    const [groups, total] = await Promise.all([
      Group.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('creator', 'name lastName email')
        .lean(),
      Group.countDocuments(query),
    ]);

    const results = groups.map((g) => ({
      id: idOf(g._id),
      name: g.name,
      emoji: g.emoji,
      status: g.status,
      inviteCode: g.inviteCode,
      exchangeDate: g.exchangeDate,
      currency: g.currency,
      budgetMin: g.budgetMin ?? null,
      budgetMax: g.budgetMax ?? null,
      maxParticipants: g.maxParticipants,
      memberCount: g.members.length,
      creator: { id: idOf(g.creator), name: displayName(g.creator), email: asUser(g.creator)?.email },
      createdAt: g.createdAt,
    }));

    return { status: 200, message: { results, total, page, limit, totalPages: Math.ceil(total / limit) || 1 } };
  } catch (error) {
    return { status: 500, message: 'Error al listar grupos.', detail: error };
  }
}

/* ==============================================================
   Utilidades para otros módulos (wishlist, chat)
   ============================================================== */

/** Devuelve el grupo (lean) si el usuario es miembro; null si no existe o no pertenece. */
export async function findGroupForMember(groupId: string, userId: string) {
  if (!isValidId(groupId) || !Types.ObjectId.isValid(userId)) return null;
  return Group.findOne({ _id: groupId, 'members.user': new Types.ObjectId(userId) })
    .select('status currency members.user')
    .lean();
}

/** ID del usuario al que le regala `userId` en el grupo, o null si no hay sorteo. */
export async function findReceiverId(groupId: string, userId: string): Promise<string | null> {
  const a = await Assignment.findOne({ group: new Types.ObjectId(groupId), giver: new Types.ObjectId(userId) })
    .select('receiver')
    .lean();
  return a ? idOf(a.receiver) : null;
}
