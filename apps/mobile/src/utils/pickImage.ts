import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * Pide permiso y abre la cámara o la galería. Devuelve la URI local o null si se canceló.
 * `aspect` define el recorte (1:1 para avatar, 4:3 para deseos).
 */
export async function pickImage(source: 'camera' | 'library', aspect: [number, number]): Promise<string | null> {
  const perm =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(
      'Permiso necesario',
      source === 'camera'
        ? 'Activa el acceso a la cámara en los ajustes del teléfono para tomar la foto.'
        : 'Activa el acceso a tus fotos en los ajustes del teléfono para elegir una imagen.'
    );
    return null;
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect, quality: 0.8 };
  const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  return !result.canceled && result.assets[0] ? result.assets[0].uri : null;
}

/** Menú "Tomar foto / Elegir de la galería" */
export function choosePhotoSource(aspect: [number, number], onPicked: (uri: string) => void, onRemove?: () => void) {
  const run = (source: 'camera' | 'library') => {
    void pickImage(source, aspect).then((uri) => uri && onPicked(uri));
  };
  Alert.alert('Foto', undefined, [
    { text: 'Tomar foto', onPress: () => run('camera') },
    { text: 'Elegir de la galería', onPress: () => run('library') },
    ...(onRemove ? [{ text: 'Quitar foto', style: 'destructive' as const, onPress: onRemove }] : []),
    { text: 'Cancelar', style: 'cancel' as const },
  ]);
}

/** Iniciales para avatares sin foto: "Carlos Pérez" → "CP" */
export const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('') || '?';
