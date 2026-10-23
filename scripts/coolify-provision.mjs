#!/usr/bin/env node
/**
 * Referencia de despliegue EntrePanas en Coolify (panel.erdesarrollo.site).
 * Requiere COOLIFY_URL y COOLIFY_TOKEN (p. ej. en .env local, no commitear).
 *
 * Uso típico: configurar apps en la UI o reutilizar los UUID guardados en
 * .coolify-provision.local.json tras el primer aprovisionamiento.
 */
export const COOLIFY = {
  // Proyecto dedicado en Coolify (recursos aún pueden estar en ErDesarrollo → production hasta moverlos en la UI).
  projectUuid: 'smvzjzr9gmyntk0pdfw8aiks', // EntrePanas
  environmentUuid: 'wrb3eeeojafss7jv1gedg5o5', // production
  legacyProjectUuid: 'asoows0swko4c4kcw8sgoc00', // ErDesarrollo (donde se crearon vía API)
  legacyEnvironmentUuid: 'eooo0w4cggg08kcssss0wokk',
  serverUuid: 'j4848o4cgcoo4444kosw4s4k',
  destinationUuid: 'f00w8woo8ww8gccgg8sk44kw',
  githubAppUuid: 'locws4kk0k8k4kwg0gwckog4',
  gitRepository: 'takashius/PanaSecreto',
  gitBranch: 'main',
  api: {
    name: 'entrepanas-api',
    dockerfile: '/apps/backend/Dockerfile',
    port: 4000,
    domain: 'https://entrepanas-api.erdesarrollo.com.ve',
    healthPath: '/api/health',
  },
  admin: {
    name: 'entrepanas-admin',
    dockerfile: '/apps/admin/Dockerfile',
    port: 80,
    domain: 'https://entrepanas.erdesarrollo.com.ve',
    buildEnv: { VITE_API_URL: 'https://entrepanas-api.erdesarrollo.com.ve' },
  },
  mongo: { name: 'entrepanas-mongo' },
};
