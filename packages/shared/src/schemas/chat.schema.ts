/**
 * El chat grupal anónimo usa `SendGroupMessageSchema` y `GroupMessageView` (engagement.schema.ts).
 * Un solo chat por grupo, sin mensajes individuales.
 */
export { SendGroupMessageSchema as SendChatMessageSchema, type SendGroupMessageDTO as SendChatMessageDTO } from './engagement.schema';
