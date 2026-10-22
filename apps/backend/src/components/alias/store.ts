import { Types, type FilterQuery } from 'mongoose';
import {
  ALIAS_SUGGESTIONS_PER_PAGE,
  GroupStatusEnum,
  type AliasSuggestionInput,
  type AliasSuggestionView,
  type Gender,
  type SetAliasDTO,
} from '@panasecreto/shared';
import { AliasSuggestion, IAliasSuggestion } from './model';
import { ALIAS_SEED } from './seed';
import { Group } from '../group/model';
import { User } from '../user/model';
import { containsBadWords } from '../../utils/badWords';
import { StoreResponse } from '../../types/general';

const fail = (status: number, code: string, message: string): StoreResponse => ({ status, message: { code, message } });
const isValidId = (id: string) => Types.ObjectId.isValid(id) && String(new Types.ObjectId(id)) === id;
const escapeRegex = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const GENDERS = ['M', 'F', 'N'] as const;
const asGender = (v: unknown): Gender | undefined => (GENDERS as readonly unknown[]).includes(v) ? (v as Gender) : undefined;

const serialize = (a: Pick<IAliasSuggestion, '_id' | 'text' | 'gender' | 'emoji' | 'active'>): AliasSuggestionView => ({
  id: String(a._id),
  text: a.text,
  gender: a.gender,
  emoji: a.emoji,
  active: a.active,
});

/** Inserta el catálogo inicial si la colección está vacía */
export async function seedAliasSuggestions(): Promise<number> {
  if ((await AliasSuggestion.estimatedDocumentCount()) > 0) return 0;
  const docs = ALIAS_SEED.map((a) => ({ ...a, textKey: a.text.toLowerCase(), active: true }));
  try {
    const inserted = await AliasSuggestion.insertMany(docs, { ordered: false });
    return inserted.length;
  } catch (error) {
    // Otra instancia pudo sembrar al mismo tiempo: los duplicados se ignoran
    const e = error as { code?: number; insertedDocs?: unknown[] };
    if (e.code === 11000) return e.insertedDocs?.length ?? 0;
    throw error;
  }
}

/** Para un género se sugieren alias de ese género y neutros; sin género, de todos */
const gendersFor = (gender?: Gender): Gender[] => (gender === 'M' || gender === 'F' ? [gender, 'N'] : [...GENDERS]);

async function usedAliasesOf(groupId: Types.ObjectId): Promise<Set<string>> {
  const g = await Group.findById(groupId).select('members.alias').lean();
  return new Set((g?.members || []).map((m) => m.alias?.toLowerCase()).filter((x): x is string => Boolean(x)));
}

/**
 * 5 sugerencias al azar para el usuario en un grupo.
 * Excluye las ya mostradas (`exclude`, ids separados por coma) y las usadas en el grupo.
 */
export async function suggestionsFor(
  userId: string,
  groupId: string,
  query: { gender?: unknown; exclude?: unknown }
): Promise<StoreResponse> {
  try {
    if (!isValidId(groupId)) return fail(404, 'GROUP_NOT_FOUND', 'Grupo no encontrado.');
    const group = await Group.findOne({ _id: groupId, 'members.user': new Types.ObjectId(userId) }).select('_id').lean();
    if (!group) return fail(404, 'GROUP_NOT_FOUND', 'Grupo no encontrado.');

    let gender = asGender(query.gender);
    if (!gender) gender = asGender((await User.findById(userId).select('gender').lean())?.gender);

    const exclude = String(query.exclude ?? '')
      .split(',')
      .map((x) => x.trim())
      .filter(isValidId)
      .slice(0, 200)
      .map((x) => new Types.ObjectId(x));
    const used = Array.from(await usedAliasesOf(group._id));

    const results = await AliasSuggestion.aggregate([
      {
        $match: {
          active: true,
          gender: { $in: gendersFor(gender) },
          _id: { $nin: exclude },
          textKey: { $nin: used },
        },
      },
      { $sample: { size: ALIAS_SUGGESTIONS_PER_PAGE } },
    ]);
    return { status: 200, message: { results: results.map(serialize), gender: gender ?? null } };
  } catch (error) {
    return { status: 500, message: 'Error al buscar sugerencias de alias.', detail: error };
  }
}

