import validator from 'validator';
import { hash, compare } from 'bcryptjs';
import { sign, decode } from 'jsonwebtoken';
import { Schema, model } from 'mongoose';
import config from '../../config/commons';
import { ALL_ROLES, ROLES } from '../../config/roles';
import { IUserDocument, IUserModel } from '../../types/users';

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio.'],
      trim: true,
    },
    lastName: { type: String, trim: true },
    middleName: { type: String, trim: true },
    phone: { type: String, trim: true },
    photo: { type: String, trim: true },
    /** Apodo con el que lo ven sus panas en las listas de miembros */
    nickname: { type: String, trim: true, maxlength: 30 },
    /** M, F o N: solo para sugerir alias que correspondan */
    gender: { type: String, enum: ['M', 'F', 'N'] },
    /** Preferencias de notificación */
    notifyEmail: { type: Boolean, default: true },
    notifyComments: { type: Boolean, default: true },
    notifyPush: { type: Boolean, default: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, 'El correo electrónico es obligatorio.'],
      validate: [validator.isEmail, 'Ingresa un correo electrónico válido.'],
      unique: true,
    },
    role: {
      type: [String],
      enum: ALL_ROLES,
      default: [ROLES.USER],
      required: true,
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria.'],
      minLength: [6, 'La contraseña debe tener al menos 6 caracteres.'],
    },
    forcePasswordChangeOnNextLogin: { type: Boolean, default: false },
    /** Cuenta de Google vinculada (sub del ID token) */
    googleId: { type: String, index: { unique: true, sparse: true } },
    /** false = cuenta creada con Google sin contraseña propia (puede crearla con "Olvidé mi contraseña") */
    hasPassword: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    date: { type: Date, default: Date.now },
    recoveryCode: { type: Number },
    recoveryCodeExpires: { type: Date },
    recoveryAttempts: { type: Number, default: 0 },
    tokens: [
      {
        token: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await hash(this.password, config.bcryptRounds);
  }
  next();
});

userSchema.methods.generateAuthToken = async function (this: IUserDocument): Promise<string> {
  const user: IUserDocument = this; // eslint-disable-line @typescript-eslint/no-this-alias -- legibilidad
  const objToken = { _id: user._id, date: new Date() };
  const token = sign(objToken, config.JWT_KEY, { expiresIn: '7d' });
  // Purga tokens expirados para que el arreglo de sesiones no crezca sin límite
  const nowSec = Math.floor(Date.now() / 1000);
  const alive = user.tokens.filter((t: { token: string }) => {
    const payload = decode(t.token) as { exp?: number } | null;
    return !!payload?.exp && payload.exp > nowSec;
  });
  user.tokens = alive.concat({ token, date: new Date() });
  await user.save();
  return token;
};

userSchema.statics.findByCredentials = async function (email: string, password: string) {
  if (!validator.isEmail(email)) {
    throw new Error('Credenciales inválidas.');
  }
  const user = await this.findOne({
    email: email.trim().toLowerCase(),
    $or: [{ active: true }, { active: { $exists: false } }],
  }).select('-__v');

  if (!user) {
    throw new Error('Credenciales inválidas.');
  }
  const isPasswordMatch = await compare(password, user.password);
  if (!isPasswordMatch) {
    throw new Error('Credenciales inválidas.');
  }
  return user;
};

export const User = model<IUserDocument, IUserModel>('User', userSchema);
