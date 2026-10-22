import type { AppNotification, JoinPreview } from '../types/session';

const ago = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString();

/**
 * Notificaciones de ejemplo. Al conectar la API llegarán de GET /api/notifications
 * (con consultas periódicas o push), no por WebSocket.
 */
export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    kind: 'comment',
    text: 'Tu amigo secreto preguntó en «Audífonos inalámbricos»: "¿Los prefieres negros o blancos?"',
    groupId: 'panas-oficina',
    groupName: 'Panas de la Oficina',
    at: ago(2),
    read: false,
    target: { screen: 'myWish', wishId: 'mw1' },
  },
  {
    id: 'n2',
    kind: 'reply',
    text: 'Pana Incógnito #04 respondió en «Camiseta de la Vinotinto»',
    groupId: 'panas-oficina',
    groupName: 'Panas de la Oficina',
    at: ago(5),
    read: false,
    target: { screen: 'wish', wishId: 'w1' },
  },
  {
    id: 'n3',
    kind: 'draw',
    text: '¡Ya se hizo el sorteo! Tu sobre te espera',
    groupId: 'panas-oficina',
    groupName: 'Panas de la Oficina',
    at: ago(9),
    read: true,
    target: { screen: 'envelope' },
  },
  {
    id: 'n4',
    kind: 'reveal',
    text: '¡Llegó el gran día! Ya puedes ver quién era tu amigo secreto',
    groupId: 'promo-ucab',
    groupName: 'Los de la Promo UCAB',
    at: ago(11),
    read: false,
    target: { screen: 'reveal' },
  },
  {
    id: 'n5',
    kind: 'join',
    text: 'Daniel Mora se unió a «La Familia Miranda» (8 de 10)',
    groupId: 'familia-miranda',
    groupName: 'La Familia Miranda',
    at: ago(30),
    read: true,
    target: { screen: 'group' },
  },
  {
    id: 'n6',
    kind: 'chat',
    text: 'Pana Arepero lanzó una pista en el chat',
    groupId: 'familia-miranda',
    groupName: 'La Familia Miranda',
    at: ago(52),
    read: true,
    target: { screen: 'chat' },
  },
  {
    id: 'n7',
    kind: 'reminder',
    text: 'Faltan 60 días para el destape de «Panas de la Oficina»',
    groupId: 'panas-oficina',
    groupName: 'Panas de la Oficina',
    at: ago(200),
    read: true,
    target: { screen: 'group' },
  },
];

/** Códigos de invitación de ejemplo (GET /api/group/invite/:code al conectar la API) */
export const MOCK_JOIN_PREVIEWS: Record<string, JoinPreview> = {
  'PANA-7K2M-QX': {
    code: 'PANA-7K2M-QX',
    groupId: 'familia-miranda',
    emoji: '🎄',
    name: 'La Familia Miranda',
    organizerName: 'María González',
    exchangeDateLabel: 'Jue 24 dic',
    exchangeTimeLabel: '8:00 PM (Cena)',
    currency: 'USD',
    budgetMin: 10,
    budgetMax: 25,
    location: { name: 'Casa de la abuela', address: 'Urb. Los Naranjos, Caracas' },
    membersCount: 8,
    maxMembers: 10,
    memberInitials: ['MG', 'CS', 'AM', 'JM', 'VR'],
  },
};
