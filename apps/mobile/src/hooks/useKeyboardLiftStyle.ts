import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedReaction,
  useAnimatedStyle,
} from 'react-native-reanimated';

type Options = {
  /**
   * Restar al levantar el contenedor (en UniSAN: altura del tab bar).
   * En pantallas a pantalla completa usamos la safe area inferior.
   */
  bottomOffset?: number;
  onKeyboardShow?: () => void;
  /** Separación visual entre el compositor y el teclado (px). */
  keyboardGap?: number;
};

const DEFAULT_KEYBOARD_GAP = 10;

/**
 * Estilo animado para chat/comentarios: sube todo el bloque (mensajes + compositor)
 * sin empujar de más el input. Misma idea que UniSAN ChatDetail.
 */
export function useKeyboardLiftStyle(options: Options = {}) {
  const insets = useSafeAreaInsets();
  const bottomOffset = options.bottomOffset ?? insets.bottom;
  const keyboardGap = options.keyboardGap ?? DEFAULT_KEYBOARD_GAP;

  const keyboard = useAnimatedKeyboard(
    Platform.OS === 'android'
      ? {
          isStatusBarTranslucentAndroid: true,
          isNavigationBarTranslucentAndroid: true,
        }
      : {},
  );

  const style = useAnimatedStyle(() => {
    const lift = Math.max(0, keyboard.height.value - bottomOffset);
    const gap = keyboard.height.value > 0 ? keyboardGap : 0;
    return { paddingBottom: lift + gap };
  });

  const onShow = options.onKeyboardShow;

  useAnimatedReaction(
    () => keyboard.height.value,
    (height, previous) => {
      if (height > 0 && (previous ?? 0) === 0 && onShow) {
        runOnJS(onShow)();
      }
    },
    [onShow],
  );

  return style;
}
