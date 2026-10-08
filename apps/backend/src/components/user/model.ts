import validator from 'validator';
import { hash, compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
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
    active: { type: Boolean, default: true },
    date: { type: Date, default: Date.now },
    recoveryCode: { type: Number },
    recoveryCodeExpires: { type: Date },
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
  const user = this;
  if (user.isModified('password') && user.password) {
    user.password = await hash(user.password, 8);
  }
  next();
});

userSchema.methods.generateAuthToken = async function (): Promise<string> {
  const user = this;
  const objToken = { _id: user._id, date: new Date() };
  const token = sign(objToken, config.JWT_KEY, { expiresIn: '7d' });
  user.tokens = user.tokens.concat({ token, date: new Date() });
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
