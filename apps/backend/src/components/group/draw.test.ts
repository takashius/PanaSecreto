import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { drawSecretFriends, DrawResult } from './draw';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `u${i}`);

function isValid(res: DrawResult, people: string[], excl: Map<string, Set<string>>): boolean {
  if (!res.ok) return false;
  const givers = new Set<string>();
  const receivers = new Set<string>();
  for (const { giver, receiver } of res.pairs) {
    if (giver === receiver || excl.get(giver)?.has(receiver)) return false;
    givers.add(giver);
    receivers.add(receiver);
  }
  return res.pairs.length === people.length && givers.size === people.length && receivers.size === people.length;
}

/** Oráculo por fuerza bruta para n pequeño */
function bruteFeasible(people: string[], excl: Map<string, Set<string>>): boolean {
  const n = people.length;
  const used = new Array(n).fill(false);
  const rec = (i: number): boolean => {
    if (i === n) return true;
    for (let j = 0; j < n; j++) {
      if (used[j] || i === j || excl.get(people[i])?.has(people[j])) continue;
      used[j] = true;
      if (rec(i + 1)) return true;
      used[j] = false;
    }
    return false;
  };
  return rec(0);
}

describe('Algoritmo de sorteo', () => {
  it('coincide con la fuerza bruta en 2.000 casos aleatorios', () => {
    for (let t = 0; t < 2000; t++) {
      const n = 3 + Math.floor(Math.random() * 6);
      const people = ids(n);
      const excl = new Map<string, Set<string>>();
      const density = Math.random() * 0.8;
      for (const a of people)
        for (const b of people)
          if (a !== b && Math.random() < density) {
            if (!excl.has(a)) excl.set(a, new Set());
            excl.get(a)!.add(b);
          }
      const res = drawSecretFriends(people, excl);
      assert.equal(res.ok, bruteFeasible(people, excl), `factibilidad n=${n}`);
      if (res.ok) assert.ok(isValid(res, people, excl));
    }
  });

  it('50 personas con 25 parejas excluidas', () => {
    const people = ids(50);
    const excl = new Map<string, Set<string>>();
    for (let i = 0; i < 50; i += 2) {
      excl.set(people[i], new Set([people[i + 1]]));
      excl.set(people[i + 1], new Set([people[i]]));
    }
    for (let t = 0; t < 100; t++) assert.ok(isValid(drawSecretFriends(people, excl), people, excl));
  });

  it('resuelve casos muy restringidos con el respaldo de emparejamiento', () => {
    const people = ids(40);
    const excl = new Map(people.map((a, i) => [a, new Set(people.filter((_, j) => j !== (i + 1) % 40))]));
    assert.ok(isValid(drawSecretFriends(people, excl), people, excl));
  });

  it('detecta sorteos imposibles e indica quién bloquea', () => {
    const res = drawSecretFriends(['a', 'b', 'c'], new Map([['a', new Set(['b', 'c'])]]));
    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.equal(res.reason, 'NO_VALID_ASSIGNMENT');
      assert.deepEqual(res.blocked, ['a']);
    }
  });

  it('exige un mínimo de participantes', () => {
    const res = drawSecretFriends(['a', 'b']);
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.reason, 'NOT_ENOUGH_PARTICIPANTS');
  });

  it('es uniforme: n=4 produce las 9 asignaciones posibles con frecuencias similares', () => {
    const counts = new Map<string, number>();
    const runs = 9000;
    for (let t = 0; t < runs; t++) {
      const res = drawSecretFriends(ids(4));
      assert.ok(res.ok);
      if (!res.ok) continue;
      const key = res.pairs
        .slice()
        .sort((a, b) => a.giver.localeCompare(b.giver))
        .map((p) => p.receiver)
        .join(',');
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    assert.equal(counts.size, 9);
    for (const c of counts.values()) assert.ok(c > runs / 9 * 0.8 && c < runs / 9 * 1.2, `frecuencia ${c}`);
  });
});
