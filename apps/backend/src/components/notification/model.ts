import { Schema, model, Types, Document } from 'mongoose';
import type { NotificationKind, NotificationTarget } from '@panasecreto/shared';

/** Notificación dentro de la app (campana). Se borran solas a los 90 días. */
export interface INotification extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  group?: Types.ObjectId;
  wish?: Types.ObjectId;
  kind: NotificationKind;
  target: NotificationTarget;
  title: string;
  body: string;
  readAt?: Date | null;
  /** Evita duplicados (recordatorios, ráfagas de pistas) */
  dedupeKey?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    group: { type: Schema.Types.ObjectId, ref: 'Group' },
    wish: { type: Schema.Types.ObjectId, ref: 'Wish' },
    kind: { type: String, required: true },
    target: { type: String, required: true },
    title: { type: String, required: true, maxlength: 120 },
    body: { type: String, required: true, maxlength: 300 },
    readAt: { type: Date, default: null },
    dedupeKey: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, readAt: 1 });
notificationSchema.index({ group: 1 });
notificationSchema.index({ dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });

export const Notification = model<INotification>('Notification', notificationSchema);
