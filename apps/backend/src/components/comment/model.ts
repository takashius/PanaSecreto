import { Schema, model, Types, Document } from 'mongoose';

/**
 * Comentario anónimo en un deseo: hilo privado entre el dueño del deseo y quien le regala.
 * Nunca se expone el autor real: la app solo recibe "me/other" y el rol (owner/giver).
 */
export interface IWishComment extends Document {
  _id: Types.ObjectId;
  group: Types.ObjectId;
  wish: Types.ObjectId;
  /** Dueño del deseo (para listar hilos sin cargar el deseo) */
  wishOwner: Types.ObjectId;
  author: Types.ObjectId;
  authorRole: 'owner' | 'giver';
  text: string;
  createdAt: Date;
}

const wishCommentSchema = new Schema<IWishComment>(
  {
    group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    wish: { type: Schema.Types.ObjectId, ref: 'Wish', required: true },
    wishOwner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorRole: { type: String, enum: ['owner', 'giver'], required: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

wishCommentSchema.index({ wish: 1, createdAt: 1 });
wishCommentSchema.index({ group: 1 });

export const WishComment = model<IWishComment>('WishComment', wishCommentSchema);
