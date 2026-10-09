import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react-native';
import { GoogleIcon } from '../../components/common/GoogleIcon';
import {
  theme,
  commonStyles,
  formStyles,
  buttonStyles,
  authStyles,
} from '../../styles';

interface LoginScreenProps {
  onNavigateToRegister?: () => void;
  onNavigateToRecoverPassword?: () => void;
  onLoginSuccess?: (token: string, user: any) => void;
}

export default function LoginScreen({
  onNavigateToRegister,
  onNavigateToRecoverPassword,
  onLoginSuccess,
}: LoginScreenProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocusedIdentifier, setIsFocusedIdentifier] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

  const handleLogin = () => {
    const newErrors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      newErrors.identifier = 'Por favor ingresa tu correo o usuario.';
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

    // Simulación de autenticación exitosa
    setTimeout(() => {
      setLoading(false);
      Alert.alert('¡Bienvenido, Pana!', `Sesión iniciada correctamente.`);
      if (onLoginSuccess) {
        onLoginSuccess('mock-jwt-token', { identifier });
      }
    }, 1200);
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
          {/* 1. Header con Mascota (Guacamaya), Logo y Eslogan */}
          <View style={authStyles.headerSection}>
            <View style={authStyles.mascotWrapper}>
              <View style={authStyles.mascotGlow} />
              <Image
                source={require('../../../assets/icon.png')}
                style={authStyles.mascotImage}
              />
            </View>

            <View style={authStyles.titleRow}>
              <Text style={authStyles.brandTitle}>
                Pana<Text style={authStyles.brandTitleAccent}>Secreto</Text>
              </Text>
            </View>

            <Text style={authStyles.tagline}>
              ¡Epa! Inicia sesión para descubrir a tu amigo secreto y armar la parranda.
            </Text>
          </View>

          {/* 2. Tarjeta Blanca del Formulario */}
          <View style={authStyles.card}>
            {/* Campo: Correo o Usuario */}
            <View style={formStyles.formGroup}>
              <View style={formStyles.labelRow}>
                <Text style={formStyles.label}>Correo o Usuario</Text>
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
                  placeholder="ej. pana@correo.com o @carlos"
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
                />
              </View>
              {errors.identifier && (
                <Text style={formStyles.errorText}>{errors.identifier}</Text>
              )}
            </View>

            {/* Campo: Contraseña */}
            <View style={formStyles.formGroup}>
              <View style={formStyles.labelRow}>
                <Text style={formStyles.label}>Contraseña</Text>
                <TouchableOpacity
                  onPress={onNavigateToRecoverPassword}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={formStyles.forgotPasswordLink}>
                    ¿Olvidaste tu contraseña?
                  </Text>
                </TouchableOpacity>
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
              {errors.password && (
                <Text style={formStyles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Botón Principal: Entrar al Intercambio */}
            <TouchableOpacity
              style={buttonStyles.btnPrimary}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.onSecondaryContainer} size="small" />
              ) : (
                <View style={commonStyles.rowCenter}>
                  <Text style={buttonStyles.btnPrimaryText}>
                    Entrar al Intercambio
                  </Text>
                  <Text style={buttonStyles.btnPrimaryEmoji}>🎁</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Separador */}
            <View style={commonStyles.dividerRow}>
              <View style={commonStyles.dividerLine} />
              <Text style={commonStyles.dividerText}>O ingresa con</Text>
              <View style={commonStyles.dividerLine} />
            </View>

            {/* Botones de Inicio de Sesión Social */}
            <View style={buttonStyles.socialButtonContainer}>
              <TouchableOpacity
                style={buttonStyles.btnGoogle}
                onPress={() => Alert.alert('Google Auth', 'Próximamente disponible')}
                activeOpacity={0.8}
              >
                <GoogleIcon size={20} />
                <Text style={buttonStyles.btnGoogleText}>Continuar con Google</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. Enlace de Registro */}
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

          {/* 4. Insignia de Confidencialidad y Anonimato */}
          <View style={commonStyles.badgeContainer}>
            <ShieldCheck size={16} color={theme.colors.secondaryDark} />
            <Text style={commonStyles.badgeText}>
              Anonimato 100% garantizado en cada sorteo
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
