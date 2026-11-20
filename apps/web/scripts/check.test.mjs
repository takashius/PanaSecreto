// Los colores OKLCH de tokens.css deben seguir coincidiendo con los hex oficiales de packages/ui-tokens.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'src/css/tokens.css'), 'utf8');

function oklchToHex(L, C, h) {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return '#' + lin.map((v) => { const c = Math.min(1, Math.max(0, v)); const g = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; return Math.round(g * 255).toString(16).padStart(2, '0'); }).join('').toUpperCase();
}
const brand = { navy: '#0B2D5B', yellow: '#FFC107', sky: '#00B4D8', coral: '#FF5A3D', 'navy-deep': '#071E3D' };
for (const [name, hex] of Object.entries(brand)) {
  test(`--color-${name} coincide con ${hex}`, () => {
    const m = css.match(new RegExp(`--color-${name}:\\s*oklch\\(([\\d.]+)%\\s+([\\d.]+)\\s+([\\d.]+)\\)`));
    assert.ok(m, 'token no encontrado');
    const got = oklchToHex(+m[1] / 100, +m[2], +m[3]);
    const d = [1, 3, 5].map((i) => Math.abs(parseInt(got.slice(i, i + 2), 16) - parseInt(hex.slice(i, i + 2), 16)));
    assert.ok(Math.max(...d) <= 2, `${got} vs ${hex}`);
  });
}
