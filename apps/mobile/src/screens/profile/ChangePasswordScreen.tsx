import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Alert } from '../../components/common/AppDialog';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Shield, KeyRound, RotateCcw, CircleCheck, CheckCheck, ShieldCheck } from 'lucide-react-native';
import { theme, profileStyles as styles } from '../../styles';
import { PasswordField } from '../../components/profile/PasswordField';
import { MIN_PASSWORD, passwordStrength } from '../../utils/password';

interface ChangePasswordScreenProps {
  onDone: () => void;
  onCancel: () => void;
}

const STRENGTH_COLORS = [theme.colors.surfaceContainerHigh, theme.colors.danger, theme.colors.secondary, theme.colors.success];

/** Cambiar contraseña: actual, nueva (con medidor de fuerza) y confirmación */
export const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ onDone, onCancel }) => {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const strength = passwordStrength(next);
  const color = STRENGTH_COLORS[strength.level];
  const matches = confirm.length > 0 && confirm === next;
  const errors = {
    current: !current ? 'Escribe tu contraseña actual.' : null,
    next:
      next.length < MIN_PASSWORD
        ? `La nueva contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`
        : next === current
          ? 'La nueva contraseña debe ser distinta de la actual.'
          : null,
    confirm: confirm !== next ? 'Las contraseñas no coinciden.' : null,
  };
  const valid = !errors.current && !errors.next && !errors.confirm;

  const handleSave = () => {
    setSubmitted(true);
    if (!valid) return;
    // Al conectar la API: POST /api/user/change-password { oldPassword, newPassword }; si la actual no coincide, el backend responde 400
    Alert.alert('¡Clave actualizada! 🔐', 'Tu contraseña se cambió finísimo. Úsala la próxima vez que inicies sesión.', [
      { text: 'Chévere', onPress: onDone },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.formHeader}>
        <TouchableOpacity style={styles.headerButton} onPress={onCancel} accessibilityLabel="Volver">
          <ArrowLeft size={22} color={theme.colors.primary} strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={styles.formHeaderCenter}>
          <Text style={styles.formEyebrow}>EntrePanas</Text>
          <Text style={styles.formTitle}>Cambiar contraseña</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView behavior="padding" enabled={Platform.OS === 'ios'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            <View style={styles.formCardHeader}>
              <View style={[styles.formCardIcon, { backgroundColor: theme.colors.accentContainer }]}>
                <Shield size={18} color={theme.colors.accentDark} strokeWidth={2.4} />
              </View>
              <Text style={styles.formCardTitle}>Seguridad</Text>
            </View>
            <Text style={styles.helperText}>Actualiza tu contraseña para mantener protegidos tus deseos y tu sobre secreto.</Text>

            <Text style={styles.fieldLabel}>Contraseña actual</Text>
            <PasswordField
              icon={KeyRound}
              value={current}
              onChangeText={setCurrent}
              placeholder="Tu contraseña de hoy"
              state={submitted && errors.current ? 'error' : null}
            />
            {submitted && errors.current && <Text style={styles.errorText}>{errors.current}</Text>}

            <Text style={styles.fieldLabel}>Nueva contraseña</Text>
            <PasswordField
              icon={RotateCcw}
              value={next}
              onChangeText={setNext}
              placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
              state={submitted && errors.next ? 'error' : null}
            />
            <View style={styles.strengthBox}>
              <View style={styles.strengthTop}>
                <Text style={styles.strengthLabel}>Fuerza de la clave:</Text>
                {strength.level > 0 && (
                  <View style={[styles.strengthChip, { borderColor: color }]}>
                    <Text style={[styles.strengthChipText, { color: strength.level === 2 ? theme.colors.secondaryDark : color }]}>
                      {strength.label}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.strengthBars}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={[styles.strengthBar, strength.level >= i && { backgroundColor: color }]} />
                ))}
              </View>
              <Text style={styles.helperText}>{strength.hint}</Text>
            </View>
            {submitted && errors.next && <Text style={styles.errorText}>{errors.next}</Text>}

            <Text style={styles.fieldLabel}>Confirmar nueva contraseña</Text>
            <PasswordField
              icon={CircleCheck}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repite la nueva contraseña"
              state={matches ? 'ok' : submitted && errors.confirm ? 'error' : null}
              trailing={matches ? <CircleCheck size={20} color={theme.colors.success} /> : null}
            />
            {matches ? (
              <View style={styles.helper}>
                <CheckCheck size={16} color={theme.colors.success} />
                <Text style={styles.okText}>Las contraseñas coinciden perfectamente</Text>
              </View>
            ) : (
              submitted && errors.confirm && <Text style={styles.errorText}>{errors.confirm}</Text>
            )}
          </View>

          <View style={styles.readonlyNote}>
            <ShieldCheck size={16} color={theme.colors.primary} strokeWidth={2.2} />
            <Text style={styles.helperText}>Tu sesión sigue abierta en este teléfono y se cierra en los demás dispositivos.</Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
            <CircleCheck size={22} color={theme.colors.primary} strokeWidth={2.4} />
            <Text style={styles.saveButtonText}>Cambiar contraseña</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancelar y volver al perfil</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;
