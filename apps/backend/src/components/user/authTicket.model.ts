import { Schema, model, Types, Document } from 'mongoose';

/**
 * Ticket de un solo uso para terminar el inicio de sesión con Google en la app:
 * el navegador vuelve a la app con `?ticket=…` (nunca con el JWT en la URL)
 * y la app lo canjea por la sesión con POST /user/google/exchange.
 */
export interface IAuthTicket extends Document {
  ticketHash: string;
  user: Types.ObjectId;
  token: string;
  newAccount: boolean;
  expiresAt: Date;
}

const authTicketSchema = new Schema<IAuthTicket>({
  ticketHash: { type: String, required: true, unique: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  newAccount: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
});

authTicketSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthTicket = model<IAuthTicket>('AuthTicket', authTicketSchema, 'auth_tickets');
