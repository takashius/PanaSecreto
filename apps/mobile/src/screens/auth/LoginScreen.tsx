import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Alert } from '../../components/common/AppDialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Check, Fingerprint } from 'lucide-react-native';
import * as authApi from '../../api/auth';
import type { SessionPayload } from '../../api/auth';
import { ApiError, errorMessage } from '../../api/client';
import {
  canUseBiometrics,
  getEnrolledEmail,
  offerBiometricAfterLogin,
  promptBiometric,
  readBiometricSecret,
} from '../../auth/biometrics';
import { loadRememberedEmail, saveRememberedEmail } from '../../auth/storage';
import { isValidEmail } from '../../utils/validation';
import {
  theme,
  commonStyles,
  formStyles,
  buttonStyles,
  authStyles,
} from '../../styles';
import { BRAND_LOGO } from '../../constants/brand';

interface LoginScreenProps {
  onNavigateToRegister?: () => void;
  onNavigateToRecoverPassword?: () => void;
  onLoginSuccess?: (session: SessionPayload) => void | Promise<void>;
  /** Aviso arriba del formulario (p. ej. "Tu sesión expiró") */
  notice?: string | null;
}

export default function LoginScreen({
  onNavigateToRegister,
  onNavigateToRecoverPassword,
  onLoginSuccess,
  notice,
}: LoginScreenProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocusedIdentifier, setIsFocusedIdentifier] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [enrolledEmail, setEnrolledEmail] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);
  const busy = loading;
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

  const emailNorm = identifier.trim().toLowerCase();
  const showBiometric =
    biometricAvailable && Boolean(enrolledEmail) && emailNorm.length > 0 && emailNorm === enrolledEmail;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [available, enrolled, saved] = await Promise.all([
        canUseBiometrics(),
        getEnrolledEmail(),
        loadRememberedEmail(),
      ]);
      if (cancelled) return;
      setBiometricAvailable(available);
      setEnrolledEmail(enrolled);
      if (saved) {
        setIdentifier(saved);
        setRememberEmail(true);
        requestAnimationFrame(() => passwordRef.current?.focus());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const finishLogin = async (session: SessionPayload, email: string, plainPassword: string) => {
    await onLoginSuccess?.(session);
    offerBiometricAfterLogin(email, plainPassword);
  };

  const handleLogin = async () => {
    const newErrors: { identifier?: string; password?: string } = {};
    const email = identifier.trim().toLowerCase();

    if (!email) {
      newErrors.identifier = 'Por favor ingresa tu correo.';
    } else if (!isValidEmail(email)) {
      newErrors.identifier = 'Ese correo no se ve bien. Revísalo.';
    }
    if (!password) {
      newErrors.password = 'Por favor ingresa tu contraseña.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await saveRememberedEmail(rememberEmail ? email : null);
      const session = await authApi.login(email, password);
      await finishLogin(session, email, password);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'INVALID_CREDENTIALS') {
        setErrors({ password: 'Correo o contraseña incorrectos.' });
      } else if (error instanceof ApiError && error.status === 400 && !error.code) {
        setErrors({ password: error.message });
      } else {
        Alert.alert('No pudimos iniciar sesión', errorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (busy) return;
    const confirmed = await promptBiometric('Entra a EntrePanas con huella o Face ID');
    if (!confirmed) return;
    const secret = await readBiometricSecret();
    if (!secret) return;

    setLoading(true);
    try {
      const session = await authApi.login(secret.email, secret.password);
      setIdentifier(secret.email);
      await saveRememberedEmail(rememberEmail ? secret.email : null);
      await finishLogin(session, secret.email, secret.password);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'INVALID_CREDENTIALS') {
        Alert.alert(
          'No pudimos entrar',
          'Tu contraseña cambió o ya no es válida. Entra con tu correo y contraseña.'
        );
      } else {
        Alert.alert('No pudimos iniciar sesión', errorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={commonStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={authStyles.headerSection}>
            <Image
              source={BRAND_LOGO}
              style={authStyles.brandLogo}
              accessibilityLabel="EntrePanas · Conecta, comparte, disfruta"
            />

            <Text style={authStyles.tagline}>
              ¡Epa! Inicia sesión para descubrir a tu amigo secreto y armar la parranda.
            </Text>
          </View>

          <View style={authStyles.card}>
            {notice ? (
              <View style={authStyles.noticeBanner} accessibilityRole="alert">
                <Text style={authStyles.noticeText}>{notice}</Text>
              </View>
            ) : null}

            <View style={formStyles.formGroup}>
              <View style={formStyles.labelRow}>
                <Text style={formStyles.label}>Correo electrónico</Text>
              </View>

              <View
                collapsable={false}
                style={[
                  formStyles.inputWrapper,
                  isFocusedIdentifier && formStyles.inputWrapperFocused,
                  !!errors.identifier && formStyles.inputWrapperError,
                ]}
              >
                <Mail
                  size={19}
                  color={isFocusedIdentifier ? theme.colors.primary : theme.colors.outline}
                  style={formStyles.inputIcon}
                />
                <TextInput
                  style={formStyles.inputField}
                  placeholder="ej. pana@correo.com"
                  placeholderTextColor={theme.colors.outline}
                  value={identifier}
                  onChangeText={(val) => {
                    setIdentifier(val);
                    if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: undefined }));
                  }}
                  onFocus={() => setIsFocusedIdentifier(true)}
                  onBlur={() => setIsFocusedIdentifier(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="username"
                  returnKeyType="next"
                  editable={!busy}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
              {errors.identifier && <Text style={formStyles.errorText}>{errors.identifier}</Text>}
            </View>

            <View style={formStyles.formGroup}>
              <View style={formStyles.labelRow}>
                <Text style={formStyles.label}>Contraseña</Text>
              </View>

              <View
                collapsable={false}
                style={[
                  formStyles.inputWrapper,
                  isFocusedPassword && formStyles.inputWrapperFocused,
                  !!errors.password && formStyles.inputWrapperError,
                ]}
              >
                <Lock
                  size={19}
                  color={isFocusedPassword ? theme.colors.primary : theme.colors.outline}
                  style={formStyles.inputIcon}
                />
                <TextInput
                  ref={passwordRef}
                  style={formStyles.inputField}
                  placeholder="••••••••••••"
                  placeholderTextColor={theme.colors.outline}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  onFocus={() => setIsFocusedPassword(true)}
                  onBlur={() => setIsFocusedPassword(false)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={() => void handleLogin()}
                  editable={!busy}
                />
                <TouchableOpacity
                  style={formStyles.toggleEyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword ? (
                    <EyeOff size={19} color={theme.colors.outline} />
                  ) : (
                    <Eye size={19} color={theme.colors.outline} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={formStyles.errorText}>{errors.password}</Text>}

              <View style={authStyles.loginOptionsRow}>
                <TouchableOpacity
                  style={authStyles.rememberRow}
                  onPress={() => setRememberEmail((v) => !v)}
                  activeOpacity={0.8}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberEmail }}
                >
                  <View style={[formStyles.checkbox, rememberEmail && formStyles.checkboxActive]}>
                    {rememberEmail && <Check size={14} color={theme.colors.onSecondaryContainer} />}
                  </View>
                  <Text style={authStyles.rememberLabel}>Recordar usuario</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onNavigateToRecoverPassword}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={formStyles.forgotPasswordLink}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={authStyles.loginActionsRow}>
              <TouchableOpacity
                style={[buttonStyles.btnPrimary, authStyles.loginButtonFlex]}
                onPress={() => void handleLogin()}
                disabled={busy}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.onSecondaryContainer} size="small" />
                ) : (
                  <View style={commonStyles.rowCenter}>
                    <Text style={buttonStyles.btnPrimaryText}>Entrar al Intercambio</Text>
                    <Text style={buttonStyles.btnPrimaryEmoji}>🎁</Text>
                  </View>
                )}
              </TouchableOpacity>
              {showBiometric ? (
                <TouchableOpacity
                  style={[authStyles.biometricButton, busy && authStyles.biometricButtonDisabled]}
                  onPress={() => void handleBiometricLogin()}
                  disabled={busy}
                  accessibilityLabel="Entrar con huella o Face ID"
                  activeOpacity={0.85}
                >
                  <Fingerprint size={26} color={theme.colors.white} strokeWidth={2.2} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={buttonStyles.footerRow}>
            <Text style={buttonStyles.footerPrompt}>¿Aún no eres parte?</Text>
            <TouchableOpacity
              onPress={onNavigateToRegister}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={buttonStyles.footerLink}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>

          <View style={commonStyles.badgeContainer}>
            <ShieldCheck size={16} color={theme.colors.secondaryDark} />
            <Text style={commonStyles.badgeText}>Anonimato 100% garantizado en cada sorteo</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
