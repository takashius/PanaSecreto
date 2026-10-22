/**
 * Color de datos del dashboard (una sola serie → un solo tono).
 * Validado con el validador de paletas: contraste ≥ 3:1 sobre la superficie en ambos modos.
 */
export const chartColor = (isDark: boolean) => (isDark ? '#48CAE4' : '#00B4D8');
export const gridColor = (isDark: boolean) => (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)');
