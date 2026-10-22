import type { WishDetailView } from '../types/session';

/** Fechas relativas a "ahora" para que los "hace X" se vean naturales en la maqueta */
const ago = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString();

/**
 * Detalles de deseo de ejemplo (vista de quien regala).
 * Se reemplazan por GET /api/group/:id/wishlist/:wishId y sus comentarios al conectar la API.
 */
export const MOCK_WISH_DETAILS: Record<string, WishDetailView> = {
  w1: {
    id: 'w1',
    viewer: 'giver',
    groupName: 'Panas de la Oficina',
    ownerAlias: 'Pana Incógnito #04',
    title: 'Camiseta de la Vinotinto',
    subtitle: 'Versión aficionado · Talla M',
    price: 25,
    currency: 'USD',
    category: 'ropa',
    priority: 'alta',
    store: { name: 'Traki', detail: 'Sambil Chacao' },
    url: 'https://www.traki.com.ve',
    commentsCount: 3,
    comments: [
      { id: 'c1', author: 'me', text: '¿Qué talla usas? ¿M o L?', createdAt: ago(50) },
      { id: 'c2', author: 'other', text: 'M, porfa 😊 Y si no hay, una gorra también me cuadra.', createdAt: ago(26) },
      { id: 'c3', author: 'me', text: '¡Anotado! 🎁', createdAt: ago(3) },
    ],
  },
  w2: {
    id: 'w2',
    viewer: 'giver',
    groupName: 'Panas de la Oficina',
    ownerAlias: 'Pana Incógnito #04',
    title: 'Cafetera Greca Moka',
    subtitle: 'De 6 tazas, de aluminio',
    price: 18,
    currency: 'USD',
    category: 'hogar',
    priority: 'normal',
    store: { name: 'Mercado Libre' },
    url: null,
    commentsCount: 0,
    comments: [],
  },
  w3: {
    id: 'w3',
    viewer: 'giver',
    groupName: 'Panas de la Oficina',
    ownerAlias: 'Pana Incógnito #04',
    title: 'Caja de bombones El Rey',
    subtitle: 'Chocolates oscuros 70%',
    price: 12,
    currency: 'USD',
    category: 'dulces',
    priority: 'normal',
    store: { name: 'Automercados Plaza’s' },
    url: null,
    commentsCount: 0,
    comments: [],
  },
};
