import { randomInt } from 'crypto';

/**
 * Algoritmo de sorteo de Amigo Secreto.
 *
 * Produce una asignación giver → receiver tal que:
 *  - nadie se regala a sí mismo,
 *  - cada persona da y recibe exactamente un regalo,
 *  - se respetan las exclusiones (giver no puede regalar a ciertos receivers).
 *
 * Estrategia:
 *  1. Muestreo por rechazo de permutaciones aleatorias (uniforme entre las asignaciones válidas).
 *     Con pocas exclusiones acierta ~37% de las veces por intento.
 *  2. Si se agotan los intentos (muchas exclusiones), emparejamiento bipartito
 *     (algoritmo de Kuhn) con órdenes aleatorios: polinomial y detecta imposibilidad.
 */

export type DrawResult =
  | { ok: true; pairs: Array<{ giver: string; receiver: string }> }
  | { ok: false; reason: 'NOT_ENOUGH_PARTICIPANTS' | 'NO_VALID_ASSIGNMENT'; blocked?: string[] };

const REJECTION_ATTEMPTS = 2000;

function shuffle<T>(items: T[]): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function drawSecretFriends(
  participants: string[],
  exclusions: Map<string, Set<string>> = new Map(),
  minParticipants = 3
): DrawResult {
  const ids = Array.from(new Set(participants));
  if (ids.length < minParticipants) {
    return { ok: false, reason: 'NOT_ENOUGH_PARTICIPANTS' };
  }

  const canGive = (giver: string, receiver: string) =>
    giver !== receiver && !exclusions.get(giver)?.has(receiver);

  // Chequeo rápido: alguien sin ningún receptor posible
  const blocked = ids.filter((g) => !ids.some((r) => canGive(g, r)));
  if (blocked.length > 0) {
    return { ok: false, reason: 'NO_VALID_ASSIGNMENT', blocked };
  }

  // 1. Muestreo por rechazo
  for (let attempt = 0; attempt < REJECTION_ATTEMPTS; attempt++) {
    const receivers = shuffle(ids);
    if (ids.every((g, i) => canGive(g, receivers[i]))) {
      return { ok: true, pairs: ids.map((g, i) => ({ giver: g, receiver: receivers[i] })) };
    }
  }

  // 2. Emparejamiento bipartito aleatorizado (Kuhn)
  const givers = shuffle(ids);
  const candidates = new Map<string, string[]>(
    givers.map((g) => [g, shuffle(ids.filter((r) => canGive(g, r)))])
  );
  const receiverOwner = new Map<string, string>(); // receiver -> giver

  const tryAssign = (giver: string, visited: Set<string>): boolean => {
    for (const r of candidates.get(giver)!) {
      if (visited.has(r)) continue;
      visited.add(r);
      const owner = receiverOwner.get(r);
      if (owner === undefined || tryAssign(owner, visited)) {
        receiverOwner.set(r, giver);
        return true;
      }
    }
    return false;
  };

  const unmatched: string[] = [];
  for (const g of givers) {
    if (!tryAssign(g, new Set())) unmatched.push(g);
  }
  if (unmatched.length > 0) {
    return { ok: false, reason: 'NO_VALID_ASSIGNMENT', blocked: unmatched };
  }

  const pairs = Array.from(receiverOwner.entries()).map(([receiver, giver]) => ({ giver, receiver }));
  return { ok: true, pairs };
}
