import type { GroupDetailView } from '../types/session';

/**
 * Datos de ejemplo para maquetar el Detalle del grupo.
 * Se reemplazan por GET /api/group/:id cuando la app se conecte a la API.
 */
export const MOCK_GROUP_DETAIL: GroupDetailView = {
  id: 'familia-miranda',
  emoji: '🎄',
  name: 'La Familia Miranda',
  status: 'WAITING',
  organizerName: 'María González',
  isOrganizer: true,
  exchangeDateLabel: 'Jue 24 dic',
  exchangeTimeLabel: '8:00 PM',
  exchangeDateLong: 'jueves 24 de diciembre',
  currency: 'USD',
  budgetMin: 10,
  budgetMax: 25,
  maxMembers: 10,
  inviteCode: 'PANA-7K2M-QX',
  location: { name: 'Casa de la abuela', address: 'Urb. Los Naranjos, Calle 3, Caracas' },
  note: "Lleven el regalo bien envuelto y no se olviden de traer algo pa' picar en la parranda navideña.",
  membersCount: 8,
  members: [
    { id: 'm1', fullname: 'María González', initials: 'MG', subtitle: 'Lista de deseos lista ✨', isMe: true, isOrganizer: true, wishlistReady: true },
    { id: 'm2', fullname: 'Carlos Silva', initials: 'CS', subtitle: 'Confirmado · Hace 2h' },
    { id: 'm3', fullname: 'Andrea Mendoza', initials: 'AM', subtitle: 'Confirmado · Ayer' },
    { id: 'm4', fullname: 'José Martínez', initials: 'JM', subtitle: 'Confirmado · Ayer' },
    { id: 'm5', fullname: 'Valentina Ramos', initials: 'VR', subtitle: 'Confirmado · 23 nov' },
    { id: 'm6', fullname: 'Luis Rojas', initials: 'LR', subtitle: 'Confirmado · 22 nov' },
    { id: 'm7', fullname: 'Elena Pérez', initials: 'EP', subtitle: 'Confirmado · 21 nov' },
    { id: 'm8', fullname: 'Daniel Mora', initials: 'DM', subtitle: 'Confirmado · 20 nov' },
  ],
  exclusions: [{ id: 'x1', a: 'José', b: 'Andrea' }],
  unreadChat: 1,
};

/** Grupo con el sorteo hecho: sirve para maquetar "Mi sobre" (sellado y abierto) */
export const MOCK_GROUP_OFICINA: GroupDetailView = {
  id: 'panas-oficina',
  emoji: '🥂',
  name: 'Panas de la Oficina',
  status: 'LOCKED',
  organizerName: 'Andrea Mendoza',
  isOrganizer: false,
  exchangeDateLabel: 'Jue 24 dic',
  exchangeTimeLabel: '6:00 PM',
  exchangeDateLong: 'jueves 24 de diciembre',
  currency: 'USD',
  budgetMin: 10,
  budgetMax: 25,
  maxMembers: 12,
  inviteCode: 'PANA-OF1C-25',
  location: { name: 'Sala de reuniones, piso 3', address: 'Torre Parque Cristal, Los Palos Grandes, Caracas' },
  note: 'Cada quien trae un tequeño o algo pa’l compartir. ¡Nada de regalos sin envolver!',
  membersCount: 12,
  members: [
    { id: 'o1', fullname: 'Andrea Mendoza', initials: 'AM', subtitle: 'Organiza', isOrganizer: true },
    { id: 'o2', fullname: 'Carlos Pérez', initials: 'CP', subtitle: 'Lista de deseos lista ✨', isMe: true, wishlistReady: true },
    { id: 'o3', fullname: 'Luisa Fernández', initials: 'LF', subtitle: 'Confirmada' },
    { id: 'o4', fullname: 'Pedro Gómez', initials: 'PG', subtitle: 'Confirmado' },
    { id: 'o5', fullname: 'Ana Castillo', initials: 'AC', subtitle: 'Confirmada' },
    { id: 'o6', fullname: 'Jorge Blanco', initials: 'JB', subtitle: 'Confirmado' },
    { id: 'o7', fullname: 'Rosa Medina', initials: 'RM', subtitle: 'Confirmada' },
    { id: 'o8', fullname: 'Iván Torres', initials: 'IT', subtitle: 'Confirmado' },
  ],
  exclusions: [],
  unreadChat: 2,
  envelopeOpened: false,
  envelope: {
    alias: 'Pana Incógnito #04',
    exchangeAt: '2026-12-24T18:00:00-04:00',
    exchangeDateLong: 'jueves 24 de diciembre',
    wishes: [
      { id: 'w1', title: 'Camiseta de la Vinotinto', price: 25, currency: 'USD', category: 'ropa', note: 'Talla M', commentsCount: 2 },
      { id: 'w2', title: 'Cafetera Greca Moka', price: 18, currency: 'USD', category: 'hogar', commentsCount: 0 },
      { id: 'w3', title: 'Caja de bombones El Rey', price: 12, currency: 'USD', category: 'dulces', note: 'Chocolates oscuros 70%', commentsCount: 0 },
    ],
  },
};

export const MOCK_GROUPS: Record<string, GroupDetailView> = {
  [MOCK_GROUP_DETAIL.id]: MOCK_GROUP_DETAIL,
  [MOCK_GROUP_OFICINA.id]: MOCK_GROUP_OFICINA,
};
