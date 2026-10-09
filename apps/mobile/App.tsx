import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/auth/LoginScreen';
import { theme } from './src/styles/theme';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | 'recover' | 'dashboard'>('login');
  const [sessionUser, setSessionUser] = useState<any>(null);

  if (currentScreen === 'login') {
    return (
      <LoginScreen
        onNavigateToRegister={() => setCurrentScreen('register')}
        onNavigateToRecoverPassword={() => setCurrentScreen('recover')}
        onLoginSuccess={(_token, user) => {
          setSessionUser(user);
          setCurrentScreen('dashboard');
        }}
      />
    );
  }

  // Pantallas de marcador temporal para Registro, Recuperar Contraseña o Dashboard post-login
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji}>
          {currentScreen === 'register' && '📝'}
          {currentScreen === 'recover' && '🔑'}
          {currentScreen === 'dashboard' && '🎁'}
        </Text>
        <Text style={styles.title}>
          {currentScreen === 'register' && 'Registro de Pana'}
          {currentScreen === 'recover' && 'Recuperar Contraseña'}
          {currentScreen === 'dashboard' && '¡Sesión Iniciada!'}
        </Text>
        <Text style={styles.subtitle}>
          {currentScreen === 'dashboard'
            ? `Bienvenido ${sessionUser?.identifier || 'Pana'}. Pantalla lista para conectar con tus grupos.`
            : 'Próxima pantalla a adaptar desde Stitch.'}
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentScreen('login')}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>Volver a Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radii['3xl'],
    padding: 24,
    width: '100%',
    alignItems: 'center',
    ...theme.shadows.card,
  },
  emoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    height: 48,
    borderRadius: theme.radii.lg,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: theme.typography.fontSize.md,
  },
});
