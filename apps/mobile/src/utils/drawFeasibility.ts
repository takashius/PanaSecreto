/**
 * ¿Existe un sorteo válido? Cada pana regala a otro distinto de sí mismo, nadie recibe dos veces
 * y se respetan las exclusiones (en ambos sentidos). Es el mismo criterio del backend
 * (emparejamiento perfecto con el algoritmo de Kuhn).
 */
export function isDrawPossible(memberIds: string[], exclusions: Array<{ aId?: string; bId?: string }>): boolean {
  const n = memberIds.length;
  if (n < 3) return false;
  const banned = new Set<string>();
  for (const e of exclusions) {
    if (!e.aId || !e.bId) continue;
    banned.add(`${e.aId}|${e.bId}`);
    banned.add(`${e.bId}|${e.aId}`);
  }
  const allowed = memberIds.map((giver) => memberIds.map((r, j) => (r !== giver && !banned.has(`${giver}|${r}`) ? j : -1)).filter((j) => j >= 0));
  const matchOfReceiver = new Array<number>(n).fill(-1);

  const tryAssign = (giver: number, seen: boolean[]): boolean => {
    for (const r of allowed[giver]) {
      if (seen[r]) continue;
      seen[r] = true;
      if (matchOfReceiver[r] === -1 || tryAssign(matchOfReceiver[r], seen)) {
        matchOfReceiver[r] = giver;
        return true;
      }
    }
    return false;
  };

  for (let g = 0; g < n; g++) {
    if (!tryAssign(g, new Array<boolean>(n).fill(false))) return false;
  }
  return true;
}
