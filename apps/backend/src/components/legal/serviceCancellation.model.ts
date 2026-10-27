import { Schema, model } from 'mongoose';

const serviceCancellationSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    nationalId: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true },
    additionalInfo: { type: String, trim: true },
    confirmed: { type: Boolean, required: true },
  },
  { timestamps: true }
);

const ServiceCancellation = model('ServiceCancellation', serviceCancellationSchema);
export default ServiceCancellation;
