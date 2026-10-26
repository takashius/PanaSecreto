import { File } from 'expo-file-system';

/**
 * Archivo local listo para multipart en Expo SDK 57+.
 * El formato `{ uri, name, type }` ya no funciona con el fetch de Expo Go (WinterCG).
 */
export function localImageFile(uri: string): File {
  return new File(uri);
}
