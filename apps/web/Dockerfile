# Landing estática de EntrePanas: build con Node, servida por nginx.
FROM node:22-alpine AS build
WORKDIR /app
COPY apps/web/package.json apps/web/package.json
COPY apps/web/scripts apps/web/scripts
COPY apps/web/src apps/web/src
COPY apps/web/public/fonts apps/web/public/fonts
COPY apps/web/public/img apps/web/public/img
COPY apps/web/public/brand/favicon.ico apps/web/public/brand/favicon-32.png apps/web/public/brand/apple-touch-icon.png apps/web/public/brand/icon-192.png apps/web/public/brand/icon-512.png apps/web/public/brand/icon-512-maskable.png apps/web/public/brand/
ARG SITE_URL
ARG API_URL
ARG PLAY_URL
ARG ADMIN_URL
RUN cd apps/web && node scripts/build.mjs

FROM nginx:1.27-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
