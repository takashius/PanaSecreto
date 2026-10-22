import { useEffect, useState } from 'react';

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** true cuando la fecha ya pasó */
  done: boolean;
}

function partsUntil(target: number): CountdownParts {
  const diff = Math.max(0, target - Date.now());
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    done: diff === 0,
  };
}

/** Cuenta regresiva que se actualiza cada segundo hasta la fecha ISO indicada (si cambia la fecha, remonta con otra `key`) */
export function useCountdown(isoDate: string): CountdownParts {
  const target = new Date(isoDate).getTime();
  const [parts, setParts] = useState(() => partsUntil(target));

  useEffect(() => {
    const id = setInterval(() => {
      const next = partsUntil(target);
      setParts(next);
      if (next.done) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  return parts;
}
