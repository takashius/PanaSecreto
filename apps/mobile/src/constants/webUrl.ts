/** Sitio público del panel (términos, privacidad, baja) — mismo origen que el admin en producción */
export const PUBLIC_WEB_BASE =
  (process.env.EXPO_PUBLIC_WEB_URL || 'https://entrepanas.erdesarrollo.com.ve').replace(/\/$/, '');

export const publicLegalUrl = (path: 'terminos' | 'privacidad' | 'baja-servicio') => `${PUBLIC_WEB_BASE}/${path}`;
