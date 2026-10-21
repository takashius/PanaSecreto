import { Types, type FilterQuery } from 'mongoose';
import { Wish, IWish } from './model';
import { deleteImage } from '../../services/storage';

/**
 * Elimina deseos y sus imágenes de Cloudinary.
 * Módulo aparte (sin dependencias de group/store) para evitar importaciones circulares.
 */
export async function deleteWishes(filter: FilterQuery<IWish>): Promise<number> {
  const withImages = await Wish.find({ ...filter, imageUrl: { $exists: true, $ne: '' } })
    .select('imageUrl')
    .lean();
  const { deletedCount } = await Wish.deleteMany(filter);
  await Promise.all(withImages.map((w) => deleteImage(w.imageUrl)));
  return deletedCount ?? 0;
}

export const deleteWishesOfGroup = (groupId: Types.ObjectId | string) =>
  deleteWishes({ group: new Types.ObjectId(String(groupId)) });

export const deleteWishesOfMember = (groupId: Types.ObjectId | string, userId: string) =>
  deleteWishes({ group: new Types.ObjectId(String(groupId)), user: new Types.ObjectId(userId) });
