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
  Alert,
  Image,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Mail,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Info,
  ArrowRight,
  Edit2,
  ChevronRight,
} from 'lucide-react-native';
import {
  theme,
  commonStyles,
  formStyles,
  buttonStyles,
  authStyles,
} from '../../styles';
import { InputOTP } from '../../components/common/InputOtp';

interface RecoverPasswordScreenProps {
  onNavigateToLogin?: () => void;
  onRecoverySuccess?: () => void;
}

export default function RecoverPasswordScreen({
  onNavigateToLogin,
  onRecoverySuccess,
}: RecoverPasswordScreenProps) {
  // Manejo de Pasos: 1 (Identificación) | 2 (Verificación de Código y Nueva Clave)
  const [step, setStep] = useState<1 | 2>(1);

  // Campos Paso 1
  const [email, setEmail] = useState('');
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Campos Paso 2
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});

  // Temporizador para Reenvío de Código en Paso 2
  const [resendTimer, setResendTimer] = useState(45);
  const [loading, setLoading] = useState(false);

  // Manejo del botón de atrás nativo de Android
  useEffect(() => {
    const onBackPress = () => {
      if (step === 2) {
        setStep(1);
        return true;
      }
      if (onNavigateToLogin) {
        onNavigateToLogin();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [step, onNavigateToLogin]);

  useEffect(() => {
    let interval: any = null;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  // Función para enmascarar el correo
  const getMaskedEmail = (rawEmail: string) => {
    if (!rawEmail || !rawEmail.includes('@')) return rawEmail;
    const [user, domain] = rawEmail.split('@');
    if (user.length <= 2) return `${user}****@${domain}`;
    return `${user.slice(0, 3)}****@${domain}`;
  };

  // Validación de reglas de contraseña en Paso 2
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);

  // Manejador del Paso 1: Enviar Código
  const handleSendCode = () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setEmailError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setEmailError('');
    setLoading(true);

    // Maqueta: Simula envío de código de 6 dígitos
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      setResendTimer(45);
      setOtpCode('');
    }, 900);
  };

  // Reenviar Código
  const handleResendCode = () => {
    if (resendTimer > 0) return;
    setResendTimer(45);
    Alert.alert('Código reenviado', 'Hemos enviado un nuevo código de 6 dígitos a tu correo.');
  };

  // Manejador del Paso 2: Restablecer Contraseña
  const handleResetPassword = () => {
    const errors: Record<string, string> = {};

    if (otpCode.length !== 6) {
      errors.otp = 'Ingresa el código completo de 6 dígitos.';
    }
    if (!newPassword || newPassword.length < 8) {
      errors.newPassword = 'La nueva contraseña debe tener al menos 8 caracteres.';
    } else if (!hasNumber) {
      errors.newPassword = 'La contraseña debe incluir al menos un número.';
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    if (Object.keys(errors).length > 0) {
      setStep2Errors(errors);
      return;
    }

    setStep2Errors({});
    setLoading(true);

    // Maqueta: Simula actualización exitosa
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        '¡Listo el pollo! 🎁🔑',
        'Tu contraseña ha sido restablecida exitosamente. Ya puedes ingresar.',
        [
          {
            text: 'Iniciar Sesión',
            onPress: () => {
              if (onRecoverySuccess) {
                onRecoverySuccess();
              } else if (onNavigateToLogin) {
                onNavigateToLogin();
              }
            },
          },
        ]
      );
    }, 1200);
  };

  return (
    <SafeAreaView style={commonStyles.safeArea} edges={['top', 'bottom']}>
      {/* 1. Header Idéntico al Registro */}
      <View style={authStyles.headerNav}>
        <View style={authStyles.headerNavLeft}>
          <TouchableOpacity
            style={authStyles.headerBackButton}
            onPress={() => {
              if (step === 2) {
                setStep(1);
              } else if (onNavigateToLogin) {
                onNavigateToLogin();
              }
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={22} color={theme.colors.textDark} />
          </TouchableOpacity>
          <Text style={authStyles.headerNavTitle}>
            {step === 1 ? 'Recuperar Contraseña' : 'Verificar Código'}
          </Text>
        </View>

        <View style={commonStyles.rowCenter}>
          <Text style={authStyles.headerNavBrand}>
            Pana<Text style={authStyles.headerNavBrandAccent}>Secreto</Text>
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
          {/* 2. Barra de Progreso / Stepper */}
          <View style={authStyles.stepperRow}>
            <Text style={authStyles.stepperTextStep}>
              Paso {step} de 2
            </Text>
            <Text style={authStyles.stepperTextTitle}>
              {step === 1 ? 'Identificación' : 'Seguridad y Clave'}
            </Text>
          </View>
          <View style={authStyles.stepperBarContainer}>
            <View
              style={[
                authStyles.stepperBarFill,
                { width: step === 1 ? '50%' : '100%' },
              ]}
            />
          </View>

          {/* ========================================================= */}
          {/* PASO 1: Ingreso de Correo Electrónico                     */}
          {/* ========================================================= */}
          {step === 1 && (
            <View>
              {/* Tarjeta con Mascota ("Cero estrés") */}
              <View style={authStyles.reassuranceCard}>
                <View style={authStyles.reassuranceMascotWrapper}>
                  <Image
                    source={require('../../../assets/icon.png')}
                    style={authStyles.reassuranceMascotImage}
                  />
                </View>
                <View style={authStyles.reassuranceContent}>
                  <View style={authStyles.reassuranceBadge}>
                    <RotateCcw size={14} color={theme.colors.secondaryDark} />
                    <Text style={authStyles.reassuranceBadgeText}>Cero estrés</Text>
                  </View>
                  <Text style={authStyles.reassuranceTitle}>
                    ¡Tranquilo pana, no te quedes fuera del sorteo!
                  </Text>
                </View>
              </View>

              {/* Título y Explicación */}
              <Text style={authStyles.registerHeading}>¿Olvidaste tu clave?</Text>
              <Text style={authStyles.registerSubheading}>
                No te preocupes. Ingresa el correo asociado a tu cuenta de PanaSecreto y te enviaremos un código de seguridad de 6 dígitos para restablecerla.
              </Text>

              {/* Tarjeta del Formulario */}
              <View style={[authStyles.card, { marginTop: theme.spacing.md }]}>
                <View style={formStyles.formGroup}>
                  <View style={formStyles.labelRow}>
                    <Text style={formStyles.label}>Correo electrónico registrado</Text>
                  </View>
                  <View
                    collapsable={false}
                    style={[
                      formStyles.inputWrapper,
                      isFocusedEmail && formStyles.inputWrapperFocused,
                      !!emailError && formStyles.inputWrapperError,
                    ]}
                  >
                    <Mail
                      size={19}
                      color={
                        isFocusedEmail ? theme.colors.primary : theme.colors.outline
                      }
                      style={formStyles.inputIcon}
                    />
                    <TextInput
                      style={formStyles.inputField}
                      placeholder="ej. tunombre@correo.com"
                      placeholderTextColor={theme.colors.outline}
                      value={email}
                      onChangeText={(val) => {
                        setEmail(val);
                        if (emailError) setEmailError('');
                      }}
                      onFocus={() => setIsFocusedEmail(true)}
                      onBlur={() => setIsFocusedEmail(false)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  {emailError ? (
                    <Text style={formStyles.errorText}>{emailError}</Text>
                  ) : null}

                  {/* Consejo informativo */}
                  <View style={authStyles.tipBanner}>
                    <Info size={16} color={theme.colors.brandOrange} style={{ marginTop: 1 }} />
                    <Text style={authStyles.tipText}>
                      Asegúrate de revisar tu bandeja de entrada o la carpeta de spam luego del envío.
                    </Text>
                  </View>
                </View>

                {/* Botón Principal: Mismo estilo estándar que "Crear mi Cuenta de Pana" */}
                <TouchableOpacity
                  style={[buttonStyles.btnPrimary, { marginTop: theme.spacing.md }]}
                  onPress={handleSendCode}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.colors.onSecondaryContainer} size="small" />
                  ) : (
                    <View style={commonStyles.rowCenter}>
                      <Text style={buttonStyles.btnPrimaryText}>
                        Enviar Código de Seguridad
                      </Text>
                      <ArrowRight size={20} color={theme.colors.onSecondaryContainer} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Volver al Login */}
                <View style={[buttonStyles.footerRow, { marginTop: theme.spacing.md }]}>
                  <Text style={buttonStyles.footerPrompt}>¿Recordaste tu clave?</Text>
                  <TouchableOpacity
                    onPress={onNavigateToLogin}
                    activeOpacity={0.7}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={buttonStyles.footerLink}>Inicia sesión aquí</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Micro-tarjeta de Garantía y Privacidad */}
              <View style={authStyles.guaranteeCard}>
                <View style={authStyles.guaranteeBadge}>
                  <ShieldCheck size={20} color={theme.colors.secondaryDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={authStyles.guaranteeTitle}>Tus datos están protegidos</Text>
                  <Text style={authStyles.guaranteeSubtitle}>
                    Tu secreto y los grupos de panas siguen 100% seguros y anónimos.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ========================================================= */}
          {/* PASO 2: Código de 6 Dígitos (Estilo UniSAN) y Nueva Clave */}
          {/* ========================================================= */}
          {step === 2 && (
            <View>
              {/* Contexto del Paso 2 con Avatar Guacamaya */}
              <View style={authStyles.reassuranceCard}>
                <View style={authStyles.reassuranceMascotWrapper}>
                  <Image
                    source={require('../../../assets/icon.png')}
                    style={authStyles.reassuranceMascotImage}
                  />
                </View>
                <View style={authStyles.reassuranceContent}>
                  <Text style={authStyles.reassuranceTitle}>
                    Verifica y Cambia tu Clave 🔐
                  </Text>
                  <Text style={[authStyles.tipText, { marginTop: 2 }]}>
                    Enviamos 6 dígitos a{' '}
                    <Text style={{ fontWeight: 'bold', color: theme.colors.textDark }}>
                      {getMaskedEmail(email)}
                    </Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => setStep(1)}
                    activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}
                  >
                    <Edit2 size={13} color={theme.colors.brandOrange} />
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.colors.brandOrange }}>
                      Cambiar correo
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tarjeta del Formulario Paso 2 */}
              <View style={authStyles.card}>
                {/* 1. Código OTP de 6 Dígitos (Componente InputOTP estilo UniSAN) */}
                <View style={formStyles.formGroup}>
                  <View style={formStyles.labelRow}>
                    <Text style={formStyles.label}>Código de Seguridad</Text>
                    <Text style={formStyles.labelHint}>
                      {otpCode.length === 6 ? '✓ 6 dígitos' : `${otpCode.length}/6 dígitos`}
                    </Text>
                  </View>

                  {/* Componente OTP idéntico al de UniSAN */}
                  <InputOTP
                    value={otpCode}
                    length={6}
                    onChangeText={(val) => {
                      setOtpCode(val);
                      if (step2Errors.otp) {
                        setStep2Errors((prev) => ({ ...prev, otp: '' }));
                      }
                    }}
                  />

                  {step2Errors.otp ? (
                    <Text style={formStyles.errorText}>{step2Errors.otp}</Text>
                  ) : null}

                  {/* Temporizador y Opción de Reenvío */}
                  <View style={authStyles.resendRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Clock size={14} color={theme.colors.outline} />
                      <Text style={authStyles.timerText}>
                        {resendTimer > 0 ? (
                          <>
                            Reenviar en{' '}
                            <Text style={authStyles.timerHighlight}>
                              00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
                            </Text>
                          </>
                        ) : (
                          '¿No te llegó el código?'
                        )}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={handleResendCode}
                      disabled={resendTimer > 0}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          authStyles.resendButton,
                          resendTimer > 0 && { color: theme.colors.outline, opacity: 0.6 },
                        ]}
                      >
                        Reenviar código
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 2. Campo: Nueva Contraseña */}
                <View style={[formStyles.formGroup, { marginTop: theme.spacing.sm }]}>
                  <View style={formStyles.labelRow}>
                    <Text style={formStyles.label}>Nueva Contraseña</Text>
                  </View>
                  <View
                    collapsable={false}
                    style={[
                      formStyles.inputWrapper,
                      focusedField === 'newPassword' && formStyles.inputWrapperFocused,
                      !!step2Errors.newPassword && formStyles.inputWrapperError,
                    ]}
                  >
                    <Lock
                      size={19}
                      color={
                        focusedField === 'newPassword'
                          ? theme.colors.primary
                          : theme.colors.outline
                      }
                      style={formStyles.inputIcon}
                    />
                    <TextInput
                      style={formStyles.inputField}
                      placeholder="Mínimo 8 caracteres"
                      placeholderTextColor={theme.colors.outline}
                      value={newPassword}
                      onChangeText={(val) => {
                        setNewPassword(val);
                        if (step2Errors.newPassword) {
                          setStep2Errors((prev) => ({ ...prev, newPassword: '' }));
                        }
                      }}
                      onFocus={() => setFocusedField('newPassword')}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={formStyles.toggleEyeButton}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {showNewPassword ? (
                        <EyeOff size={19} color={theme.colors.outline} />
                      ) : (
                        <Eye size={19} color={theme.colors.outline} />
                      )}
                    </TouchableOpacity>
                  </View>
                  {step2Errors.newPassword ? (
                    <Text style={formStyles.errorText}>{step2Errors.newPassword}</Text>
                  ) : null}

                  {/* Chips de Reglas de Seguridad */}
                  <View style={authStyles.rulesContainer}>
                    <Text style={authStyles.rulesHeader}>Requisitos de seguridad:</Text>
                    <View style={authStyles.rulesRow}>
                      <View
                        style={[
                          authStyles.ruleBadge,
                          hasMinLength && authStyles.ruleBadgeActive,
                        ]}
                      >
                        {hasMinLength ? (
                          <CheckCircle2 size={14} color={theme.colors.success} />
                        ) : (
                          <XCircle size={14} color={theme.colors.outline} />
                        )}
                        <Text
                          style={[
                            authStyles.ruleBadgeText,
                            hasMinLength && { color: theme.colors.textDark, fontWeight: 'bold' },
                          ]}
                        >
                          Mínimo 8 caracteres
                        </Text>
                      </View>

                      <View
                        style={[
                          authStyles.ruleBadge,
                          hasNumber && authStyles.ruleBadgeActive,
                        ]}
                      >
                        {hasNumber ? (
                          <CheckCircle2 size={14} color={theme.colors.success} />
                        ) : (
                          <XCircle size={14} color={theme.colors.outline} />
                        )}
                        <Text
                          style={[
                            authStyles.ruleBadgeText,
                            hasNumber && { color: theme.colors.textDark, fontWeight: 'bold' },
                          ]}
                        >
                          Al menos 1 número
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 3. Campo: Confirmar Nueva Contraseña */}
                <View style={formStyles.formGroup}>
                  <View style={formStyles.labelRow}>
                    <Text style={formStyles.label}>Confirmar Nueva Contraseña</Text>
                  </View>
                  <View
                    collapsable={false}
                    style={[
                      formStyles.inputWrapper,
                      focusedField === 'confirmPassword' && formStyles.inputWrapperFocused,
                      !!step2Errors.confirmPassword && formStyles.inputWrapperError,
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
                      placeholder="Repite tu contraseña exactamente"
                      placeholderTextColor={theme.colors.outline}
                      value={confirmPassword}
                      onChangeText={(val) => {
                        setConfirmPassword(val);
                        if (step2Errors.confirmPassword) {
                          setStep2Errors((prev) => ({ ...prev, confirmPassword: '' }));
                        }
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
                  {step2Errors.confirmPassword ? (
                    <Text style={formStyles.errorText}>{step2Errors.confirmPassword}</Text>
                  ) : null}
                </View>

                {/* Botón Principal: Restablecer y Entrar (Estilo estándar con ArrowRight) */}
                <TouchableOpacity
                  style={[buttonStyles.btnPrimary, { marginTop: theme.spacing.md }]}
                  onPress={handleResetPassword}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.colors.onSecondaryContainer} size="small" />
                  ) : (
                    <View style={commonStyles.rowCenter}>
                      <Text style={buttonStyles.btnPrimaryText}>
                        Restablecer y Entrar
                      </Text>
                      <ArrowRight size={20} color={theme.colors.onSecondaryContainer} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Mensaje de Garantía Final */}
              <View style={authStyles.guaranteeCard}>
                <View style={authStyles.guaranteeBadge}>
                  <ShieldCheck size={20} color={theme.colors.secondaryDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={authStyles.guaranteeTitle}>Anonimato Garantizado</Text>
                  <Text style={authStyles.guaranteeSubtitle}>
                    Tus grupos y papelitos asignados seguirán intactos y 100% secretos.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
