# -------------------------------------------------------------
# Stage 1: Build de la SPA con Node y PNPM
# -------------------------------------------------------------
FROM node:22-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /app

# Copiar manifiestos de workspaces para resolver el árbol de dependencias
COPY pnpm-lock.yaml* pnpm-workspace.yaml package.json ./
COPY packages/tsconfig/package.json packages/tsconfig/
COPY packages/ui-tokens/package.json packages/ui-tokens/
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/
COPY apps/admin/package.json apps/admin/
COPY apps/mobile/package.json apps/mobile/

# Instalar dependencias del workspace de manera determinista y no interactiva
RUN pnpm install --frozen-lockfile --trust-lockfile

# Copiar configuraciones y código fuente necesarios
COPY packages/tsconfig ./packages/tsconfig
COPY packages/ui-tokens ./packages/ui-tokens
COPY packages/shared ./packages/shared
COPY apps/admin ./apps/admin

# Compilar paquetes compartidos requeridos
RUN pnpm --filter @panasecreto/ui-tokens build
RUN pnpm --filter @panasecreto/shared build

# Compilar aplicación admin con Vite
RUN pnpm --filter @panasecreto/admin build

# -------------------------------------------------------------
# Stage 2: Servidor estático Nginx de alta eficiencia
# -------------------------------------------------------------
FROM nginx:alpine AS runner

# Copiar configuración personalizada de Nginx optimizada para SPA
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos estáticos generados por Vite
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
