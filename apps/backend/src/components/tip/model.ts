import { Schema, model, Types, Document } from 'mongoose';
import { TIP_SCREENS, type TipScreen } from '@panasecreto/shared';

export interface ITip extends Document {
  _id: Types.ObjectId;
  text: string;
  screens: TipScreen[];
  active: boolean;
  /** 1 a 5: mayor peso, sale más seguido */
  weight: number;
  createdAt: Date;
  updatedAt: Date;
}

const tipSchema = new Schema<ITip>(
  {
    text: { type: String, required: true, trim: true, maxlength: 220 },
    screens: {
      type: [{ type: String, enum: TIP_SCREENS as unknown as string[] }],
      validate: [(v: string[]) => v.length > 0, 'El tip debe tener al menos una pantalla'],
    },
    active: { type: Boolean, default: true },
    weight: { type: Number, min: 1, max: 5, default: 1 },
  },
  { timestamps: true }
);

tipSchema.index({ active: 1, screens: 1 });

export const Tip = model<ITip>('Tip', tipSchema);
