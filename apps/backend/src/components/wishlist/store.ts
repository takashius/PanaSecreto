import { Types } from 'mongoose';
import { GroupStatusEnum, WISHLIST_MAX_ITEMS, type CreateWishDTO, type UpdateWishDTO } from '@panasecreto/shared';
import { Wish, IWish } from './model';
import { aliasOf, findGroupForMember, findReceiverId } from '../group/store';
import { Group } from '../group/model';
import { commentStats } from '../comment/store';
import { StoreResponse, UploadedImage } from '../../types/general';
import { deleteImage } from '../../services/storage';
import { deleteCommentsOfWishes } from '../engagement/cleanup';

const fail = (status: number, code: string, message: string): StoreResponse => ({
  status,
  message: { code, message },
});
const groupNotFound = () => fail(404, 'GROUP_NOT_FOUND', 'Grupo no encontrado.');
const wishNotFound = () => fail(404, 'WISH_NOT_FOUND', 'Deseo no encontrado.');

type WishLike = Pick<IWish, '_id' | 'group' | 'user' | 'title' | 'description' | 'estimatedPrice' | 'currency' | 'productUrl' | 'imageUrl' | 'isFavorite' | 'category' | 'storeName' | 'createdAt' | 'updatedAt'>;

type Stats = { commentsCount: number; unansweredCount: number };
const NO_STATS: Stats = { commentsCount: 0, unansweredCount: 0 };

function serialize(w: WishLike, stats?: Stats) {
  return {
    id: String(w._id),
    groupId: String(w.group),
    userId: String(w.user),
    category: w.category ?? 'otro',
    storeName: w.storeName,
    title: w.title,
    description: w.description,
    estimatedPrice: w.estimatedPrice ?? null,
    currency: w.currency,
    productUrl: w.productUrl,
    imageUrl: w.imageUrl,
    isFavorite: Boolean(w.isFavorite),
    ...(stats ? stats : {}),
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  };
}

/** Deseo visto por quien regala: sin el ID del dueño (no rompe el anonimato del alias) */
function serializeForGiver(w: WishLike, stats?: Stats) {
  const rest: Partial<ReturnType<typeof serialize>> = serialize(w, stats);
  delete rest.userId;
  return rest;
}

const listFor = (groupId: string, userId: string) =>
  Wish.find({ group: new Types.ObjectId(groupId), user: new Types.ObjectId(userId) })
    .sort({ isFavorite: -1, createdAt: 1 })
    .lean();

export async function listMine(userId: string, groupId: string): Promise<StoreResponse> {
  try {
    if (!(await findGroupForMember(groupId, userId))) return groupNotFound();
    const wishes = await listFor(groupId, userId);
    const stats = await commentStats(wishes.map((w) => w._id), 'owner');
    return {
      status: 200,
      message: {
        results: wishes.map((w) => serialize(w, stats.get(String(w._id)) ?? NO_STATS)),
        max: WISHLIST_MAX_ITEMS,
      },
    };
  } catch (error) {
    return { status: 500, message: 'Error al consultar tu lista de deseos.', detail: error };
  }
}

export async function addWish(
  userId: string,
  groupId: string,
  dto: CreateWishDTO,
  image?: UploadedImage
): Promise<StoreResponse> {
  try {
    const group = await findGroupForMember(groupId, userId);
    if (!group) return groupNotFound();
    if (group.status === GroupStatusEnum.COMPLETED) {
      return fail(409, 'GROUP_COMPLETED', 'El intercambio ya finalizó; la lista no puede modificarse.');
    }
    const count = await Wish.countDocuments({ group: group._id, user: new Types.ObjectId(userId) });
    if (count >= WISHLIST_MAX_ITEMS) {
      return fail(409, 'WISHLIST_FULL', `Puedes tener máximo ${WISHLIST_MAX_ITEMS} deseos por grupo.`);
    }
    const wish = await Wish.create({
      ...dto,
      ...(image ? { imageUrl: image.url } : {}),
      currency: dto.currency ?? group.currency,
      group: group._id,
      user: new Types.ObjectId(userId),
    });
    return { status: 201, message: serialize(wish) };
  } catch (error) {
    return { status: 500, message: 'Error al agregar el deseo.', detail: error };
  }
}

