import { Schema, model, Types, Document } from 'mongoose';
import { CurrencyEnum, WishCategoryEnum } from '@panasecreto/shared';

export interface IWish extends Document {
  _id: Types.ObjectId;
  group: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  description?: string;
  estimatedPrice?: number | null;
  currency?: string;
  productUrl?: string;
  imageUrl?: string;
  isFavorite: boolean;
  category: string;
  storeName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const wishSchema = new Schema<IWish>(
  {
    group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    estimatedPrice: { type: Number, min: 0, default: null },
    currency: { type: String, enum: Object.values(CurrencyEnum) },
    productUrl: { type: String, trim: true, maxlength: 2000 },
    imageUrl: { type: String, trim: true, maxlength: 2000 },
    isFavorite: { type: Boolean, default: false },
    category: { type: String, enum: Object.values(WishCategoryEnum), default: WishCategoryEnum.OTRO },
    storeName: { type: String, trim: true, maxlength: 80 },
  },
  { timestamps: true }
);

wishSchema.index({ group: 1, user: 1, createdAt: 1 });

export const Wish = model<IWish>('Wish', wishSchema);
