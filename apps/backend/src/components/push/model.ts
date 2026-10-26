import { Schema, model, Types, Document } from 'mongoose';

/** Token de Expo Push de un teléfono. Un token pertenece a un solo usuario (el último que inició sesión ahí). */
export interface IPushToken extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  token: string;
  platform?: 'android' | 'ios';
  deviceName?: string;
  lastSeenAt: Date;
  createdAt: Date;
}

const pushTokenSchema = new Schema<IPushToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true, trim: true },
    platform: { type: String, enum: ['android', 'ios'] },
    deviceName: { type: String, maxlength: 80 },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

pushTokenSchema.index({ user: 1 });
// Los teléfonos que no abren la app en 120 días dejan de recibir push
pushTokenSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 120 * 24 * 3600 });

export const PushToken = model<IPushToken>('PushToken', pushTokenSchema);