/** Elige (o escribe) el alias del usuario en un grupo. Solo antes del sorteo. */
export async function setMyAlias(userId: string, groupId: string, dto: SetAliasDTO): Promise<StoreResponse> {
  try {
    if (!isValidId(groupId)) return fail(404, 'GROUP_NOT_FOUND', 'Grupo no encontrado.');
    const uid = new Types.ObjectId(userId);
    const group = await Group.findOne({ _id: groupId, 'members.user': uid }).select('status members.user members.alias');
    if (!group) return fail(404, 'GROUP_NOT_FOUND', 'Grupo no encontrado.');
    if (group.status !== GroupStatusEnum.WAITING) {
      return fail(409, 'ALIAS_LOCKED', 'El alias no se puede cambiar después del sorteo.');
    }
    const alias = dto.alias.replace(/\s+/g, ' ').trim();
    const key = alias.toLowerCase();
    const fromCatalog = await AliasSuggestion.findOne({ textKey: key, active: true }).lean();
    if (!fromCatalog && containsBadWords(alias)) {
      return fail(400, 'ALIAS_NOT_ALLOWED', 'Ese alias no está permitido. Prueba con otro más sano 😅');
    }
    const takenByOther = group.members.some((m) => String(m.user) !== userId && m.alias?.toLowerCase() === key);
    if (takenByOther) return fail(409, 'ALIAS_TAKEN', 'Alguien del grupo ya usa ese alias. Elige otro.');

    const emoji = dto.emoji || fromCatalog?.emoji || '🎁';
    // Condición atómica: sigue en espera y nadie más tomó el alias entre la lectura y la escritura
    const result = await Group.updateOne(
      {
        _id: group._id,
        status: GroupStatusEnum.WAITING,
        members: { $not: { $elemMatch: { user: { $ne: uid }, alias: new RegExp(`^${escapeRegex(alias)}$`, 'i') } } },
        'members.user': uid,
      },
      { $set: { 'members.$[me].alias': alias, 'members.$[me].aliasEmoji': emoji } },
      { arrayFilters: [{ 'me.user': uid }] }
    );
    if (result.matchedCount === 0) return fail(409, 'ALIAS_TAKEN', 'El grupo cambió o el alias ya se usa. Intenta de nuevo.');
    return { status: 200, message: { alias, aliasEmoji: emoji, fromCatalog: Boolean(fromCatalog) } };
  } catch (error) {
    return { status: 500, message: 'Error al guardar tu alias.', detail: error };
  }
}

/**
 * Alias automáticos para el sorteo (miembros que no eligieron).
 * Respeta el género de cada uno y no repite alias del grupo; si el catálogo se agota usa "Pana Incógnito #NN".
 */
export async function pickAutoAliases(
  genders: Array<Gender | undefined>,
  used: Set<string>
): Promise<Array<{ alias: string; emoji: string }>> {
  const taken = new Set(used);
  const pool = await AliasSuggestion.aggregate<{ text: string; textKey: string; gender: Gender; emoji?: string }>([
    { $match: { active: true } },
    { $sample: { size: Math.min(300, genders.length * 6 + 30) } },
  ]);
  let counter = 1;
  return genders.map((gender) => {
    const allowed = gendersFor(gender);
    const pick = pool.find((p) => allowed.includes(p.gender) && !taken.has(p.textKey));
    if (pick) {
      taken.add(pick.textKey);
      return { alias: pick.text, emoji: pick.emoji || '🎁' };
    }
    let fallback = `Pana Incógnito #${String(counter++).padStart(2, '0')}`;
    while (taken.has(fallback.toLowerCase())) fallback = `Pana Incógnito #${String(counter++).padStart(2, '0')}`;
    taken.add(fallback.toLowerCase());
    return { alias: fallback, emoji: '🥸' };
  });
}

/* ==============================================================
   Administración (panel web)
   ============================================================== */

export async function adminList(filters: Record<string, unknown>): Promise<StoreResponse> {
  try {
    const query: FilterQuery<IAliasSuggestion> = {};
    const gender = asGender(filters.gender);
    if (gender) query.gender = gender;
    if (filters.active === 'true' || filters.active === 'false') query.active = filters.active === 'true';
    if (typeof filters.q === 'string' && filters.q.trim()) {
      query.text = new RegExp(escapeRegex(filters.q.trim().slice(0, 50)), 'i');
    }
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(200, Number(filters.limit) || 50));
    const [items, total, counts] = await Promise.all([
      AliasSuggestion.find(query).sort({ gender: 1, text: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      AliasSuggestion.countDocuments(query),
      AliasSuggestion.aggregate<{ _id: Gender; total: number; active: number }>([
        { $group: { _id: '$gender', total: { $sum: 1 }, active: { $sum: { $cond: ['$active', 1, 0] } } } },
      ]),
    ]);
    const byGender = Object.fromEntries(GENDERS.map((g) => {
      const c = counts.find((x) => x._id === g);
      return [g, { total: c?.total ?? 0, active: c?.active ?? 0 }];
    }));
    return {
      status: 200,
      message: { results: items.map(serialize), total, page, limit, totalPages: Math.ceil(total / limit) || 1, byGender },
    };
  } catch (error) {
    return { status: 500, message: 'Error al listar los alias.', detail: error };
  }
}

const duplicate = () => fail(409, 'ALIAS_DUPLICATE', 'Ya existe ese alias para ese género.');

export async function adminCreate(dto: AliasSuggestionInput): Promise<StoreResponse> {
  try {
    const created = await AliasSuggestion.create({ ...dto, textKey: dto.text.toLowerCase() });
    return { status: 201, message: serialize(created) };
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return duplicate();
    return { status: 500, message: 'Error al crear el alias.', detail: error };
  }
}

export async function adminUpdate(id: string, dto: Partial<AliasSuggestionInput>): Promise<StoreResponse> {
  try {
    if (!isValidId(id)) return fail(404, 'ALIAS_NOT_FOUND', 'Alias no encontrado.');
    const doc = await AliasSuggestion.findById(id);
    if (!doc) return fail(404, 'ALIAS_NOT_FOUND', 'Alias no encontrado.');
    Object.assign(doc, Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined)));
    await doc.save();
    return { status: 200, message: serialize(doc) };
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return duplicate();
    return { status: 500, message: 'Error al actualizar el alias.', detail: error };
  }
}

