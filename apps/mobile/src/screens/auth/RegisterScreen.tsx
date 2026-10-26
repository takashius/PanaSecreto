import React, { useState, useEffect } from 'react';
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
  BackHandler,
} from 'react-native';
import { Alert } from '../../components/common/AppDialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  User,
  AtSign,
  Mail,
  Phone,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Camera,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Check,
  ArrowRight,
} from 'lucide-react-native';
import {
  theme,
  commonStyles,
  formStyles,
  buttonStyles,
  authStyles,
} from '../../styles';

import * as authApi from '../../api/auth';
import type { SessionPayload } from '../../api/auth';
import { ApiError, errorMessage, setAuthToken } from '../../api/client';
import { uploadProfilePhoto } from '../../api/profile';
import { choosePhotoSource } from '../../utils/pickImage';
import { signInWithGoogle } from '../../auth/google';
import { GoogleIcon } from '../../components/common/GoogleIcon';
import { MIN_PASSWORD } from '../../utils/password';
import { isValidEmail, newPasswordError, splitFullName, toInternationalPhone } from '../../utils/validation';
import { BRAND_ISOTIPO } from '../../constants/brand';

interface RegisterScreenProps {
  onNavigateToLogin?: () => void;
  onRegisterSuccess?: (session: SessionPayload) => void | Promise<void>;
  onOpenLegal?: (doc: 'terminos' | 'privacidad') => void;
}

