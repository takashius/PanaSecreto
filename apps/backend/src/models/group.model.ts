import mongoose, { Schema, Document } from 'mongoose';
import { GroupStatusEnum, MemberRoleEnum, GroupStatus, MemberRole } from '@panasecreto/shared';

export interface IGroupMemberDoc {
  userId: string;
  name: string;
  email: string;
  role: MemberRole;
  joinedAt: Date;
  assignedTargetId?: string;
  exclusions: string[];
}

export interface IGroupDocument extends Document {
  name: string;
  description?: string;
  creatorId: string;
  status: GroupStatus;
  exchangeDate: Date;
  budget?: number;
  currency: string;
  inviteCode: string;
  members: IGroupMemberDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const GroupMemberSchema = new Schema<IGroupMemberDoc>(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(MemberRoleEnum),
      default: MemberRoleEnum.PARTICIPANT,
    },
    joinedAt: { type: Date, default: Date.now },
    assignedTargetId: { type: String },
    exclusions: [{ type: String }],
  },
  { _id: false }
);

const GroupSchema = new Schema<IGroupDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    creatorId: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(GroupStatusEnum),
      default: GroupStatusEnum.WAITING,
    },
    exchangeDate: { type: Date, required: true },
    budget: { type: Number, min: 0 },
    currency: { type: String, default: 'USD' },
    inviteCode: { type: String, required: true, unique: true },
    members: [GroupMemberSchema],
  },
  {
    timestamps: true,
  }
);

export const GroupModel = mongoose.model<IGroupDocument>('Group', GroupSchema);
