import { Types } from 'mongoose';
import { GroupStatusEnum, type CreateCommentDTO, type WishCommentView } from '@panasecreto/shared';
import { WishComment } from './model';
import { Wish } from '../wishlist/model';
import { findGiverId, findGroupForMember, findReceiverId } from '../group/store';
import { notifyWishComment } from '../../services/notifications';
import { StoreResponse } from '../../types/general';

const fail = (status: number, code: string, message: string): StoreResponse => ({ status, message: { code, message } });
const wishNotFound = () => fail(404, 'WISH_NOT_FOUND', 'Deseo no encontrado.');
const PREVIEW_LENGTH = 90;

type Role = 'owner' | 'giver';

/**
 * Resuelve el hilo de un deseo para un usuario.
 * Solo el dueño del deseo y quien le regala pueden verlo; para cualquier otro el deseo "no existe".
 */
async function loadThread(userId: string, groupId: string, wishId: string) {
  const group = await findGroupForMember(groupId, userId);
  if (!group) return { error: fail(404, 'GROUP_NOT_FOUND', 'Grupo no encontrado.') };
  if (!Types.ObjectId.isValid(wishId)) return { error: wishNotFound() };
  const wish = await Wish.findOne({ _id: wishId, group: group._id }).select('user title').lean();
  if (!wish) return { error: wishNotFound() };
  const ownerId = String(wish.user);

  if (group.status === GroupStatusEnum.WAITING) {
    // Antes del sorteo no hay a quién preguntarle (y no se revela si el deseo es ajeno)
    if (ownerId !== userId) return { error: wishNotFound() };
    return { error: fail(409, 'NOT_DRAWN_YET', 'Los comentarios se abren después del sorteo.') };
  }

  let role: Role;
  if (ownerId === userId) role = 'owner';
  else if ((await findReceiverId(groupId, userId)) === ownerId) role = 'giver';
  else return { error: wishNotFound() };

  return { group, wish, ownerId, role };
}

const view = (c: { _id: Types.ObjectId; author: Types.ObjectId; authorRole: Role; text: string; createdAt: Date }, viewerId: string): WishCommentView => ({
  id: String(c._id),
  author: String(c.author) === viewerId ? 'me' : 'other',
  authorRole: c.authorRole,
  text: c.text,
  createdAt: c.createdAt,
});

export async function listComments(userId: string, groupId: string, wishId: string): Promise<StoreResponse> {
  try {
    const t = await loadThread(userId, groupId, wishId);
    if (t.error) return t.error;
    const comments = await WishComment.find({ wish: t.wish._id }).sort({ createdAt: 1 }).lean();
    return {
      status: 200,
      message: {
        results: comments.map((c) => view(c, userId)),
        myRole: t.role,
        canComment: t.group.status !== GroupStatusEnum.COMPLETED,
      },
    };
  } catch (error) {
    return { status: 500, message: 'Error al consultar los comentarios.', detail: error };
  }
}

export async function addComment(
  userId: string,
  groupId: string,
  wishId: string,
  dto: CreateCommentDTO
): Promise<StoreResponse> {
  try {
    const t = await loadThread(userId, groupId, wishId);
    if (t.error) return t.error;
    if (t.group.status === GroupStatusEnum.COMPLETED) {
      return fail(409, 'GROUP_COMPLETED', 'El intercambio ya finalizó; los comentarios están cerrados.');
    }
    const created = await WishComment.create({
      group: t.group._id,
      wish: t.wish._id,
      wishOwner: new Types.ObjectId(t.ownerId),
      author: new Types.ObjectId(userId),
      authorRole: t.role,
      text: dto.text,
    });

    const recipientId = t.role === 'giver' ? t.ownerId : await findGiverId(groupId, t.ownerId);
    if (recipientId && recipientId !== userId) {
      notifyWishComment({
        groupId,
        groupName: t.group.name,
        wishId: String(t.wish._id),
        wishTitle: t.wish.title,
        recipientId,
        fromRole: t.role,
        preview: dto.text.length > PREVIEW_LENGTH ? `${dto.text.slice(0, PREVIEW_LENGTH - 1)}…` : dto.text,
      });
    }
    return { status: 201, message: view(created, userId) };
  } catch (error) {
    return { status: 500, message: 'Error al publicar el comentario.', detail: error };
  }
}

/**
 * Conteos por deseo desde el punto de vista de `viewerRole`:
 * - commentsCount: total del hilo.
 * - unansweredCount: comentarios de la otra parte después de mi último comentario.
 */
export async function commentStats(
  wishIds: Types.ObjectId[],
  viewerRole: Role
): Promise<Map<string, { commentsCount: number; unansweredCount: number }>> {
  const stats = new Map<string, { commentsCount: number; unansweredCount: number }>();
  if (wishIds.length === 0) return stats;
  const comments = await WishComment.find({ wish: { $in: wishIds } })
    .select('wish authorRole createdAt')
    .sort({ createdAt: 1 })
    .lean();
  for (const c of comments) {
    const key = String(c.wish);
    const s = stats.get(key) ?? { commentsCount: 0, unansweredCount: 0 };
    s.commentsCount += 1;
    s.unansweredCount = c.authorRole === viewerRole ? 0 : s.unansweredCount + 1;
    stats.set(key, s);
  }
  return stats;
}
