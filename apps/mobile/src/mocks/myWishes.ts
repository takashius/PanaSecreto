import type { MyWishlistGroup } from '../types/session';

const ago = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString();

/**
 * Mis listas de deseos de ejemplo, una por grupo.
 * Se reemplazan por GET /api/group/:id/wishlist/me al conectar la API.
 */
export const MOCK_MY_WISHLISTS: MyWishlistGroup[] = [
  {
    groupId: 'panas-oficina',
    emoji: '🥂',
    name: 'Panas de la Oficina',
    status: 'LOCKED',
    currency: 'USD',
    budgetMax: 25,
    maxWishes: 20,
    exchangeYear: 2026,
    wishes: [
      {
        id: 'mw1',
        title: 'Audífonos inalámbricos',
        subtitle: 'Bluetooth, de diadema',
        price: 25,
        currency: 'USD',
        category: 'tecnologia',
        priority: 'alta',
        store: { name: 'Traki' },
        commentsCount: 1,
        unansweredCount: 1,
        comments: [{ id: 'mc1', author: 'other', text: '¿Los prefieres negros o blancos?', createdAt: ago(5) }],
      },
      {
        id: 'mw2',
        title: 'Termo para café',
        subtitle: 'Acero inoxidable · color plata',
        note: '500 ml / color plata',
        price: 15,
        currency: 'USD',
        category: 'hogar',
        priority: 'normal',
        store: { name: 'Mercado Libre' },
        commentsCount: 0,
        unansweredCount: 0,
        comments: [],
      },
      {
        id: 'mw3',
        title: 'Libro «Cien años de soledad»',
        subtitle: 'Edición de bolsillo',
        price: 12,
        currency: 'USD',
        category: 'libros',
        priority: 'normal',
        store: { name: 'Librería El Buscón' },
        commentsCount: 2,
        unansweredCount: 0,
        comments: [
          { id: 'mc2', author: 'other', text: '¿Ya lo leíste o es para releer?', createdAt: ago(30) },
          { id: 'mc3', author: 'me', text: '¡Nunca lo he leído! Me da pena admitirlo 😅', createdAt: ago(28) },
        ],
      },
    ],
  },
  {
    groupId: 'familia-miranda',
    emoji: '🎄',
    name: 'La Familia Miranda',
    status: 'WAITING',
    currency: 'USD',
    budgetMax: 25,
    maxWishes: 20,
    exchangeYear: 2026,
    wishes: [
      {
        id: 'mw4',
        title: 'Juego de mesa Monopolio',
        subtitle: 'Edición venezolana',
        price: 22,
        currency: 'USD',
        category: 'otro',
        priority: 'normal',
        store: null,
        commentsCount: 0,
        unansweredCount: 0,
        comments: [],
      },
    ],
  },
  {
    groupId: 'panas-padel',
    emoji: '🎾',
    name: 'Panas del Pádel',
    status: 'WAITING',
    currency: 'USD',
    budgetMax: 30,
    maxWishes: 20,
    exchangeYear: 2026,
    wishes: [],
  },
];
