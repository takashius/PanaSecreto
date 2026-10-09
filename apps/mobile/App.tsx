import './global.css';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import LoginScreen from './src/screens/auth/LoginScreen';

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
    <SafeAreaView className="flex-1 bg-[#1E1338] justify-center items-center px-6">
      <View className="bg-white rounded-3xl p-6 w-full items-center shadow-lg">
        <Text className="text-3xl mb-2">
          {currentScreen === 'register' && '📝'}
          {currentScreen === 'recover' && '🔑'}
          {currentScreen === 'dashboard' && '🎁'}
        </Text>
        <Text className="text-xl font-bold text-[#1C1B24] mb-2 text-center">
          {currentScreen === 'register' && 'Registro de Pana'}
          {currentScreen === 'recover' && 'Recuperar Contraseña'}
          {currentScreen === 'dashboard' && '¡Sesión Iniciada!'}
        </Text>
        <Text className="text-sm text-[#6C757D] text-center mb-6">
          {currentScreen === 'dashboard'
            ? `Bienvenido ${sessionUser?.email || 'Pana'}. Pantalla lista para conectar con tus grupos.`
            : 'Próxima pantalla a adaptar desde Stitch.'}
        </Text>

        <TouchableOpacity
          className="bg-[#1E1338] py-3.5 px-6 rounded-2xl w-full items-center"
          onPress={() => setCurrentScreen('login')}
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-base">Volver a Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
