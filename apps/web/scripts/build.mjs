// Copia src/ y los activos públicos a dist/ sustituyendo los marcadores %…%.
// Variables (todas con valor por defecto):
//   SITE_URL  https://entrepanas.erdesarrollo.site
//   API_URL   https://entrepanas-api.erdesarrollo.com.ve  (backend: /join/CODE)
//   PLAY_URL  enlace de Google Play
//   ADMIN_URL https://entrepanas.erdesarrollo.com.ve (páginas legales)
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const vars = {
  '%SITE_URL%': process.env.SITE_URL ?? 'https://entrepanas.erdesarrollo.site',
  '%API_URL%': process.env.API_URL ?? 'https://entrepanas-api.erdesarrollo.com.ve',
  '%PLAY_URL%': process.env.PLAY_URL ?? 'https://play.google.com/store/apps/details?id=com.erdesarrollo.entrepanas',
  '%ADMIN_URL%': process.env.ADMIN_URL ?? 'https://entrepanas.erdesarrollo.com.ve',
};
const TEXT = new Set(['.html', '.xml', '.txt', '.webmanifest', '.css', '.js']);

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(root, 'src'), dist, { recursive: true });
cpSync(join(root, 'public', 'fonts'), join(dist, 'fonts'), { recursive: true });
cpSync(join(root, 'public', 'img'), join(dist, 'img'), { recursive: true });
// iconos de marca (solo los que usa la web; los maestros pesados no se publican)
for (const f of ['favicon.ico', 'favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png']) {
  cpSync(join(root, 'public', 'brand', f), join(dist, f));
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (TEXT.has(extname(p))) {
      let s = readFileSync(p, 'utf8');
      for (const [k, v] of Object.entries(vars)) s = s.replaceAll(k, v);
      writeFileSync(p, s);
    }
  }
}
walk(dist);
console.log('web: dist listo ->', dist);
