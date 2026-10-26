import { useState } from 'react';
import { useApiQuery } from '../api/queryStore';
import { fetchTips, tipsKey, type TipScreen } from '../api/tips';

/** El query store pide fetchers estables: uno por pantalla, creado una sola vez */
const fetchers = new Map<TipScreen, () => ReturnType<typeof fetchTips>>();
function fetcherFor(screen: TipScreen) {
  let fn = fetchers.get(screen);
  if (!fn) {
    fn = () => fetchTips(screen);
    fetchers.set(screen, fn);
  }
  return fn;
}

/** Punto de partida al azar en cada visita (los tips quedan en caché 30 min) */
const randomStart = () => Math.floor(Math.random() * 1000);

/**
 * Tip del servidor para una pantalla (incluye los generales). Mientras carga, sin red
 * o si no hay tips para esa pantalla, devuelve `fallback`.
 */
export function useTip(screen: TipScreen, fallback: string) {
  const [index, setIndex] = useState(randomStart);
  const query = useApiQuery(tipsKey(screen), fetcherFor(screen), { staleMs: 30 * 60_000 });
  const tips = query.data ?? [];
  return {
    text: tips.length > 0 ? tips[index % tips.length].text : fallback,
    canCycle: tips.length > 1,
    next: () => setIndex((i) => i + 1),
  };
}
