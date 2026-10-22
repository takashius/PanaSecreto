import React, { useState, useEffect } from 'react';
import { StatusBar, Platform, BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { useFonts } from 'expo-font';
import { Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import RecoverPasswordScreen from './src/screens/auth/RecoverPasswordScreen';
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import CreateGroupScreen from './src/screens/group/CreateGroupScreen';
import GroupDetailScreen from './src/screens/group/GroupDetailScreen';
import type { GroupDetailTab } from './src/components/groupDetail/GroupDetailTabs';
import WishDetailScreen from './src/screens/wish/WishDetailScreen';
import { MOCK_GROUPS, MOCK_GROUP_DETAIL } from './src/mocks/groupDetail';
import { MOCK_WISH_DETAILS } from './src/mocks/wishes';
import type { GroupDetailView, WishComment } from './src/types/session';
import { theme } from './src/styles/theme';
import type { SessionUser } from './src/types/session';

type Screen = 'login' | 'register' | 'recover' | 'dashboard' | 'createGroup' | 'groupDetail' | 'wishDetail';

export default function App() {
  // Pila de navegación para soportar el botón de atrás nativo de Android
  const [screenHistory, setScreenHistory] = useState<Array<Screen>>(['login']);
  const [groupDetailTab, setGroupDetailTab] = useState<GroupDetailTab>('resumen');
  const [groupDetailId, setGroupDetailId] = useState<string>(MOCK_GROUP_DETAIL.id);
  // Estado de maqueta: conserva los cambios locales mientras no hay API
  const [groups, setGroups] = useState<Record<string, GroupDetailView>>(MOCK_GROUPS);
  const [wishDetails, setWishDetails] = useState(MOCK_WISH_DETAILS);
  const [wishDetailId, setWishDetailId] = useState<string | null>(null);

  const handleWishComments = (wishId: string, comments: WishComment[]) => {
    setWishDetails((prev) => ({ ...prev, [wishId]: { ...prev[wishId], comments, commentsCount: comments.length } }));
    setGroups((prev) => {
      const g = prev[groupDetailId];
      if (!g?.envelope) return prev;
      const wishes = g.envelope.wishes.map((w) => (w.id === wishId ? { ...w, commentsCount: comments.length } : w));
      return { ...prev, [g.id]: { ...g, envelope: { ...g.envelope, wishes } } };
    });
  };
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  const currentScreen = screenHistory[screenHistory.length - 1];

  // Tipografía de marca: Fredoka (titulares) + Nunito (texto)
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  const navigateTo = (screen: Screen) => {
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

  let content: React.ReactNode;
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
  } else if (currentScreen === 'createGroup') {
    content = (
      <CreateGroupScreen
        onNavigateBack={goBack}
      />
    );
  } else if (currentScreen === 'groupDetail') {
    content = (
      <GroupDetailScreen
        key={groupDetailId}
        group={groups[groupDetailId] ?? MOCK_GROUP_DETAIL}
        initialTab={groupDetailTab}
        onNavigateBack={goBack}
        onTabChange={setGroupDetailTab}
        onGroupChange={(g) => setGroups((prev) => ({ ...prev, [g.id]: g }))}
        onOpenWish={(wish) => {
          setWishDetailId(wish.id);
          navigateTo('wishDetail');
        }}
      />
    );
  } else if (currentScreen === 'wishDetail' && wishDetailId && wishDetails[wishDetailId]) {
    content = (
      <WishDetailScreen
        key={wishDetailId}
        wish={wishDetails[wishDetailId]}
        onNavigateBack={goBack}
        onCommentsChange={handleWishComments}
      />
    );
  } else {
    content = (
      <DashboardScreen
        user={sessionUser}
        onNavigateToCreateGroup={() => navigateTo('createGroup')}
        onOpenGroup={(groupId, tab = 'resumen') => {
          setGroupDetailId(groupId);
          setGroupDetailTab(tab);
          navigateTo('groupDetail');
        }}
        onLogout={() => {
          setSessionUser(null);
          setScreenHistory(['login']);
        }}
      />
    );
  }

  // Mientras cargan las fuentes se muestra el fondo de marca; si fallan, se sigue con las del sistema
  if (!fontsLoaded && !fontError) {
    return <SafeAreaProvider style={{ flex: 1, backgroundColor: theme.colors.surface }} />;
  }

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      {content}
    </SafeAreaProvider>
  );
}
