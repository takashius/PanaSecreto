import React, { useSyncExternalStore } from 'react';
import { Modal, View, Text, TouchableOpacity, Image } from 'react-native';
import { TriangleAlert } from 'lucide-react-native';
import { theme, dialogStyles as styles } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';

/** Mismo formato que los botones de Alert de React Native */
export interface DialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface DialogRequest {
  id: number;
  title: string;
  message?: string;
  buttons: DialogButton[];
}

// Cola global: si un botón abre otro diálogo, se muestra al cerrarse el actual
let queue: DialogRequest[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getCurrent = () => queue[0] ?? null;

/**
 * Reemplazo de `Alert` de React Native con el diseño de EntrePanas.
 * Misma firma: `Alert.alert(título, mensaje?, botones?)`. Requiere `<AppDialogHost />` montado en App.tsx.
 */
export const Alert = {
  alert(title: string, message?: string, buttons?: DialogButton[]): void {
    queue = [...queue, { id: nextId++, title, message, buttons: buttons?.length ? buttons : [{ text: 'Entendido' }] }];
    emit();
  },
};

const close = (onPress?: () => void) => {
  queue = queue.slice(1);
  emit();
  // Se ejecuta después de cerrar, así un diálogo encadenado entra a la cola sin pisarse
  if (onPress) setTimeout(onPress, 0);
};

/** Host único de los diálogos; se monta una vez en la raíz de la app */
export const AppDialogHost: React.FC = () => {
  const current = useSyncExternalStore(subscribe, getCurrent, getCurrent);
  if (!current) return null;

  const { buttons } = current;
  // Ícono de advertencia solo en confirmaciones destructivas (no en menús de opciones)
  const destructive = buttons.length <= 2 && buttons.some((b) => b.style === 'destructive');
  const cancel = buttons.find((b) => b.style === 'cancel');
  // Hasta 2 botones van en fila (cancelar a la izquierda); con más, se apilan
  const ordered = buttons.length <= 2 ? [...buttons.filter((b) => b.style === 'cancel'), ...buttons.filter((b) => b.style !== 'cancel')] : buttons;
  const stacked = buttons.length > 2 || buttons.some((b) => b.text.length > 18);

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={() => cancel && close(cancel.onPress)}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityRole="alert">
          {destructive ? (
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.dangerContainer }]}>
              <TriangleAlert size={30} color={theme.colors.danger} strokeWidth={2.2} />
            </View>
          ) : (
            <Image source={BRAND_ISOTIPO} style={styles.mascot} />
          )}
          <Text style={styles.title}>{current.title}</Text>
          {!!current.message && <Text style={styles.message}>{current.message}</Text>}
          <View style={stacked ? styles.buttonsColumn : styles.buttonsRow}>
            {ordered.map((b, i) => {
              const kind = b.style === 'cancel' ? 'cancel' : b.style === 'destructive' ? 'destructive' : 'primary';
              return (
                <TouchableOpacity
                  key={`${current.id}-${i}`}
                  style={[
                    styles.button,
                    stacked && styles.buttonStacked,
                    kind === 'primary' && styles.buttonPrimary,
                    kind === 'cancel' && styles.buttonCancel,
                    kind === 'destructive' && styles.buttonDestructive,
                  ]}
                  onPress={() => close(b.onPress)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.buttonText,
                      kind === 'cancel' && styles.buttonTextCancel,
                      kind === 'destructive' && styles.buttonTextDestructive,
                    ]}
                  >
                    {b.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AppDialogHost;
