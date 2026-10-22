import { Schema, model, Types, Document } from 'mongoose';

export interface IAliasSuggestion extends Document {
  _id: Types.ObjectId;
  text: string;
  /** Versión normalizada (minúsculas) para evitar duplicados */
  textKey: string;
  gender: 'M' | 'F' | 'N';
  emoji?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const aliasSuggestionSchema = new Schema<IAliasSuggestion>(
  {
    text: { type: String, required: true, trim: true, maxlength: 30 },
    textKey: { type: String, required: true },
    gender: { type: String, enum: ['M', 'F', 'N'], required: true },
    emoji: { type: String, trim: true, maxlength: 16 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

aliasSuggestionSchema.index({ textKey: 1, gender: 1 }, { unique: true });
aliasSuggestionSchema.index({ gender: 1, active: 1 });

aliasSuggestionSchema.pre('validate', function (next) {
  if (this.text) this.textKey = this.text.trim().toLowerCase();
  next();
});

export const AliasSuggestion = model<IAliasSuggestion>('AliasSuggestion', aliasSuggestionSchema);
