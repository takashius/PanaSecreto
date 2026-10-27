/**
 * Tipos de vista de la app: lo que muestran las pantallas, ya adaptado desde la API
 * (los adaptadores viven en src/api y src/adapters).
 */
export interface SessionUser {
  _id: string;
  name: string;
  lastName?: string;
  email: string;
  /** Con prefijo internacional, p. ej. +584121234567 */
  phone?: string;
  photo?: string | null;
  nickname?: string;
  gender?: 'M' | 'F' | 'N';
  notifyEmail?: boolean;
  notifyComments?: boolean;
  notifyPush?: boolean;
  role?: string | string[];
  /** false si la cuenta se creó con Google y aún no tiene contraseña propia */
  hasPassword?: boolean;
  googleLinked?: boolean;
  forcePasswordChangeOnNextLogin?: boolean;
}

export interface CreatedGroupDraft {
  name: string;
  /** Fecha legible, p. ej. "jueves, 24 de diciembre de 2026" */
  date: string;
  /** ISO 8601 elegido en el calendario */
  exchangeAt: string;
  currency: 'USD' | 'VES';
  minBudget: string | null;
  maxBudget: string | null;
  participantsLimit: number;
  anonymousClues: boolean;
  code: string;
}

/** Estados del grupo (mismos valores que el backend) */
export type GroupStatus = 'WAITING' | 'LOCKED' | 'REVEALED' | 'COMPLETED';

export interface GroupMemberPreview {
  id: string;
  fullname: string;
  initials: string;
  /** Texto secundario: "Confirmado · Hace 2h", "Lista de deseos lista"… */
  subtitle: string;
  isMe?: boolean;
  isOrganizer?: boolean;
  wishlistReady?: boolean;
}

export interface GroupExclusionPreview {
  id: string;
  /** Nombres cortos para mostrar */
  a: string;
  b: string;
  /** IDs de los miembros (para validar y guardar) */
  aId?: string;
  bId?: string;
}

/** Datos que muestra el Detalle del grupo (pestaña Resumen) */
export interface GroupDetailView {
  id: string;
  emoji: string;
  name: string;
  status: GroupStatus;
  organizerName: string;
  isOrganizer: boolean;
  /** Fecha y hora ya formateadas para mostrar */
  exchangeDateLabel: string;
  exchangeTimeLabel: string;
  /** "jueves 24 de diciembre", para frases completas */
  exchangeDateLong: string;
  /** ISO 8601 del intercambio (fuente de las etiquetas anteriores al editar) */
  exchangeAt: string;
  currency: 'USD' | 'VES';
  budgetMin: number | null;
  budgetMax: number | null;
  maxMembers: number;
  inviteCode: string;
  location?: { name: string; address: string } | null;
  note?: string | null;
  members: GroupMemberPreview[];
  /** Total de miembros (la lista puede venir recortada) */
  membersCount: number;
  exclusions: GroupExclusionPreview[];
  unreadChat: number;
  /** Solo existe después del sorteo */
  envelope?: EnvelopeView | null;
  /** Si ya abrí mi sobre (se recuerda en el servidor) */
  envelopeOpened?: boolean;
  /** Solo cuando el grupo está REVEALED: quién era quién */
  reveal?: GroupReveal | null;
  /** Mi alias en este grupo (null si aún no lo elijo) */
  myAlias?: string | null;
  myAliasEmoji?: string | null;
}

/** Resultado de la revelación para mí */
export interface GroupReveal {
  /** A quién le regalé (nombre real + el alias que vi) */
  giftedTo: { fullname: string; alias: string; initials: string };
  /** Quién me regaló a mí */
  giftedBy: { fullname: string; initials: string };
}

export type WishCategory = 'ropa' | 'tecnologia' | 'hogar' | 'libros' | 'dulces' | 'otro';

/** Deseo tal como lo ve quien regala (sin datos del dueño) */
export interface WishPreview {
  id: string;
  title: string;
  price: number | null;
  currency: 'USD' | 'VES';
  category: WishCategory;
  imageUrl?: string | null;
  /** Texto corto opcional (talla, color, marca…) */
  note?: string | null;
  commentsCount: number;
}

/** Contenido de "Mi sobre": a quién le regalo, siempre con alias hasta la revelación */
export interface EnvelopeView {
  /** Alias anónimo del pana asignado: "Pana Incógnito #04" */
  alias: string;
  /** Nombre real: solo llega del backend cuando el grupo está REVEALED */
  revealedName?: string | null;
  /** ISO 8601 del intercambio, para la cuenta regresiva */
  exchangeAt: string;
  /** "sábado 24 de diciembre" */
  exchangeDateLong: string;
  wishes: WishPreview[];
}

