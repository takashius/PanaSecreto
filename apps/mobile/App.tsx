import React, { useState, useEffect } from 'react';
import { StatusBar, Platform, BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import RecoverPasswordScreen from './src/screens/auth/RecoverPasswordScreen';
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
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
      <DashboardScreen
        user={sessionUser}
        onLogout={() => {
          setSessionUser(null);
          setScreenHistory(['login']);
        }}
      />
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      {content}
    </SafeAreaProvider>
  );
}