async function loadOwnWish(userId: string, groupId: string, wishId: string) {
  const group = await findGroupForMember(groupId, userId);
  if (!group) return { error: groupNotFound() };
  if (!Types.ObjectId.isValid(wishId)) return { error: wishNotFound() };
  const wish = await Wish.findOne({ _id: wishId, group: group._id });
  // Un deseo ajeno responde 404 (no se revela que existe)
  if (!wish || String(wish.user) !== userId) return { error: wishNotFound() };
  if (group.status === GroupStatusEnum.COMPLETED) {
    return { error: fail(409, 'GROUP_COMPLETED', 'El intercambio ya finalizó; la lista no puede modificarse.') };
  }
  return { wish };
}

export async function updateWish(
  userId: string,
  groupId: string,
  wishId: string,
  dto: UpdateWishDTO,
  image?: UploadedImage
): Promise<StoreResponse> {
  try {
    const { wish, error } = await loadOwnWish(userId, groupId, wishId);
    if (error) return error;
    const { removeImage, ...fields } = dto;
    const set: Record<string, unknown> = {};
    const unset: Record<string, 1> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) continue;
      if (value === null && (key === 'productUrl' || key === 'storeName')) unset[key] = 1;
      else set[key] = value;
    }
    const previousImage = wish!.imageUrl;
    if (image) set.imageUrl = image.url;
    else if (removeImage) unset.imageUrl = 1;
    const updated = await Wish.findByIdAndUpdate(
      wish!._id,
      { ...(Object.keys(set).length ? { $set: set } : {}), ...(Object.keys(unset).length ? { $unset: unset } : {}) },
      { new: true }
    );
    // La imagen anterior se borra de Cloudinary solo después de guardar el cambio
    if (previousImage && (image || removeImage)) await deleteImage(previousImage);
    return { status: 200, message: serialize(updated!) };
  } catch (error) {
    return { status: 500, message: 'Error al actualizar el deseo.', detail: error };
  }
}

export async function deleteWish(userId: string, groupId: string, wishId: string): Promise<StoreResponse> {
  try {
    const { wish, error } = await loadOwnWish(userId, groupId, wishId);
    if (error) return error;
    await Wish.deleteOne({ _id: wish!._id });
    await deleteCommentsOfWishes([wish!._id]);
    if (wish!.imageUrl) await deleteImage(wish!.imageUrl);
    return { status: 200, message: { ok: true, message: 'Deseo eliminado.' } };
  } catch (error) {
    return { status: 500, message: 'Error al eliminar el deseo.', detail: error };
  }
}

/**
 * Lista de deseos de la persona a quien le regalo (solo tras el sorteo).
 * Antes de la revelación solo viaja su alias; nombre y foto llegan al revelar.
 */
export async function listAssigned(userId: string, groupId: string): Promise<StoreResponse> {
  try {
    const group = await findGroupForMember(groupId, userId);
    if (!group) return groupNotFound();
    if (group.status === GroupStatusEnum.WAITING) {
      return fail(409, 'NOT_DRAWN_YET', 'El sorteo aún no se ha realizado.');
    }
    const receiverId = await findReceiverId(groupId, userId);
    if (!receiverId) return fail(404, 'ASSIGNMENT_NOT_FOUND', 'No tienes una asignación en este grupo.');
    const revealed = group.status === GroupStatusEnum.REVEALED || group.status === GroupStatusEnum.COMPLETED;
    const [wishes, populated] = await Promise.all([
      listFor(groupId, receiverId),
      revealed
        ? Group.findById(group._id).select('members').populate('members.user', 'name lastName photo').lean()
        : null,
    ]);
    const member = group.members.find((m) => String(m.user) === receiverId);
    const user = populated?.members.find((m) => String((m.user as unknown as { _id: unknown })?._id) === receiverId)
      ?.user as unknown as { name?: string; lastName?: string; photo?: string | null } | undefined;
    const stats = await commentStats(wishes.map((w) => w._id), 'giver');
    return {
      status: 200,
      message: {
        revealed,
        receiver: {
          ...aliasOf(member as { alias?: string; aliasEmoji?: string } | undefined),
          ...(revealed
            ? { userId: receiverId, name: user?.name ?? 'Usuario', lastName: user?.lastName, photo: user?.photo ?? null }
            : {}),
        },
        results: wishes.map((w) => serializeForGiver(w, stats.get(String(w._id)) ?? NO_STATS)),
      },
    };
  } catch (error) {
    return { status: 500, message: 'Error al consultar la lista de deseos.', detail: error };
  }
}