/** Comentario anónimo de un deseo: solo lo ven el dueño del deseo y quien le regala */
export interface WishComment {
  id: string;
  /** 'me' = lo escribí yo; 'other' = la otra persona del hilo */
  author: 'me' | 'other';
  text: string;
  /** ISO 8601 */
  createdAt: string;
}

/** Detalle de un deseo. `viewer` indica desde qué lado se mira el hilo de comentarios */
export interface WishDetailView extends WishPreview {
  viewer: 'giver' | 'owner';
  groupName: string;
  /** Alias del dueño del deseo, visto por quien regala ("Pana Incógnito #04") */
  ownerAlias: string;
  priority: 'normal' | 'alta';
  subtitle?: string | null;
  store?: { name: string; detail?: string | null } | null;
  url?: string | null;
  comments: WishComment[];
}

/** Un deseo propio, visto desde "Deseos" */
export interface MyWish extends WishPreview {
  priority: 'normal' | 'alta';
  subtitle?: string | null;
  store?: { name: string; detail?: string | null } | null;
  url?: string | null;
  /** Preguntas de mi amigo secreto que aún no respondo */
  unansweredCount: number;
  comments: WishComment[];
}

/** Mi lista de deseos en un grupo (la lista es por grupo) */
export interface MyWishlistGroup {
  groupId: string;
  emoji: string;
  name: string;
  status: GroupStatus;
  currency: 'USD' | 'VES';
  budgetMax: number | null;
  /** Tope de deseos por lista */
  maxWishes: number;
  /** Año del intercambio, para el subtítulo "Amigo Secreto 2026" */
  exchangeYear: number;
  wishes: MyWish[];
}

/** Mensaje del chat grupal anónimo: siempre se firma con el alias del grupo, nunca con el nombre */
export interface ChatMessage {
  id: string;
  alias: string;
  /** Emoji del avatar del alias */
  avatar: string;
  text: string;
  /** ISO 8601 */
  at: string;
  mine: boolean;
  /** 'pista' = indirecta para quien me regala (se resalta) */
  kind?: 'mensaje' | 'pista';
  /** Solo mensajes propios mientras el servidor confirma */
  pending?: boolean;
}

/** Resumen de la sala de chat de un grupo (un solo chat por grupo, sin chats individuales) */
export interface ChatRoomSummary {
  groupId: string;
  emoji: string;
  name: string;
  status: GroupStatus;
  /** Mi alias en este grupo, p. ej. "Pana Llanero" (null si aún no lo elijo) */
  myAlias: string | null;
  myAvatar: string;
  membersCount: number;
  /** ISO del intercambio, para "Faltan N días" */
  exchangeAt: string;
  unread: number;
  /** Después de la revelación el chat queda de solo lectura */
  readOnly: boolean;
  lastMessage: ChatMessage | null;
}

/** Datos del perfil propio que muestra y edita la app */
export interface ProfileView {
  fullname: string;
  /** Apodo con el que te ven tus panas fuera del anonimato (lista de miembros, revelación) */
  nickname?: string | null;
  email: string;
  /** Solo los dígitos locales; el prefijo +58 se muestra aparte */
  phone?: string | null;
  photoUri?: string | null;
  notifyEmail: boolean;
  notifyComments: boolean;
  /** Push en el teléfono (necesita la app instalada; en Expo Go Android no llegan) */
  notifyPush: boolean;
}

/** Tipo de notificación (define ícono y a dónde lleva al tocarla) */
/** 'announcement' = aviso enviado por la administración desde el panel */
export type NotificationKind = 'comment' | 'reply' | 'draw' | 'join' | 'reminder' | 'reveal' | 'chat' | 'announcement';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  /** Título corto ("¡Ya se hizo el sorteo! ✉️") */
  title: string;
  /** Texto principal; lo que va entre «» se resalta */
  text: string;
  /** null en avisos que no son de un grupo */
  groupId: string | null;
  /** Nombre del grupo para mostrar (se completa con los grupos del usuario) */
  groupName?: string;
  /** ISO 8601 */
  at: string;
  read: boolean;
  /** Destino al tocarla */
  target: { screen: 'myWish' | 'wish' | 'envelope' | 'group' | 'chat' | 'reveal'; wishId?: string };
}

/** Grupo encontrado al buscar un código de invitación */
export interface JoinPreview {
  code: string;
  groupId: string;
  emoji: string;
  name: string;
  organizerName: string;
  exchangeDateLabel: string;
  exchangeTimeLabel: string;
  currency: 'USD' | 'VES';
  budgetMin: number | null;
  budgetMax: number | null;
  location?: { name: string; address: string } | null;
  membersCount: number;
  maxMembers: number;
  memberInitials: string[];
}
