import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { theme, profileStyles as styles } from '../../styles';

interface Props {
  icon: LucideIcon;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  state?: 'error' | 'ok' | null;
  /** Ícono al final cuando está bien (p. ej. coinciden) */
  trailing?: React.ReactNode;
}

/** Campo de contraseña con botón para mostrar u ocultar */
export const PasswordField: React.FC<Props> = ({ icon: Icon, value, onChangeText, placeholder, state, trailing }) => {
  const [visible, setVisible] = useState(false);
  return (
    <View style={[styles.inputRow, state === 'error' && styles.inputRowError, state === 'ok' && styles.inputRowOk]}>
      <Icon size={20} color={theme.colors.textMuted} strokeWidth={2.2} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.outline}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
      />
      {trailing}
      <TouchableOpacity
        onPress={() => setVisible((v) => !v)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {visible ? <EyeOff size={20} color={theme.colors.textMuted} /> : <Eye size={20} color={theme.colors.textMuted} />}
      </TouchableOpacity>
    </View>
  );
};

export default PasswordField;
