import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform, BackHandler } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import RecoverPasswordScreen from './src/screens/auth/RecoverPasswordScreen';
import { theme } from './src/styles/theme';

export default function App() {
  // Pila de navegación para soportar el botón de atrás nativo de Android
  const [screenHistory, setScreenHistory] = useState<Array<'login' | 'register' | 'recover' | 'dashboard'>>(['login']);
  const [sessionUser, setSessionUser] = useState<any>(null);

  const currentScreen = screenHistory[screenHistory.length - 1];

  const navigateTo = (screen: 'login' | 'register' | 'recover' | 'dashboard') => {
    setScreenHistory((prev) => [...prev, screen]);
  };

  const goBack = () => {
    setScreenHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  // Configura la barra de navegación de Android una sola vez al montar la aplicación
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setStyle?.('dark');
    }
  }, []);

  // Intercepta el botón de atrás nativo de Android
  useEffect(() => {
    const onBackPress = () => {
      if (screenHistory.length > 1) {
        setScreenHistory((prev) => prev.slice(0, -1));
        return true; // No cierra la app, retrocede a la pantalla previa
      }
      return false; // En Login (raíz), permite el comportamiento normal de salida
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSub.remove();
  }, [screenHistory]);

  let content = null;
  if (currentScreen === 'login') {
    content = (
      <LoginScreen
        onNavigateToRegister={() => navigateTo('register')}
        onNavigateToRecoverPassword={() => navigateTo('recover')}
        onLoginSuccess={(_token, user) => {
          setSessionUser(user);
          setScreenHistory(['dashboard']);
        }}
      />
    );
  } else if (currentScreen === 'register') {
    content = (
      <RegisterScreen
        onNavigateToLogin={goBack}
        onRegisterSuccess={(user) => {
          setSessionUser(user);
          setScreenHistory(['dashboard']);
        }}
      />
    );
  } else if (currentScreen === 'recover') {
    content = (
      <RecoverPasswordScreen
        onNavigateToLogin={goBack}
        onRecoverySuccess={() => setScreenHistory(['login'])}
      />
    );
  } else {
    content = (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🎁</Text>
          <Text style={styles.title}>¡Sesión Iniciada!</Text>
          <Text style={styles.subtitle}>
            {sessionUser?.fullname || sessionUser?.identifier || 'Pana'}, estás listo para armar la parranda y el sorteo.
          </Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setScreenHistory(['login'])}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      {content}
    </SafeAreaProvider>
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