export default function RegisterScreen({
  onNavigateToLogin,
  onRegisterSuccess,
  onOpenLegal,
}: RegisterScreenProps) {
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Estados de enfoque
  const [focusedField, setFocusedField] = useState<string | null>(null);
  /** Foto elegida antes de crear la cuenta: se sube justo después del registro */
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const busy = loading || googleLoading;
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Manejo del botón de atrás nativo de Android
  useEffect(() => {
    const onBackPress = () => {
      if (onNavigateToLogin) {
        onNavigateToLogin();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [onNavigateToLogin]);

  // Cálculo de fortaleza de contraseña
  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: '', color: theme.colors.textMuted };
    if (password.length < MIN_PASSWORD) {
      return { level: 1, label: 'Débil', color: theme.colors.danger };
    }
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasUpper = /[A-Z]/.test(password);

    if (password.length >= 8 && (hasNumbers || hasSpecial || hasUpper)) {
      return { level: 3, label: 'Fuerte', color: theme.colors.success };
    }
    return { level: 2, label: 'Media', color: '#FFBA49' };
  };

  const strength = getPasswordStrength();

  const handleRegister = async () => {
    const newErrors: Record<string, string> = {};
    const { name, lastName } = splitFullName(fullname);

    if (!name) {
      newErrors.fullname = 'Ingresa tu nombre y apellido.';
    }
    if (username.length > 30) {
      newErrors.username = 'El apodo puede tener máximo 30 caracteres.';
    }
    if (!isValidEmail(email)) {
      newErrors.email = 'Ingresa un correo electrónico válido.';
    }
    const passwordError = newPasswordError(password);
    if (passwordError) {
      newErrors.password = passwordError;
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }
    if (!acceptTerms) {
      newErrors.terms = 'Debes aceptar las reglas del juego para continuar.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const session = await authApi.register({
        name,
        lastName,
        nickname: username.trim() || undefined,
        email: email.trim().toLowerCase(),
        phone: toInternationalPhone(phone),
        password,
      });
      let finalSession = session;
      let photoFailed = false;
      if (photoUri) {
        // La subida necesita el token de la cuenta recién creada
        setAuthToken(session.token);
        try {
          finalSession = { ...session, ...(await uploadProfilePhoto(photoUri)) };
        } catch {
          photoFailed = true;
        }
      }
      await onRegisterSuccess?.(finalSession);
      if (photoFailed) {
        Alert.alert('Tu foto no se subió', 'Tu cuenta quedó lista. Puedes ponerte una foto luego desde tu perfil.');
      }
    } catch (error) {
      if (error instanceof ApiError && (error.code === 'EMAIL_TAKEN' || error.fields.email)) {
        setErrors({ email: error.message });
      } else if (error instanceof ApiError && Object.keys(error.fields).length > 0) {
        setErrors(error.fields);
      } else {
        Alert.alert('No pudimos crear tu cuenta', errorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const session = await signInWithGoogle();
      if (session) await onRegisterSuccess?.(session);
    } catch (error) {
      Alert.alert('Google', errorMessage(error));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.safeArea} edges={['top', 'bottom']}>
      {/* 1. Header con Botón de Retroceso y Marca */}
      <View style={authStyles.headerNav}>
        <View style={authStyles.headerNavLeft}>
          <TouchableOpacity
            style={authStyles.headerBackButton}
            onPress={onNavigateToLogin}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={22} color={theme.colors.textDark} />
          </TouchableOpacity>
          <Text style={authStyles.headerNavTitle}>Registro de Pana</Text>
        </View>

        <View style={commonStyles.rowCenter}>
          <Text style={authStyles.headerNavBrand}>
            Entre<Text style={authStyles.headerNavBrandAccent}>Panas</Text>
          </Text>
        </View>
      </View>

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
          {/* 2. Avatar con Mascota (Guacamaya) y Botón de Foto */}
          <View style={authStyles.registerAvatarWrapper}>
            <Image
              source={photoUri ? { uri: photoUri } : BRAND_ISOTIPO}
              style={[authStyles.registerAvatarImage, photoUri ? authStyles.registerAvatarPhoto : null]}
            />
            <TouchableOpacity
              style={authStyles.cameraBadge}
              onPress={() => choosePhotoSource([1, 1], setPhotoUri, photoUri ? () => setPhotoUri(null) : undefined)}
              activeOpacity={0.8}
              accessibilityLabel="Elegir foto de perfil"
            >
              <Camera size={16} color={theme.colors.onSecondaryContainer} />
            </TouchableOpacity>
          </View>

          {/* Título de Bienvenida */}
          <Text style={authStyles.registerHeading}>Únete al bonche 🦜🎉</Text>
          <Text style={authStyles.registerSubheading}>
            Crea tu cuenta en 1 minuto y empieza a organizar tus sorteos de amigo secreto.
          </Text>

          {/* 3. Tarjeta Blanca del Formulario de Registro */}
          <View style={[authStyles.card, { marginTop: theme.spacing.md }]}>
            {/* Campo: Nombre y Apellido */}
            <View style={formStyles.formGroup}>
              <View style={formStyles.labelRow}>
                <Text style={formStyles.label}>Nombre y Apellido</Text>
              </View>
              <View
                collapsable={false}
                style={[
                  formStyles.inputWrapper,
                  focusedField === 'fullname' && formStyles.inputWrapperFocused,
                  !!errors.fullname && formStyles.inputWrapperError,
                ]}
              >
                <User
                  size={19}
                  color={
                    focusedField === 'fullname'
                      ? theme.colors.primary
                      : theme.colors.outline
                  }
                  style={formStyles.inputIcon}
                />
                <TextInput
                  style={formStyles.inputField}
                  placeholder="Carlos Gómez"
                  placeholderTextColor={theme.colors.outline}
                  value={fullname}
                  onChangeText={(val) => {
                    setFullname(val);
                    if (errors.fullname) setErrors((prev) => ({ ...prev, fullname: '' }));
                  }}
                  onFocus={() => setFocusedField('fullname')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="words"
                />
              </View>
              {errors.fullname ? (
                <Text style={formStyles.errorText}>{errors.fullname}</Text>
              ) : null}
            </View>

            {/* Campo: Nombre de Pana (Usuario) */}
            <View style={formStyles.formGroup}>
              <View style={formStyles.labelRow}>
                <Text style={formStyles.label}>Apodo</Text>
                <Text style={formStyles.labelHint}>Opcional · así te ven tus panas</Text>
              </View>
              <View
                collapsable={false}
                style={[
                  formStyles.inputWrapper,
                  focusedField === 'username' && formStyles.inputWrapperFocused,
                  !!errors.username && formStyles.inputWrapperError,
                ]}
              >
                <AtSign
                  size={19}
                  color={
                    focusedField === 'username'
                      ? theme.colors.primary
                      : theme.colors.outline
                  }
                  style={formStyles.inputIcon}
                />
                <TextInput
                  style={formStyles.inputField}
                  placeholder="Carlitos"
                  placeholderTextColor={theme.colors.outline}
                  value={username}
                  maxLength={30}
                  onChangeText={(val) => {
                    setUsername(val.replace(/^@/, ''));
                    if (errors.username) setErrors((prev) => ({ ...prev, username: '' }));
                  }}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
              {errors.username ? (
                <Text style={formStyles.errorText}>{errors.username}</Text>
              ) : null}
            </View>

            {/* Campo: Correo Electrónico */}
            <View style={formStyles.formGroup}>
              <View style={formStyles.labelRow}>
                <Text style={formStyles.label}>Correo Electrónico</Text>
              </View>
              <View
                collapsable={false}
                style={[
                  formStyles.inputWrapper,
                  focusedField === 'email' && formStyles.inputWrapperFocused,
                  !!errors.email && formStyles.inputWrapperError,
                ]}
              >
                <Mail
                  size={19}
                  color={
                    focusedField === 'email'
                      ? theme.colors.primary
                      : theme.colors.outline
                  }
                  style={formStyles.inputIcon}
                />
                <TextInput
                  style={formStyles.inputField}
                  placeholder="tu@correo.com"
                  placeholderTextColor={theme.colors.outline}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                />
              </View>
              {errors.email ? (
                <Text style={formStyles.errorText}>{errors.email}</Text>
              ) : null}
            </View>

            {/* Campo: Teléfono Móvil con Selector de Prefijo */}
            <View style={formStyles.formGroup}>
              <View style={formStyles.labelRow}>
                <Text style={formStyles.label}>Teléfono móvil</Text>
                <Text style={formStyles.labelHintHighlight}>
                  Para avisos por WhatsApp
                </Text>
              </View>
              <View style={formStyles.phoneRow}>
                <TouchableOpacity
                  style={formStyles.prefixPill}
                  activeOpacity={0.8}
                  onPress={() =>
                    Alert.alert('Prefijo', 'Actualmente configurado para Venezuela (+58).')
                  }
                >
                  <Text style={formStyles.prefixText}>🇻🇪 +58</Text>
                  <ChevronDown size={16} color={theme.colors.textMuted} />
                </TouchableOpacity>

                <View
                  collapsable={false}
                  style={[
                    formStyles.inputWrapper,
                    formStyles.phoneInputWrapper,
                    focusedField === 'phone' && formStyles.inputWrapperFocused,
                  ]}
                >
                  <Phone
                    size={18}
                    color={
                      focusedField === 'phone'
                        ? theme.colors.primary
                        : theme.colors.outline
                    }
                    style={formStyles.inputIcon}
                  />
                  <TextInput
                    style={formStyles.inputField}
                    placeholder="412 123 4567"
                    placeholderTextColor={theme.colors.outline}
                    value={phone}
                    onChangeText={(val) => setPhone(val.replace(/[^\d\s]/g, ''))}
                    maxLength={14}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>

            {/* Campo: Contraseña Secreta con Medidor */}
            <View style={formStyles.formGroup}>
              <View style={formStyles.labelRow}>
                <Text style={formStyles.label}>Contraseña secreta</Text>
              </View>
              <View
                collapsable={false}
                style={[
                  formStyles.inputWrapper,
                  focusedField === 'password' && formStyles.inputWrapperFocused,
                  !!errors.password && formStyles.inputWrapperError,
                ]}
              >
                <Lock
                  size={19}
                  color={
                    focusedField === 'password'
                      ? theme.colors.primary
                      : theme.colors.outline
                  }
                  style={formStyles.inputIcon}
                />
                <TextInput
                  style={formStyles.inputField}
                  placeholder={`Mínimo ${MIN_PASSWORD} caracteres y un número`}
                  placeholderTextColor={theme.colors.outline}
                  value={password}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
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

              {/* Medidor visual de fortaleza */}
              {password.length > 0 && (
                <View style={formStyles.strengthContainer}>
                  <View
                    style={[
                      formStyles.strengthBar,
                      strength.level >= 1 &&
                        (strength.level === 1
                           ? formStyles.strengthBarWeak
                           : strength.level === 2
                           ? formStyles.strengthBarMedium
                           : formStyles.strengthBarStrong),
                    ]}
                  />
                  <View
                    style={[
                      formStyles.strengthBar,
                      strength.level >= 2 &&
                        (strength.level === 2
                           ? formStyles.strengthBarMedium
                           : formStyles.strengthBarStrong),
                    ]}
                  />
                  <View
                    style={[
                      formStyles.strengthBar,
                      strength.level >= 3 && formStyles.strengthBarStrong,
                    ]}
                  />
                  <Text style={[formStyles.strengthLabel, { color: strength.color }]}>
                    {strength.label}
                  </Text>
                </View>
              )}

              {errors.password ? (
                <Text style={formStyles.errorText}>{errors.password}</Text>
              ) : null}
            </View>

            {/* Campo: Confirmar Contraseña */}
            <View style={formStyles.formGroup}>
              <View style={formStyles.labelRow}>
                <Text style={formStyles.label}>Confirmar Contraseña</Text>
              </View>
              <View
                collapsable={false}
                style={[
                  formStyles.inputWrapper,
                  focusedField === 'confirmPassword' && formStyles.inputWrapperFocused,
                  !!errors.confirmPassword && formStyles.inputWrapperError,
                ]}
              >
                <KeyRound
                  size={19}
                  color={
                    focusedField === 'confirmPassword'
                      ? theme.colors.primary
                      : theme.colors.outline
                  }
                  style={formStyles.inputIcon}
                />
                <TextInput
                  style={formStyles.inputField}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.outline}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (errors.confirmPassword)
                      setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={formStyles.toggleEyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} color={theme.colors.outline} />
                  ) : (
                    <Eye size={19} color={theme.colors.outline} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? (
                <Text style={formStyles.errorText}>{errors.confirmPassword}</Text>
              ) : null}
            </View>

            {/* Mini Banner de Confidencialidad */}
            <View style={formStyles.confidentialCard}>
              <View style={formStyles.confidentialBadge}>
                <ShieldCheck size={20} color={theme.colors.secondaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={formStyles.confidentialTitle}>
                  Totalmente Confidencial
                </Text>
                <Text style={formStyles.confidentialSubtitle}>
                  Nadie sabrá a quién le toca hasta el sorteo.
                </Text>
              </View>
            </View>

            {/* Casilla de Términos y Condiciones */}
            <TouchableOpacity
              style={formStyles.termsRow}
              onPress={() => {
                setAcceptTerms(!acceptTerms);
                if (errors.terms) setErrors((prev) => ({ ...prev, terms: '' }));
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  formStyles.checkbox,
                  acceptTerms && formStyles.checkboxActive,
                ]}
              >
                {acceptTerms && <Check size={14} color={theme.colors.onSecondaryContainer} />}
              </View>
              <Text style={formStyles.termsText}>
                Acepto las{' '}
                <Text style={formStyles.termsLink} onPress={() => onOpenLegal?.('terminos')} suppressHighlighting>
                  reglas del juego
                </Text>{' '}
                y la{' '}
                <Text style={formStyles.termsLink} onPress={() => onOpenLegal?.('privacidad')} suppressHighlighting>
                  política de privacidad
                </Text>{' '}
                de EntrePanas.
              </Text>
            </TouchableOpacity>
            {errors.terms ? (
              <Text style={formStyles.errorText}>{errors.terms}</Text>
            ) : null}

            {/* Botón Principal: Crear mi Cuenta de Pana */}
            <TouchableOpacity
              style={[buttonStyles.btnPrimary, { marginTop: theme.spacing.md }]}
              onPress={() => void handleRegister()}
              disabled={busy}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.onSecondaryContainer} size="small" />
              ) : (
                <View style={commonStyles.rowCenter}>
                  <Text style={buttonStyles.btnPrimaryText}>
                    Crear mi Cuenta de Pana
                  </Text>
                  <ArrowRight size={20} color={theme.colors.onSecondaryContainer} />
                </View>
              )}
            </TouchableOpacity>

            {/* Registro con Google */}
            <View style={commonStyles.dividerRow}>
              <View style={commonStyles.dividerLine} />
              <Text style={commonStyles.dividerText}>O regístrate con</Text>
              <View style={commonStyles.dividerLine} />
            </View>
            <TouchableOpacity
              style={[buttonStyles.btnGoogle, busy && { opacity: 0.6 }]}
              onPress={() => void handleGoogle()}
              disabled={busy}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Continuar con Google"
            >
              {googleLoading ? <ActivityIndicator color={theme.colors.primary} size="small" /> : <GoogleIcon size={20} />}
              <Text style={buttonStyles.btnGoogleText}>
                {googleLoading ? 'Conectando con Google…' : 'Continuar con Google'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 4. Enlace al Login */}
          <View style={buttonStyles.footerRow}>
            <Text style={buttonStyles.footerPrompt}>¿Ya tienes cuenta de pana?</Text>
            <TouchableOpacity
              onPress={onNavigateToLogin}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <View style={commonStyles.rowCenter}>
                <Text style={buttonStyles.footerLink}>Inicia sesión aquí</Text>
                <ChevronRight size={16} color={theme.colors.secondaryDark} />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
