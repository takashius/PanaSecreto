import type { ChatRoomSummary } from '../types/session';

const ago = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString();

/**
 * Salas de chat de ejemplo. Al conectar la app, los mensajes llegarán por Socket.io
 * (un canal por grupo) y el historial por GET /api/group/:id/chat.
 */
export const MOCK_CHATS: ChatRoomSummary[] = [
  {
    groupId: 'familia-miranda',
    emoji: '🎄',
    name: 'La Familia Miranda',
    status: 'WAITING',
    myAlias: 'Pana Llanero',
    myAvatar: '🤠',
    membersCount: 8,
    exchangeAt: '2026-12-24T20:00:00-04:00',
    unread: 2,
    messages: [
      { id: 'f1', alias: 'Pana Maracucho', avatar: '🎭', at: ago(5), mine: false, text: '¿Alguien sabe si a mi pana le gustan las hallacas con pasitas o sin pasitas? ¡Hablen claro que no quiero meter la pata! 😂🫔' },
      { id: 'f2', alias: 'Pana Arepero', avatar: '🫓', at: ago(4.8), mine: false, text: '¡El que me regale medias se queda sin torta negra ni ponche crema este año jajaja! Avisados están 👀' },
      { id: 'f3', alias: 'Pana Caraqueño', avatar: '🏔️', at: ago(4.5), mine: false, text: 'Pilas con el presupuesto que quedamos en $25 máximo 💸 No se pasen de sifrinos.' },
      { id: 'f4', alias: 'Pana Llanero', avatar: '🤠', at: ago(4.3), mine: true, text: 'Tranquilos que ya tengo mi lista de deseos al día en la app 🔥 Vayan revisando pa’ que no haya quejas.' },
      { id: 'f5', alias: 'Pana Arepero', avatar: '🫓', at: ago(0.6), mine: false, kind: 'pista', text: 'Me encanta todo lo que tenga que ver con café ☕' },
    ],
  },
  {
    groupId: 'panas-oficina',
    emoji: '🥂',
    name: 'Panas de la Oficina',
    status: 'LOCKED',
    myAlias: 'Pana Gocho',
    myAvatar: '🏔️',
    membersCount: 12,
    exchangeAt: '2026-12-24T18:00:00-04:00',
    unread: 0,
    messages: [
      { id: 'o1', alias: 'Pana Gocho', avatar: '🏔️', at: ago(30), mine: true, text: '¿Quedamos en que el intercambio es a las 6?' },
      { id: 'o2', alias: 'Pana Maracucho', avatar: '🎭', at: ago(26), mine: false, text: 'Sí, a las 6. Pilas con el presupuesto 💸' },
    ],
  },
  {
    groupId: 'panas-padel',
    emoji: '🎾',
    name: 'Panas del Pádel',
    status: 'WAITING',
    myAlias: 'Pana Caraqueño',
    myAvatar: '🌆',
    membersCount: 6,
    exchangeAt: '2026-12-20T10:00:00-04:00',
    unread: 0,
    messages: [],
  },
  {
    groupId: 'promo-ucab',
    emoji: '🎓',
    name: 'Los de la Promo UCAB',
    status: 'COMPLETED',
    myAlias: 'Pana Andino',
    myAvatar: '🦙',
    membersCount: 16,
    exchangeAt: '2025-12-20T19:00:00-04:00',
    unread: 0,
    messages: [
      { id: 'u1', alias: 'Pana Costeño', avatar: '🏖️', at: '2025-12-20T21:30:00-04:00', mine: false, text: '¡Qué buena parranda! Gracias a todos 🎉' },
    ],
  },
];
