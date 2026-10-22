import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { containsBadWords } from './badWords';
import { ALIAS_SEED } from '../components/alias/seed';

describe('Filtro de palabras ofensivas', () => {
  it('detecta groserías aunque las disfracen', () => {
    for (const bad of ['Mamaguevo', 'M4M4GU3V0', 'el pajuo', 'Pana Put4', 'puuuuta', 'Verga Loca', 'Hijueputa']) {
      assert.equal(containsBadWords(bad), true, bad);
    }
  });

  it('no bloquea palabras normales', () => {
    for (const ok of ['Cucaracha Feliz', 'Pana Bolsillo', 'La Culebra', 'Concha de Mar Azul', 'Computadora']) {
      assert.equal(containsBadWords(ok), false, ok);
    }
  });

  it('el catálogo inicial pasa el filtro y tiene ~100 alias por género', () => {
    const flagged = ALIAS_SEED.filter((a) => containsBadWords(a.text)).map((a) => a.text);
    assert.deepEqual(flagged, []);
    for (const g of ['M', 'F', 'N'] as const) assert.ok(ALIAS_SEED.filter((a) => a.gender === g).length >= 100);
  });
});
