import { Schema, model, Types, Document } from 'mongoose';

export type PushAudience = 'all' | 'group' | 'users';

/** Aviso push enviado desde el panel (historial) */
export interface IPushCampaign extends Document {
  _id: Types.ObjectId;
  title: string;
  body: string;
  audience: PushAudience;
  group?: Types.ObjectId;
  groupName?: string;
  users: Types.ObjectId[];
  /** También quedó en la campana de la app */
  inApp: boolean;
  sentBy: Types.ObjectId;
  sentByName?: string;
  /** Usuarios elegidos / con push activas y teléfono / teléfonos / entregadas a Expo */
  selected: number;
  reachable: number;
  devices: number;
  sent: number;
  createdAt: Date;
}

const campaignSchema = new Schema<IPushCampaign>(
  {
    title: { type: String, required: true, maxlength: 80 },
    body: { type: String, required: true, maxlength: 240 },
    audience: { type: String, enum: ['all', 'group', 'users'], required: true },
    group: { type: Schema.Types.ObjectId, ref: 'Group' },
    groupName: { type: String },
    users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    inApp: { type: Boolean, default: false },
    sentBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sentByName: { type: String },
    selected: { type: Number, default: 0 },
    reachable: { type: Number, default: 0 },
    devices: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

campaignSchema.index({ createdAt: -1 });

export const PushCampaign = model<IPushCampaign>('PushCampaign', campaignSchema);
