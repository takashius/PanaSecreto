const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// En Expo SDK 52+, getDefaultConfig detecta y configura automáticamente los monorepos.
// Las opciones manuales como disableHierarchicalLookup o watchFolders rompen la resolución en pnpm.
const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
