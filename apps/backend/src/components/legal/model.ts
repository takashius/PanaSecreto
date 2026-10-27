import { Schema, model } from 'mongoose';
import { LEGAL_KEYS } from './defaults';

const legalSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: LEGAL_KEYS,
    },
    version: { type: Number, required: true, default: 1, min: 1 },
    body: {
      es: { type: String, required: true },
      en: { type: String, required: true },
    },
  },
  { timestamps: true }
);

const Legal = model('Legal', legalSchema);
export default Legal;
