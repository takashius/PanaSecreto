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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { LoginSchema } from '@panasecreto/shared';
import { cssClasses, theme } from '../../styles/theme';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = async () => {
    // 1. Validar campos con Zod schema compartido de @panasecreto/shared
    const validation = LoginSchema.safeParse({ email: email.trim(), password });
    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // Simulación de login / llamada a API backend
      // TODO: Conectar con apiClient / ERDEAxios móvil
      setTimeout(() => {
        setLoading(false);
        Alert.alert('¡Bienvenido!', `Sesión iniciada con éxito para ${email}`);
        if (onLoginSuccess) {
          onLoginSuccess('mock-jwt-token', { email });
        }
      }, 800);
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Error', err?.message || 'No se pudo iniciar sesión');
    }
  };

  return (
    <SafeAreaView className={cssClasses.layout.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName={cssClasses.layout.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Header con Branding oficial de PanaSecreto */}
          <View className={cssClasses.layout.header}>
            <View className={cssClasses.brand.logoBox}>
              <Text className={cssClasses.brand.logoEmoji}>🎁</Text>
            </View>
            <Text className={cssClasses.brand.title}>
              Pana<Text className={cssClasses.brand.accent}>Secreto</Text>
            </Text>
            <Text className={cssClasses.brand.tagline}>
              Tu intercambio de amigos sin enredos
            </Text>
          </View>

          {/* 2. Tarjeta de Contenido / Formulario */}
          <View className={cssClasses.layout.card}>
            <Text className={cssClasses.typography.title}>Iniciar Sesión</Text>
            <Text className={cssClasses.typography.subtitle}>
              Ingresa tus credenciales para ver tus grupos y sorteos
            </Text>

            {/* Campo: Correo Electrónico */}
            <View className={cssClasses.form.group}>
              <Text className={cssClasses.form.label}>Correo Electrónico</Text>
              <View
                className={`${cssClasses.form.wrapper} ${
                  errors.email ? cssClasses.form.wrapperError : ''
                }`}
              >
                <Mail size={20} color={theme.colors.muted} />
                <TextInput
                  className={cssClasses.form.field}
                  placeholder="ejemplo@panasecreto.com"
                  placeholderTextColor={theme.colors.muted}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && (
                <Text className={cssClasses.form.error}>{errors.email}</Text>
              )}
            </View>

            {/* Campo: Contraseña */}
            <View className={cssClasses.form.group}>
              <Text className={cssClasses.form.label}>Contraseña</Text>
              <View
                className={`${cssClasses.form.wrapper} ${
                  errors.password ? cssClasses.form.wrapperError : ''
                }`}
              >
                <Lock size={20} color={theme.colors.muted} />
                <TextInput
                  className={cssClasses.form.field}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.muted}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={theme.colors.muted} />
                  ) : (
                    <Eye size={20} color={theme.colors.muted} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text className={cssClasses.form.error}>{errors.password}</Text>
              )}
            </View>

            {/* Enlace: ¿Olvidaste tu contraseña? */}
            <TouchableOpacity
              className={cssClasses.form.forgotPassword}
              onPress={onNavigateToRecoverPassword}
              activeOpacity={0.7}
            >
              <Text className={cssClasses.form.forgotPasswordText}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>

            {/* Botón Principal: Iniciar Sesión */}
            <TouchableOpacity
              className={cssClasses.buttons.primary}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View className="flex-row items-center justify-center">
                  <Text className={cssClasses.buttons.primaryText}>
                    Entrar al Intercambio
                  </Text>
                  <View className="ml-2">
                    <ArrowRight size={18} color="#FFFFFF" />
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {/* Separador */}
            <View className={cssClasses.divider.row}>
              <View className={cssClasses.divider.line} />
              <Text className={cssClasses.divider.label}>o</Text>
              <View className={cssClasses.divider.line} />
            </View>

            {/* Enlace de Registro en Footer */}
            <View className={cssClasses.footer.row}>
              <Text className={cssClasses.footer.prompt}>¿Aún no tienes cuenta?</Text>
              <TouchableOpacity onPress={onNavigateToRegister} activeOpacity={0.7}>
                <Text className={cssClasses.footer.action}>Crea tu cuenta de Pana</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
