import { api } from './client';
import type { Currency } from './groups';

/** Deseo tal como lo devuelve la API (el dueño ve su userId; quien regala no) */
export interface ApiWish {
  id: string;
  groupId: string;
  userId?: string;
  title: string;
  description?: string;
  estimatedPrice: number | null;
  currency?: Currency;
  productUrl?: string;
  imageUrl?: string;
  category?: string;
  storeName?: string;
  isFavorite: boolean;
  commentsCount: number;
  unansweredCount: number;
  createdAt: string;
}

export interface ApiComment {
  id: string;
  author: 'me' | 'other';
  authorRole: 'owner' | 'giver';
  text: string;
  createdAt: string;
}

export const myWishlistKey = (groupId: string) => `wishlist:me:${groupId}`;
export const commentsKey = (wishId: string) => `comments:${wishId}`;

export const fetchMyWishlist = (groupId: string) =>
  api<{ results: ApiWish[]; max: number }>(`/api/group/${groupId}/wishlist/me`);

/** Datos del formulario; la foto es la ruta local elegida en el teléfono (file://…) */
export interface WishInput {
  title: string;
  description: string | null;
  estimatedPrice: number | null;
  currency: Currency;
  category: string;
  storeName: string | null;
  productUrl: string | null;
  isFavorite: boolean;
  /** Foto nueva para subir (si no cambió, no se manda) */
  localImageUri?: string | null;
}

function imagePart(uri: string) {
  const name = uri.split('/').pop()?.split('?')[0] || 'deseo.jpg';
  const ext = (name.split('.').pop() || 'jpg').toLowerCase();
  const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
  // React Native acepta { uri, name, type } como archivo en FormData
  return { uri, name: name.includes('.') ? name : `${name}.jpg`, type } as unknown as Blob;
}

/** Multipart: todos los campos viajan como texto (el backend convierte números, booleanos y null) */
function toForm(input: WishInput, editing: boolean): FormData {
  const form = new FormData();
  const put = (key: string, value: string | number | boolean | null) => {
    if (value === null) {
      // Al editar, "null" borra el campo; al crear simplemente no se envía
      if (editing) form.append(key, 'null');
      return;
    }
    form.append(key, String(value));
  };
  put('title', input.title);
  // La descripción no admite null: al editar se vacía con texto vacío
  if (input.description !== null) put('description', input.description);
  else if (editing) form.append('description', '');
  put('estimatedPrice', input.estimatedPrice);
  put('currency', input.currency);
  put('category', input.category);
  put('storeName', input.storeName);
  put('productUrl', input.productUrl);
  put('isFavorite', input.isFavorite);
  if (input.localImageUri) form.append('image', imagePart(input.localImageUri));
  return form;
}

/** Sin foto nueva se manda JSON (más liviano); con foto, multipart */
function payload(input: WishInput, editing: boolean) {
  if (input.localImageUri) return { form: toForm(input, editing), timeoutMs: 60000 };
  const body: Record<string, unknown> = {
    title: input.title,
    estimatedPrice: input.estimatedPrice,
    currency: input.currency,
    category: input.category,
    isFavorite: input.isFavorite,
  };
  for (const key of ['description', 'storeName', 'productUrl'] as const) {
    if (input[key] !== null) body[key] = input[key];
    else if (editing) body[key] = key === 'description' ? '' : null;
  }
  return { body };
}

export const createWish = (groupId: string, input: WishInput) =>
  api<ApiWish>(`/api/group/${groupId}/wishlist`, { method: 'POST', ...payload(input, false) });

export const updateWish = (groupId: string, wishId: string, input: WishInput) =>
  api<ApiWish>(`/api/group/${groupId}/wishlist/${wishId}`, { method: 'PATCH', ...payload(input, true) });

export const setWishFavorite = (groupId: string, wishId: string, isFavorite: boolean) =>
  api<ApiWish>(`/api/group/${groupId}/wishlist/${wishId}`, { method: 'PATCH', body: { isFavorite } });

export const deleteWish = (groupId: string, wishId: string) =>
  api<{ ok: boolean }>(`/api/group/${groupId}/wishlist/${wishId}`, { method: 'DELETE' });

export const fetchComments = (groupId: string, wishId: string) =>
  api<{ results: ApiComment[]; myRole: 'owner' | 'giver'; canComment: boolean }>(
    `/api/group/${groupId}/wishlist/${wishId}/comments`
  );

export const postComment = (groupId: string, wishId: string, text: string) =>
  api<ApiComment>(`/api/group/${groupId}/wishlist/${wishId}/comments`, { method: 'POST', body: { text } });
