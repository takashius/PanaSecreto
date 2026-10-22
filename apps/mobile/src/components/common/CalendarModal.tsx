import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { theme, dialogStyles as styles } from '../../styles';

const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

interface Props {
  visible: boolean;
  /** Fecha seleccionada al abrir */
  value?: Date | null;
  /** No se pueden elegir días anteriores (por defecto, hoy) */
  minDate?: Date;
  title?: string;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

/** Calendario mensual en español (semana de lunes a domingo) con el estilo de la app */
export const CalendarModal: React.FC<Props> = ({ visible, value, minDate, title = 'Fecha del intercambio', onConfirm, onCancel }) => {
  const [today] = useState(() => startOfDay(new Date()));
  const min = startOfDay(minDate ?? today);
  const initial = value ? startOfDay(value) : null;
  const [selected, setSelected] = useState<Date | null>(initial);
  const [month, setMonth] = useState(() => {
    const base = initial ?? min;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7; // lunes = 0
  const cells: Array<Date | null> = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];
  const canGoBack = new Date(month.getFullYear(), month.getMonth(), 0) >= new Date(min.getFullYear(), min.getMonth(), 1);
  const rawMonth = month.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' });
  const monthLabel = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);
  const moveMonth = (delta: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.calHeader}>
            <TouchableOpacity
              style={[styles.calNav, !canGoBack && { opacity: 0.3 }]}
              onPress={() => moveMonth(-1)}
              disabled={!canGoBack}
              accessibilityLabel="Mes anterior"
            >
              <ChevronLeft size={22} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.calMonth}>{monthLabel}</Text>
            <TouchableOpacity style={styles.calNav} onPress={() => moveMonth(1)} accessibilityLabel="Mes siguiente">
              <ChevronRight size={22} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.calWeek}>
            {WEEK_DAYS.map((d, i) => (
              <Text key={i} style={styles.calWeekDay}>
                {d}
              </Text>
            ))}
          </View>
          <View style={styles.calGrid}>
            {cells.map((d, i) => {
              if (!d) return <View key={`e${i}`} style={styles.calCell} />;
              const disabled = d < min;
              const isSelected = !!selected && sameDay(d, selected);
              const isToday = sameDay(d, today);
              return (
                <TouchableOpacity
                  key={d.toISOString()}
                  style={styles.calCell}
                  onPress={() => setSelected(d)}
                  disabled={disabled}
                  accessibilityLabel={d.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}
                  accessibilityState={{ selected: isSelected, disabled }}
                >
                  <View style={[styles.calDay, isToday && styles.calDayToday, isSelected && styles.calDaySelected]}>
                    <Text style={[styles.calDayText, disabled && styles.calDayTextDisabled, isSelected && styles.calDayTextSelected]}>
                      {d.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.calSelectedLabel}>
            {selected ? selected.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Elige un día'}
          </Text>

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={onCancel}>
              <Text style={[styles.buttonText, styles.buttonTextCancel]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, !selected && { opacity: 0.5 }]}
              onPress={() => selected && onConfirm(selected)}
              disabled={!selected}
            >
              <Text style={styles.buttonText}>Elegir fecha</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CalendarModal;
