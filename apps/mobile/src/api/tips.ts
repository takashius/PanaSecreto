import { api } from './client';

/** Mismas claves de pantalla que el backend y el panel */
export type TipScreen =
  | 'general'
  | 'grupos'
  | 'grupo.resumen'
  | 'sobre.sellado'
  | 'sobre.lista'
  | 'deseo.detalle'
  | 'deseo.formulario'
  | 'deseos'
  | 'chat.lista'
  | 'chat.sala'
  | 'notificaciones'
  | 'unirse'
  | 'exclusiones'
  | 'revelacion';

export interface Tip {
  id: string;
  text: string;
}

export const tipsKey = (screen: TipScreen) => `tips:${screen}`;

/** Tips activos de la pantalla (más los generales), ya barajados por el servidor */
export const fetchTips = (screen: TipScreen) =>
  api<{ results: Tip[] }>(`/api/tips?screen=${encodeURIComponent(screen)}&limit=20`, { auth: false }).then((r) => r.results);