export async function adminDelete(id: string): Promise<StoreResponse> {
  try {
    if (!isValidId(id)) return fail(404, 'ALIAS_NOT_FOUND', 'Alias no encontrado.');
    const r = await AliasSuggestion.deleteOne({ _id: id });
    if (r.deletedCount === 0) return fail(404, 'ALIAS_NOT_FOUND', 'Alias no encontrado.');
    return { status: 200, message: { ok: true, message: 'Alias eliminado.' } };
  } catch (error) {
    return { status: 500, message: 'Error al eliminar el alias.', detail: error };
  }
}

/** Alias propios (fuera del catálogo) que escribieron los usuarios, para moderarlos */
export async function adminListCustom(filters: Record<string, unknown>): Promise<StoreResponse> {
  try {
    const limit = Math.max(1, Math.min(200, Number(filters.limit) || 100));
    const rows = await Group.aggregate<{
      groupId: Types.ObjectId;
      groupName: string;
      status: string;
      alias: string;
      aliasEmoji?: string;
      user: Types.ObjectId;
    }>([
      { $unwind: '$members' },
      { $match: { 'members.alias': { $exists: true, $ne: null } } },
      {
        $project: {
          groupId: '$_id',
          groupName: '$name',
          status: 1,
          alias: '$members.alias',
          aliasEmoji: '$members.aliasEmoji',
          user: '$members.user',
          key: { $toLower: '$members.alias' },
          updatedAt: 1,
        },
      },
      { $lookup: { from: AliasSuggestion.collection.name, localField: 'key', foreignField: 'textKey', as: 'catalog' } },
      { $match: { catalog: { $size: 0 }, alias: { $not: /^Pana Incógnito #\d+$/ } } },
      { $sort: { updatedAt: -1 } },
      { $limit: limit },
    ]);
    const users = await User.find({ _id: { $in: rows.map((r) => r.user) } }).select('name lastName email').lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));
    return {
      status: 200,
      message: {
        results: rows.map((r) => {
          const u = byId.get(String(r.user));
          return {
            groupId: String(r.groupId),
            groupName: r.groupName,
            status: r.status,
            alias: r.alias,
            aliasEmoji: r.aliasEmoji,
            flagged: containsBadWords(r.alias),
            user: { id: String(r.user), name: [u?.name, u?.lastName].filter(Boolean).join(' '), email: u?.email },
          };
        }),
      },
    };
  } catch (error) {
    return { status: 500, message: 'Error al listar los alias propios.', detail: error };
  }
}

/** Moderación: quita el alias propio de un miembro (solo antes del sorteo; vuelve a elegir) */
export async function adminClearMemberAlias(groupId: string, userId: string): Promise<StoreResponse> {
  try {
    if (!isValidId(groupId) || !isValidId(userId)) return fail(404, 'MEMBER_NOT_FOUND', 'Miembro no encontrado.');
    const uid = new Types.ObjectId(userId);
    const group = await Group.findOne({ _id: groupId, 'members.user': uid }).select('status');
    if (!group) return fail(404, 'MEMBER_NOT_FOUND', 'Miembro no encontrado.');
    if (group.status === GroupStatusEnum.WAITING) {
      await Group.updateOne(
        { _id: group._id },
        { $unset: { 'members.$[me].alias': 1, 'members.$[me].aliasEmoji': 1 } },
        { arrayFilters: [{ 'me.user': uid }] }
      );
    } else {
      // Tras el sorteo no se puede dejar sin alias: se reemplaza por uno neutro del catálogo
      const used = await usedAliasesOf(group._id);
      const [pick] = await pickAutoAliases(['N'], used);
      await Group.updateOne(
        { _id: group._id },
        { $set: { 'members.$[me].alias': pick.alias, 'members.$[me].aliasEmoji': pick.emoji } },
        { arrayFilters: [{ 'me.user': uid }] }
      );
    }
    return { status: 200, message: { ok: true } };
  } catch (error) {
    return { status: 500, message: 'Error al moderar el alias.', detail: error };
  }
}
