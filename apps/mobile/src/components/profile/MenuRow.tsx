import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { theme, profileStyles as styles } from '../../styles';

interface Props {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  divider?: boolean;
  onPress?: () => void;
  /** Si viene, la fila muestra un interruptor en lugar de la flecha */
  value?: boolean;
  onValueChange?: (v: boolean) => void;
}

/** Fila de opción del perfil: ícono, título, subtítulo y flecha o interruptor */
export const MenuRow: React.FC<Props> = ({ icon: Icon, title, subtitle, divider, onPress, value, onValueChange }) => {
  const isSwitch = typeof value === 'boolean';
  const content = (
    <>
      <View style={styles.menuIcon}>
        <Icon size={20} color={theme.colors.primary} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {isSwitch ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: theme.colors.surfaceContainerHigh, true: theme.colors.secondary }}
          thumbColor={theme.colors.white}
          ios_backgroundColor={theme.colors.surfaceContainerHigh}
        />
      ) : (
        <ChevronRight size={20} color={theme.colors.textMuted} />
      )}
    </>
  );

  if (isSwitch) {
    return (
      <View style={[styles.menuRow, divider && styles.menuDivider]} accessibilityRole="switch" accessibilityState={{ checked: value }}>
        {content}
      </View>
    );
  }
  return (
    <TouchableOpacity style={[styles.menuRow, divider && styles.menuDivider]} onPress={onPress} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  );
};

export default MenuRow;
