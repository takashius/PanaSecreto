import { Types, type FilterQuery } from 'mongoose';
import { TIP_SCREENS, type TipInput, type TipScreen, type TipView } from '@panasecreto/shared';
import { Tip, ITip } from './model';
import { TIP_SEED } from './seed';
import { StoreResponse } from '../../types/general';

const fail = (status: number, code: string, message: string): StoreResponse => ({ status, message: { code, message } });
const isValidId = (id: string) => Types.ObjectId.isValid(id) && String(new Types.ObjectId(id)) === id;
const escapeRegex = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isScreen = (v: unknown): v is TipScreen => (TIP_SCREENS as readonly unknown[]).includes(v);

const serialize = (t: Pick<ITip, '_id' | 'text' | 'screens' | 'active' | 'weight'>): TipView => ({
  id: String(t._id),
  text: t.text,
  screens: t.screens,
  active: t.active,
  weight: t.weight ?? 1,
});

export async function seedTips(): Promise<number> {
  if ((await Tip.estimatedDocumentCount()) > 0) return 0;
  const inserted = await Tip.insertMany(TIP_SEED.map((t) => ({ ...t, weight: t.weight ?? 1, active: true })));
  return inserted.length;
}

/** Barajado ponderado: los de más peso tienden a salir primero, pero sin orden fijo */
function weightedShuffle<T extends { weight: number }>(items: T[], random: () => number = Math.random): T[] {
  return items
    .map((item) => ({ item, key: Math.pow(random(), 1 / Math.max(1, item.weight)) }))
    .sort((a, b) => b.key - a.key)
    .map((x) => x.item);
}

/**
 * Tips para una pantalla de la app, en orden aleatorio.
 * `general=false` excluye los generales del juego (por defecto se incluyen).
 */
export async function tipsForScreen(query: { screen?: unknown; general?: unknown; limit?: unknown }): Promise<StoreResponse> {
  try {
    const screen = isScreen(query.screen) ? query.screen : 'general';
    const withGeneral = query.general !== 'false' && screen !== 'general';
    const screens: TipScreen[] = withGeneral ? [screen, 'general'] : [screen];
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 20));
    const tips = await Tip.find({ active: true, screens: { $in: screens } }).lean();
    const results = weightedShuffle(tips.map(serialize)).slice(0, limit);
    return { status: 200, message: { screen, results } };
  } catch (error) {
    return { status: 500, message: 'Error al consultar los tips.', detail: error };
  }
}

/* ==============================================================
   Administración (panel web)
   ============================================================== */

export async function adminList(filters: Record<string, unknown>): Promise<StoreResponse> {
  try {
    const query: FilterQuery<ITip> = {};
    if (isScreen(filters.screen)) query.screens = filters.screen;
    if (filters.active === 'true' || filters.active === 'false') query.active = filters.active === 'true';
    if (typeof filters.q === 'string' && filters.q.trim()) {
      query.text = new RegExp(escapeRegex(filters.q.trim().slice(0, 80)), 'i');
    }
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(200, Number(filters.limit) || 50));
    const [items, total, perScreen] = await Promise.all([
      Tip.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Tip.countDocuments(query),
      Tip.aggregate<{ _id: TipScreen; total: number }>([
        { $match: { active: true } },
        { $unwind: '$screens' },
        { $group: { _id: '$screens', total: { $sum: 1 } } },
      ]),
    ]);
    return {
      status: 200,
      message: {
        results: items.map(serialize),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        screens: TIP_SCREENS,
        activePerScreen: Object.fromEntries(TIP_SCREENS.map((s) => [s, perScreen.find((p) => p._id === s)?.total ?? 0])),
      },
    };
  } catch (error) {
    return { status: 500, message: 'Error al listar los tips.', detail: error };
  }
}

export async function adminCreate(dto: TipInput): Promise<StoreResponse> {
  try {
    const created = await Tip.create({ ...dto, screens: Array.from(new Set(dto.screens)) });
    return { status: 201, message: serialize(created) };
  } catch (error) {
    return { status: 500, message: 'Error al crear el tip.', detail: error };
  }
}

export async function adminUpdate(id: string, dto: Partial<TipInput>): Promise<StoreResponse> {
  try {
    if (!isValidId(id)) return fail(404, 'TIP_NOT_FOUND', 'Tip no encontrado.');
    const set = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined));
    if (dto.screens) set.screens = Array.from(new Set(dto.screens));
    const updated = await Tip.findByIdAndUpdate(id, { $set: set }, { new: true, runValidators: true });
    if (!updated) return fail(404, 'TIP_NOT_FOUND', 'Tip no encontrado.');
    return { status: 200, message: serialize(updated) };
  } catch (error) {
    return { status: 500, message: 'Error al actualizar el tip.', detail: error };
  }
}

export async function adminDelete(id: string): Promise<StoreResponse> {
  try {
    if (!isValidId(id)) return fail(404, 'TIP_NOT_FOUND', 'Tip no encontrado.');
    const r = await Tip.deleteOne({ _id: id });
    if (r.deletedCount === 0) return fail(404, 'TIP_NOT_FOUND', 'Tip no encontrado.');
    return { status: 200, message: { ok: true, message: 'Tip eliminado.' } };
  } catch (error) {
    return { status: 500, message: 'Error al eliminar el tip.', detail: error };
  }
}
