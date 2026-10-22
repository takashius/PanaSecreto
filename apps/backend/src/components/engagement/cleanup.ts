import { Types } from 'mongoose';
import { WishComment } from '../comment/model';
import { ChatMessage, ChatReadState } from '../chat/model';
import { Notification } from '../notification/model';

/**
 * Limpieza de comentarios, chat y notificaciones.
 * Módulo sin dependencias de los stores para evitar importaciones circulares.
 */
const oid = (id: Types.ObjectId | string) => new Types.ObjectId(String(id));

export async function deleteCommentsOfGroup(groupId: Types.ObjectId | string): Promise<void> {
  await WishComment.deleteMany({ group: oid(groupId) });
}

export async function deleteCommentsOfWishes(wishIds: Array<Types.ObjectId | string>): Promise<void> {
  if (wishIds.length === 0) return;
  await WishComment.deleteMany({ wish: { $in: wishIds.map(oid) } });
}

/** Al eliminar un grupo: todo lo que cuelga de él */
export async function deleteEngagementOfGroup(groupId: Types.ObjectId | string): Promise<void> {
  const group = oid(groupId);
  await Promise.all([
    WishComment.deleteMany({ group }),
    ChatMessage.deleteMany({ group }),
    ChatReadState.deleteMany({ group }),
    Notification.deleteMany({ group }),
  ]);
}

/** Un miembro sale o lo expulsan: sus estados de lectura y notificaciones de ese grupo */
export async function deleteEngagementOfMember(groupId: Types.ObjectId | string, userId: string): Promise<void> {
  const group = oid(groupId);
  const user = oid(userId);
  await Promise.all([ChatReadState.deleteMany({ group, user }), Notification.deleteMany({ group, user })]);
}
