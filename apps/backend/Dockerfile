# -------------------------------------------------------------
# Base Stage: Configuración de Node.js y PNPM
# -------------------------------------------------------------
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# -------------------------------------------------------------
# Builder Stage: Instalación y Compilación del Monorepo
# -------------------------------------------------------------
FROM base AS builder
WORKDIR /app

# Copiar manifiestos de workspaces para resolver el árbol de dependencias
COPY pnpm-lock.yaml* pnpm-workspace.yaml package.json ./
COPY packages/tsconfig/package.json packages/tsconfig/
COPY packages/shared/package.json packages/shared/
COPY packages/ui-tokens/package.json packages/ui-tokens/
COPY apps/backend/package.json apps/backend/
COPY apps/admin/package.json apps/admin/
COPY apps/mobile/package.json apps/mobile/

# Instalar dependencias del workspace de manera determinista y no interactiva
RUN pnpm install --frozen-lockfile --trust-lockfile

# Copiar código fuente y configuraciones requeridas para el backend
COPY packages/tsconfig ./packages/tsconfig
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Compilar dependencias compartidas y el servicio backend
RUN pnpm --filter @panasecreto/shared build
RUN pnpm --filter @panasecreto/backend build

# -------------------------------------------------------------
# Runner Stage: Imagen de Producción Mínima
# -------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Usuario no privilegiado para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 panabackend

# Copiar artefactos y dependencias necesarias desde el builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules

COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules

# Asignar permisos al usuario
RUN chown -R panabackend:nodejs /app

USER panabackend
WORKDIR /app/apps/backend

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

CMD ["node", "dist/index.js"]
