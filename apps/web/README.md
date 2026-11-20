# @panasecreto/web

Landing estática de EntrePanas (HTML, CSS y un poco de JS; sin dependencias). Se sirve con nginx.

```bash
node scripts/build.mjs          # genera dist/
node scripts/serve.mjs          # http://localhost:4173
node --test scripts/check.test.mjs
python3 -I scripts/make-images.py   # regenera public/img desde public/brand (Pillow)
```

Variables de build (opcionales): `SITE_URL`, `API_URL` (backend, para `/join/CODE`), `PLAY_URL`, `ADMIN_URL` (páginas legales).
Docker: construir con el contexto en la raíz del monorepo: `docker build -f apps/web/Dockerfile .`
Diseño: ver `DESIGN.md`. Los maestros de `public/brand` no se publican; se usan los WebP de `public/img`.
