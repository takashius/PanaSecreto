import { z, ZodTypeAny } from 'zod';
import {
  CreateGroupSchema,
  InviteByEmailSchema,
  JoinGroupSchema,
  SetExclusionsSchema,
  UpdateGroupSchema,
} from '@panasecreto/shared';
import * as store from './store';
import { StoreResponse } from '../../types/general';

type Parsed<T> = { data: T; error?: undefined } | { data?: undefined; error: StoreResponse };

function parse<S extends ZodTypeAny>(schema: S, input: unknown): Parsed<z.output<S>> {
  const result = schema.safeParse(input ?? {});
  if (result.success) return { data: result.data };
  const first = result.error.issues[0];
  return {
    error: {
      status: 400,
      message: {
        code: 'VALIDATION_ERROR',
        message: first?.message || 'Datos inválidos.',
        errors: result.error.flatten().fieldErrors,
      },
    },
  };
}

const resolve = (r: StoreResponse) => Promise.resolve(r);

export function createGroup(userId: string, body: unknown) {
  const parsed = parse(CreateGroupSchema, body);
  if (parsed.error) return resolve(parsed.error);
  return store.createGroup(userId, parsed.data);
}

export function listMyGroups(userId: string, scope?: unknown) {
  const valid = scope === 'created' || scope === 'joined' ? scope : 'all';
  return store.listMyGroups(userId, valid);
}

export function getGroup(userId: string, id: string, isAdmin: boolean) {
  return store.getGroup(userId, id, isAdmin);
}

export function updateGroup(userId: string, id: string, body: unknown) {
  const parsed = parse(UpdateGroupSchema, body);
  if (parsed.error) return resolve(parsed.error);
  return store.updateGroup(userId, id, parsed.data);
}

export function deleteGroup(userId: string, id: string, isAdmin: boolean) {
  return store.deleteGroup(userId, id, isAdmin);
}

export function previewByCode(userId: string, code: string) {
  const parsed = parse(JoinGroupSchema, { inviteCode: code });
  if (parsed.error) return resolve(parsed.error);
  return store.previewByCode(userId, parsed.data.inviteCode);
}

export function joinGroup(userId: string, body: unknown) {
  const parsed = parse(JoinGroupSchema, body);
  if (parsed.error) return resolve(parsed.error);
  return store.joinGroup(userId, parsed.data.inviteCode);
}

export function leaveGroup(userId: string, id: string) {
  return store.leaveGroup(userId, id);
}

export function removeMember(userId: string, id: string, targetId: string) {
  return store.removeMember(userId, id, targetId);
}

export function setExclusions(userId: string, id: string, targetId: string, body: unknown) {
  const parsed = parse(SetExclusionsSchema, body);
  if (parsed.error) return resolve(parsed.error);
  return store.setExclusions(userId, id, targetId, parsed.data);
}

export function inviteByEmail(userId: string, id: string, body: unknown) {
  const parsed = parse(InviteByEmailSchema, body);
  if (parsed.error) return resolve(parsed.error);
  return store.inviteByEmail(userId, id, parsed.data);
}

export function regenerateInviteCode(userId: string, id: string) {
  return store.regenerateInviteCode(userId, id);
}

export function drawGroup(userId: string, id: string) {
  return store.drawGroup(userId, id);
}

export function resetDraw(userId: string, id: string) {
  return store.resetDraw(userId, id);
}

export function revealGroup(userId: string, id: string) {
  return store.revealGroup(userId, id);
}

export function completeGroup(userId: string, id: string) {
  return store.completeGroup(userId, id);
}

export function getMyAssignment(userId: string, id: string) {
  return store.getMyAssignment(userId, id);
}

export function listAssignments(userId: string, id: string) {
  return store.listAssignments(userId, id);
}

export function adminListGroups(query: Record<string, unknown>) {
  return store.adminListGroups(query);
}
