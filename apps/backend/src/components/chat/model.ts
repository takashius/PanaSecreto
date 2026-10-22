import { Schema, model, Types, Document } from 'mongoose';

/**
 * Mensaje del chat grupal. Se guarda quién lo envió (para "mine" y moderación),
 * pero la app solo recibe el alias congelado al momento de enviar.
 */
export interface IChatMessage extends Document {
  _id: Types.ObjectId;
  group: Types.ObjectId;
  user: Types.ObjectId;
  alias: string;
  aliasEmoji: string;
  text: string;
  kind: 'mensaje' | 'pista';
  createdAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    alias: { type: String, required: true, maxlength: 30 },
    aliasEmoji: { type: String, maxlength: 16, default: '🎁' },
    text: { type: String, required: true, trim: true, maxlength: 500 },
    kind: { type: String, enum: ['mensaje', 'pista'], default: 'mensaje' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

chatMessageSchema.index({ group: 1, createdAt: -1 });
chatMessageSchema.index({ user: 1, createdAt: -1 });

export const ChatMessage = model<IChatMessage>('ChatMessage', chatMessageSchema);

/** Hasta cuándo leyó cada usuario el chat de cada grupo (para los no leídos) */
export interface IChatReadState extends Document {
  group: Types.ObjectId;
  user: Types.ObjectId;
  lastReadAt: Date;
}

const chatReadStateSchema = new Schema<IChatReadState>({
  group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastReadAt: { type: Date, required: true },
});

chatReadStateSchema.index({ user: 1, group: 1 }, { unique: true });

export const ChatReadState = model<IChatReadState>('ChatReadState', chatReadStateSchema);
