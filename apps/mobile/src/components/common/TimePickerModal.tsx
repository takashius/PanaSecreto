import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { theme, dialogStyles as styles } from '../../styles';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const ITEM = 48; // alto de cada opción + separación, para centrar la seleccionada

interface Props {
  visible: boolean;
  /** Hora inicial en 24 h */
  hours: number;
  minutes: number;
  title?: string;
  onConfirm: (hours24: number, minutes: number) => void;
  onCancel: () => void;
}

/** Selector de hora en columnas (hora · minutos de 5 en 5 · AM/PM) */
export const TimePickerModal: React.FC<Props> = ({ visible, hours, minutes, title = 'Hora del intercambio', onConfirm, onCancel }) => {
  const [h12, setH12] = useState(hours % 12 || 12);
  const [min, setMin] = useState(Math.round(minutes / 5) * 5 === 60 ? 55 : Math.round(minutes / 5) * 5);
  const [pm, setPm] = useState(hours >= 12);

  const to24 = () => (h12 % 12) + (pm ? 12 : 0);
  const pad = (n: number) => String(n).padStart(2, '0');

  const column = <T extends number | string>(items: T[], selected: T, onSelect: (v: T) => void, label: (v: T) => string) => (
    <ScrollView
      style={styles.timeColumn}
      contentContainerStyle={styles.timeColumnContent}
      showsVerticalScrollIndicator={false}
      // Al abrir, deja la opción elegida a la vista
      ref={(ref) => {
        if (ref) setTimeout(() => ref.scrollTo({ y: Math.max(0, items.indexOf(selected) * ITEM - ITEM * 2), animated: false }), 0);
      }}
    >
      {items.map((v) => {
        const active = v === selected;
        return (
          <TouchableOpacity key={String(v)} style={[styles.timeItem, active && styles.timeItemActive]} onPress={() => onSelect(v)}>
            <Text style={[styles.timeItemText, active && styles.timeItemTextActive]}>{label(v)}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.timePreview}>
            {h12}:{pad(min)} <Text style={{ color: theme.colors.secondaryDark }}>{pm ? 'PM' : 'AM'}</Text>
          </Text>
          <View style={styles.timeLabels}>
            <Text style={styles.timeLabel}>HORA</Text>
            <Text style={styles.timeLabel}>MINUTOS</Text>
            <Text style={styles.timeLabel}>AM / PM</Text>
          </View>
          <View style={styles.timeColumns}>
            {column(HOURS, h12, setH12, (v) => String(v))}
            {column(MINUTES, min, setMin, (v) => pad(v))}
            {column(['AM', 'PM'], pm ? 'PM' : 'AM', (v) => setPm(v === 'PM'), (v) => v)}
          </View>
          <View style={styles.buttonsRow}>
            <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={onCancel}>
              <Text style={[styles.buttonText, styles.buttonTextCancel]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={() => onConfirm(to24(), min)}>
              <Text style={styles.buttonText}>Elegir hora</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default TimePickerModal;
