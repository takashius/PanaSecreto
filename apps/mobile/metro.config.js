const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Directorio del proyecto actual y raíz del monorepo
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Observar todos los paquetes y código fuente dentro del monorepo (packages/* y apps/*)
config.watchFolders = [monorepoRoot];

// 2. Definir las rutas de node_modules para Metro (proyecto local y raíz de pnpm)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Deshabilitar búsqueda jerárquica para forzar resolución correcta de symlinks en PNPM
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
