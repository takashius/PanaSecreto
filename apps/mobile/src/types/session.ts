/**
 * Tipos de sesión y borradores usados por las pantallas maquetadas.
 * Se reemplazarán por los tipos de @panasecreto/shared al conectar la app con la API.
 */
export interface SessionUser {
  identifier?: string;
  fullname?: string;
  username?: string;
  email?: string;
  phone?: string;
}

export interface CreatedGroupDraft {
  name: string;
  date: string;
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
  a: string;
  b: string;
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

/** Un deseo propio, visto desde "Mis deseos" */
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
