import { Types } from 'mongoose';
import { GroupStatusEnum, WISHLIST_MAX_ITEMS, type CreateWishDTO, type UpdateWishDTO } from '@panasecreto/shared';
import { Wish, IWish } from './model';
import { findGroupForMember, findReceiverId } from '../group/store';
import { User } from '../user/model';
import { StoreResponse, UploadedImage } from '../../types/general';
import { deleteImage } from '../../services/storage';

const fail = (status: number, code: string, message: string): StoreResponse => ({
  status,
  message: { code, message },
});
const groupNotFound = () => fail(404, 'GROUP_NOT_FOUND', 'Grupo no encontrado.');
const wishNotFound = () => fail(404, 'WISH_NOT_FOUND', 'Deseo no encontrado.');

type WishLike = Pick<IWish, '_id' | 'group' | 'user' | 'title' | 'description' | 'estimatedPrice' | 'currency' | 'productUrl' | 'imageUrl' | 'isFavorite' | 'createdAt' | 'updatedAt'>;

function serialize(w: WishLike) {
  return {
    id: String(w._id),
    groupId: String(w.group),
    userId: String(w.user),
    title: w.title,
    description: w.description,
    estimatedPrice: w.estimatedPrice ?? null,
    currency: w.currency,
    productUrl: w.productUrl,
    imageUrl: w.imageUrl,
    isFavorite: Boolean(w.isFavorite),
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  };
}

const listFor = (groupId: string, userId: string) =>
  Wish.find({ group: new Types.ObjectId(groupId), user: new Types.ObjectId(userId) })
    .sort({ isFavorite: -1, createdAt: 1 })
    .lean();

export async function listMine(userId: string, groupId: string): Promise<StoreResponse> {
  try {
    if (!(await findGroupForMember(groupId, userId))) return groupNotFound();
    const wishes = await listFor(groupId, userId);
    return { status: 200, message: { results: wishes.map(serialize), max: WISHLIST_MAX_ITEMS } };
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
      if (value === null && key === 'productUrl') unset[key] = 1;
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
    if (wish!.imageUrl) await deleteImage(wish!.imageUrl);
    return { status: 200, message: { ok: true, message: 'Deseo eliminado.' } };
  } catch (error) {
    return { status: 500, message: 'Error al eliminar el deseo.', detail: error };
  }
}

/** Lista de deseos de la persona a quien le regalo (solo tras el sorteo). */
export async function listAssigned(userId: string, groupId: string): Promise<StoreResponse> {
  try {
    const group = await findGroupForMember(groupId, userId);
    if (!group) return groupNotFound();
    if (group.status === GroupStatusEnum.WAITING) {
      return fail(409, 'NOT_DRAWN_YET', 'El sorteo aún no se ha realizado.');
    }
    const receiverId = await findReceiverId(groupId, userId);
    if (!receiverId) return fail(404, 'ASSIGNMENT_NOT_FOUND', 'No tienes una asignación en este grupo.');
    const [wishes, receiver] = await Promise.all([
      listFor(groupId, receiverId),
      User.findById(receiverId).select('name lastName photo').lean(),
    ]);
    return {
      status: 200,
      message: {
        receiver: {
          userId: receiverId,
          name: receiver?.name ?? 'Usuario',
          lastName: receiver?.lastName,
          photo: receiver?.photo ?? null,
        },
        results: wishes.map(serialize),
      },
    };
  } catch (error) {
    return { status: 500, message: 'Error al consultar la lista de deseos.', detail: error };
  }
}
