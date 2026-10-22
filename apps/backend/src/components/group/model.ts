import { Schema, model, Types, Document } from 'mongoose';
import {
  CurrencyEnum,
  GROUP_MAX_PARTICIPANTS,
  GROUP_MIN_PARTICIPANTS,
  GroupStatus,
  GroupStatusEnum,
  MemberRole,
  MemberRoleEnum,
} from '@panasecreto/shared';

export interface IGroupMember {
  user: Types.ObjectId;
  role: MemberRole;
  joinedAt: Date;
  /** Miembros a quienes este miembro NO puede regalar */
  exclusions: Types.ObjectId[];
  /** Alias anónimo en este grupo (sobre, chat y comentarios). Único dentro del grupo */
  alias?: string;
  aliasEmoji?: string;
  /** Cuándo abrió su sobre (después del sorteo) */
  envelopeOpenedAt?: Date;
}

export interface IGroupLocation {
  name: string;
  address?: string;
}

export interface IGroup extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  emoji?: string;
  creator: Types.ObjectId;
  status: GroupStatus;
  exchangeDate: Date;
  currency: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  maxParticipants: number;
  anonymousClues: boolean;
  location?: IGroupLocation | null;
  note?: string | null;
  inviteCode: string;
  members: Types.DocumentArray<IGroupMember & Document>;
  /** Se incrementa en cada cambio de miembros/exclusiones; protege el sorteo contra carreras */
  membersVersion: number;
  drawnAt?: Date;
  revealedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const groupMemberSchema = new Schema<IGroupMember>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: Object.values(MemberRoleEnum),
      default: MemberRoleEnum.PARTICIPANT,
    },
    joinedAt: { type: Date, default: Date.now },
    exclusions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    alias: { type: String, trim: true, maxlength: 30 },
    aliasEmoji: { type: String, trim: true, maxlength: 16 },
    envelopeOpenedAt: { type: Date },
  },
  { _id: false }
);

const groupLocationSchema = new Schema<IGroupLocation>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    address: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { _id: false }
);

const groupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500 },
    emoji: { type: String, trim: true, maxlength: 16 },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: Object.values(GroupStatusEnum),
      default: GroupStatusEnum.WAITING,
      index: true,
    },
    exchangeDate: { type: Date, required: true },
    currency: { type: String, enum: Object.values(CurrencyEnum), default: CurrencyEnum.USD },
    budgetMin: { type: Number, min: 0, default: null },
    budgetMax: { type: Number, min: 0, default: null },
    maxParticipants: {
      type: Number,
      min: GROUP_MIN_PARTICIPANTS,
      max: GROUP_MAX_PARTICIPANTS,
      default: GROUP_MAX_PARTICIPANTS,
    },
    anonymousClues: { type: Boolean, default: true },
    location: { type: groupLocationSchema, default: null },
    note: { type: String, trim: true, maxlength: 300, default: null },
    inviteCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    members: { type: [groupMemberSchema], default: [] },
    membersVersion: { type: Number, default: 0 },
    drawnAt: { type: Date },
    revealedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

groupSchema.index({ 'members.user': 1 });

export const Group = model<IGroup>('Group', groupSchema);

/**
 * Asignaciones del sorteo en una colección aparte: nunca viajan con el grupo,
 * así ningún endpoint de grupo puede filtrar quién le regala a quién.
 */
export interface IAssignment extends Document {
  group: Types.ObjectId;
  giver: Types.ObjectId;
  receiver: Types.ObjectId;
  createdAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    giver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

assignmentSchema.index({ group: 1, giver: 1 }, { unique: true });
assignmentSchema.index({ group: 1, receiver: 1 }, { unique: true });

export const Assignment = model<IAssignment>('Assignment', assignmentSchema);
