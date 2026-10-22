import type { ImageSourcePropType } from 'react-native';

/**
 * Recursos gráficos de marca, tomados de la carpeta `assets/` en la raíz del monorepo
 * (Metro observa la raíz gracias a `watchFolders` en metro.config.js).
 */

/** Logo principal: mascota + logotipo "EntrePanas" + lema. Proporción 750×698. */
export const BRAND_LOGO: ImageSourcePropType = require('../../../../assets/logos/logo-principal-transparente.png');
export const BRAND_LOGO_ASPECT = 750 / 698;

/** Isotipo de la app (guacamaya sobre mosaico amarillo). Proporción 205×195. */
export const BRAND_ISOTIPO: ImageSourcePropType = require('../../../../assets/iconos/isotipo-app.png');
