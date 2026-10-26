import React, { useState, useEffect } from 'react';
import { StatusBar, Platform, BackHandler, View, Image, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import * as Linking from 'expo-linking';
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
import type { GroupDetailTab } from './src/components/groupDetail/GroupDetailTabs';
import ChatsScreen from './src/screens/chat/ChatsScreen';
import ChatRoomScreen from './src/screens/chat/ChatRoomScreen';
import { MOCK_CHATS } from './src/mocks/chats';
import { ProfileContainer, EditProfileContainer, ChangePasswordContainer } from './src/screens/profile/ProfileContainers';
import { Alert, AppDialogHost } from './src/components/common/AppDialog';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import type { SessionPayload } from './src/api/auth';
import { BRAND_LOGO } from './src/constants/brand';
import { authStyles } from './src/styles';
import { useApiQuery } from './src/api/queryStore';
import { fetchQuery } from './src/api/queryStore';
import { fetchMyGroups, MY_GROUPS_KEY } from './src/api/groups';
import { EditGroupContainer, ExclusionsContainer, GroupDetailContainer, RevealContainer } from './src/screens/group/GroupScreens';
import { MyWishesContainer, WishDetailContainer, WishFormContainer } from './src/screens/wishes/WishScreens';
import { CHAT_UNREAD_KEY, fetchChatUnread, fetchNotificationsUnread, NOTIFICATIONS_UNREAD_KEY } from './src/api/badges';
import LegalScreen from './src/screens/legal/LegalScreen';
import NotificationsScreen from './src/screens/notifications/NotificationsScreen';
import JoinGroupScreen from './src/screens/group/JoinGroupScreen';
import { MOCK_NOTIFICATIONS } from './src/mocks/notifications';
import type { DashboardTab } from './src/components/common/FloatingTabBar';
import type { AppNotification, ChatMessage, ChatRoomSummary } from './src/types/session';
import { theme } from './src/styles/theme';
import { joinCodeFromUrl } from './src/utils/deepLink';

type Screen = 'login' | 'register' | 'recover' | 'dashboard' | 'createGroup' | 'groupDetail' | 'wishDetail' | 'myWishes' | 'wishForm' | 'chats' | 'chatRoom' | 'profile' | 'editProfile' | 'changePassword' | 'notifications' | 'joinGroup' | 'exclusions' | 'editGroup' | 'reveal' | 'legal';

function AppContent() {
  // Pila de navegación para soportar el botón de atrás nativo de Android
  const { status, user, sessionExpired, signIn, signOut } = useAuth();
  const signedIn = status === 'signedIn';
  // Dos pilas: la de la app (con sesión) y la de autenticación (sin sesión)
  const [screenHistory, setScreenHistory] = useState<Array<Screen>>(['dashboard']);
  const [authHistory, setAuthHistory] = useState<Array<Screen>>(['login']);
  const [groupDetailTab, setGroupDetailTab] = useState<GroupDetailTab>('resumen');
  const [groupDetailId, setGroupDetailId] = useState<string>('');
  // Abrir la elección del alias apenas cargue el grupo (al crearlo o unirse)
  const [promptAlias, setPromptAlias] = useState(false);
  // Deseos: grupo elegido en la pestaña, deseo abierto (y desde qué lado) y formulario
  const [myListGroupId, setMyListGroupId] = useState<string>('');
  const [wishCtx, setWishCtx] = useState<{ groupId: string; wishId: string; viewer: 'owner' | 'giver' } | null>(null);
  const [wishForm, setWishForm] = useState<{ groupId: string; wishId: string | null } | null>(null);
  // Mis grupos (para las estadísticas del perfil)
  const myGroupsQuery = useApiQuery(MY_GROUPS_KEY, fetchMyGroups, { enabled: signedIn, staleMs: 60_000 });
  // Perfil (maqueta): se completa con los datos de la sesión cuando existen
  // Perfil: datos de la sesión + cambios locales de la maqueta (hasta conectar la edición de perfil)
  /** Código que llegó por un enlace de invitación: abre "Unirse" apenas haya sesión */
  const [linkJoinCode, setLinkJoinCode] = useState<string | null>(null);
  const [legalDoc, setLegalDoc] = useState<'terminos' | 'privacidad'>('terminos');

  // Notificaciones (no son en tiempo real)
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  // Campana: no leídas reales (la lista de Notificaciones aún usa la maqueta)
  const notificationsUnreadQuery = useApiQuery(NOTIFICATIONS_UNREAD_KEY, fetchNotificationsUnread, { enabled: signedIn, staleMs: 60_000 });
  const hasNotifications = (notificationsUnreadQuery.data ?? 0) > 0;

  // Chats: una sala por grupo
  const [chats, setChats] = useState<ChatRoomSummary[]>(MOCK_CHATS);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  // No leídos reales del chat (los comparte la barra inferior de todas las pestañas)
  const chatUnreadQuery = useApiQuery(CHAT_UNREAD_KEY, fetchChatUnread, { enabled: signedIn, staleMs: 60_000 });
  const chatUnread = chatUnreadQuery.data ?? 0;

  const openChatRoom = (groupId: string) => {
    // Al entrar se marcan como leídos
    setChats((prev) => prev.map((c) => (c.groupId === groupId ? { ...c, unread: 0 } : c)));
    setChatRoomId(groupId);
    navigateTo('chatRoom');
  };

  const updateChatMessages = (groupId: string, messages: ChatMessage[]) =>
    setChats((prev) => prev.map((c) => (c.groupId === groupId ? { ...c, messages } : c)));

  const openWishForm = (groupId: string, wishId: string | null) => {
    setMyListGroupId(groupId);
    setWishForm({ groupId, wishId });
    navigateTo('wishForm');
  };

  const openWish = (groupId: string, wishId: string, viewer: 'owner' | 'giver') => {
    setWishCtx({ groupId, wishId, viewer });
    navigateTo('wishDetail');
  };

  const openGroup = (groupId: string, tab: GroupDetailTab = 'resumen', askAlias = false) => {
    setGroupDetailId(groupId);
    setGroupDetailTab(tab);
    setPromptAlias(askAlias);
    navigateTo('groupDetail');
  };

  /** Al tocar una notificación: se marca leída y se abre su destino */
  const openNotification = (n: AppNotification) => {
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    const { screen, wishId } = n.target;
    if (screen === 'myWish' && wishId) openWish(n.groupId, wishId, 'owner');
    else if (screen === 'wish' && wishId) openWish(n.groupId, wishId, 'giver');
    else if (screen === 'envelope') openGroup(n.groupId, 'sobre');
    else if (screen === 'chat') openChatRoom(n.groupId);
    else if (screen === 'reveal') {
      setGroupDetailId(n.groupId);
      navigateTo('reveal');
    } else openGroup(n.groupId);
  };

  /** Barra inferior: las pestañas principales no se apilan en el historial */
  const handleNavigateTab = (tab: DashboardTab) => {
    if (tab === 'grupos') setScreenHistory(['dashboard']);
    else if (tab === 'deseos') setScreenHistory(['dashboard', 'myWishes']);
    else if (tab === 'chats') setScreenHistory(['dashboard', 'chats']);
    else setScreenHistory(['dashboard', 'profile']);
  };

  const activeHistory = signedIn ? screenHistory : authHistory;
  const currentScreen = activeHistory[activeHistory.length - 1];

  /** Entra con la sesión que devolvió la API (correo, registro, Google o recuperación) */
  const startSession = async (session: SessionPayload, welcome = false) => {
    await signIn(session);
    setScreenHistory(['dashboard']);
    setAuthHistory(['login']);
    if (welcome || session.isNew) {
      Alert.alert('¡Bienvenido al bonche! 🎉', `Pana ${session.nickname || session.name}, tu cuenta quedó lista.`);
    }
  };

  const handleLogout = () => {
    void signOut();
    setScreenHistory(['dashboard']);
    setAuthHistory(['login']);
  };

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
    const push = (prev: Screen[]) => [...prev, screen];
    if (signedIn) setScreenHistory(push);
    else setAuthHistory(push);
  };

  const goBack = () => {
    const pop = (prev: Screen[]) => (prev.length > 1 ? prev.slice(0, -1) : prev);
    if (signedIn) setScreenHistory(pop);
    else setAuthHistory(pop);
  };

  // Configura la barra de navegación de Android una sola vez al montar la aplicación
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setStyle?.('dark');
    }
  }, []);

  // Enlaces de invitación (…/join/PANA-XXXX-XX): al abrir la app con uno o mientras está abierta
  useEffect(() => {
    let alive = true;
    void Linking.getInitialURL().then((url) => {
      const code = joinCodeFromUrl(url);
      if (alive && code) setLinkJoinCode(code);
    });
    const sub = Linking.addEventListener('url', ({ url }) => {
      const code = joinCodeFromUrl(url);
      if (code) setLinkJoinCode(code);
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  // Intercepta el botón de atrás nativo de Android
  useEffect(() => {
    const onBackPress = () => {
      if (signedIn && linkJoinCode) {
        setLinkJoinCode(null);
        return true;
      }
      if (activeHistory.length > 1) {
        const pop = (prev: Screen[]) => prev.slice(0, -1);
        if (signedIn) setScreenHistory(pop);
        else setAuthHistory(pop);
        return true; // No cierra la app, retrocede a la pantalla previa
      }
      return false; // En la raíz (Login o Grupos), permite el comportamiento normal de salida
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSub.remove();
  }, [activeHistory, signedIn, linkJoinCode]);

  let content: React.ReactNode;
  if (!signedIn && currentScreen === 'register') {
    content = (
      <RegisterScreen
        onNavigateToLogin={goBack}
        onRegisterSuccess={(session) => startSession(session, true)}
        onOpenLegal={(doc) => {
          setLegalDoc(doc);
          navigateTo('legal');
        }}
      />
    );
  } else if (!signedIn && currentScreen === 'recover') {
    content = (
      <RecoverPasswordScreen
        onNavigateToLogin={goBack}
        onRecoverySuccess={(session) => (session ? startSession(session) : setAuthHistory(['login']))}
      />
    );
  } else if (!signedIn && currentScreen === 'legal') {
    content = <LegalScreen document={legalDoc} onNavigateBack={goBack} />;
  } else if (!signedIn) {
    content = (
      <LoginScreen
        onNavigateToRegister={() => navigateTo('register')}
        onNavigateToRecoverPassword={() => navigateTo('recover')}
        onLoginSuccess={(session) => startSession(session)}
        notice={
          linkJoinCode
            ? `Inicia sesión o crea tu cuenta para unirte al grupo ${linkJoinCode}.`
            : sessionExpired
              ? 'Tu sesión expiró o se cerró en otro dispositivo. Vuelve a entrar, pana.'
              : null
        }
      />
    );
  } else if (linkJoinCode || currentScreen === 'joinGroup') {
    // Desde un enlace, "Unirse" se muestra encima de lo que hubiera (sin sesión, primero el login)
    const fromLink = !!linkJoinCode;
    content = (
      <JoinGroupScreen
        key={linkJoinCode ?? 'manual'}
        initialCode={linkJoinCode ?? undefined}
        onJoined={(groupId) => {
          setLinkJoinCode(null);
          void fetchQuery(MY_GROUPS_KEY, fetchMyGroups);
          setScreenHistory(['dashboard']);
          openGroup(groupId, 'resumen', true);
        }}
        onOpenGroup={(groupId) => {
          setLinkJoinCode(null);
          setScreenHistory(['dashboard']);
          openGroup(groupId);
        }}
        onNavigateBack={fromLink ? () => setLinkJoinCode(null) : goBack}
      />
    );
  } else if (currentScreen === 'createGroup') {
    content = (
      <CreateGroupScreen
        onNavigateBack={goBack}
        onGroupCreated={() => void fetchQuery(MY_GROUPS_KEY, fetchMyGroups)}
        onOpenGroup={(groupId) => {
          setGroupDetailId(groupId);
          setGroupDetailTab('resumen');
          setPromptAlias(true);
          // Reemplaza "Crear grupo" por el detalle: atrás vuelve al inicio
          setScreenHistory(['dashboard', 'groupDetail']);
        }}
      />
    );
  } else if (currentScreen === 'groupDetail') {
    content = (
      <GroupDetailContainer
        key={groupDetailId}
        groupId={groupDetailId}
        promptAlias={promptAlias}
        initialTab={groupDetailTab}
        onNavigateBack={goBack}
        onTabChange={setGroupDetailTab}
        onNavigateTab={handleNavigateTab}
        chatRoom={chats.find((c) => c.groupId === groupDetailId) ?? null}
        onOpenChat={() =>
          chats.some((c) => c.groupId === groupDetailId)
            ? openChatRoom(groupDetailId)
            : Alert.alert('Chat del grupo', 'El chat se conecta con la API en uno de los próximos pasos.')
        }
        onEditGroup={() => navigateTo('editGroup')}
        onManageExclusions={() => navigateTo('exclusions')}
        onGroupGone={() => setScreenHistory(['dashboard'])}
        onOpenReveal={() => navigateTo('reveal')}
        chatUnread={chatUnread}
        onOpenWish={(wish) => openWish(groupDetailId, wish.id, 'giver')}
      />
    );
  } else if (currentScreen === 'wishDetail' && wishCtx) {
    content = (
      <WishDetailContainer
        key={`${wishCtx.viewer}-${wishCtx.wishId}`}
        groupId={wishCtx.groupId}
        wishId={wishCtx.wishId}
        viewer={wishCtx.viewer}
        onNavigateBack={goBack}
        onEdit={() => openWishForm(wishCtx.groupId, wishCtx.wishId)}
        onDeleted={goBack}
      />
    );
  } else if (currentScreen === 'wishForm' && wishForm) {
    content = (
      <WishFormContainer
        key={`${wishForm.groupId}-${wishForm.wishId ?? 'nuevo'}`}
        groupId={wishForm.groupId}
        wishId={wishForm.wishId}
        onDone={goBack}
        onCancel={goBack}
      />
    );
  } else if (currentScreen === 'chatRoom' && chats.some((c) => c.groupId === chatRoomId)) {
    content = (
      <ChatRoomScreen
        key={chatRoomId as string}
        room={chats.find((c) => c.groupId === chatRoomId) as ChatRoomSummary}
        onNavigateBack={goBack}
        onMessagesChange={updateChatMessages}
      />
    );
  } else if (currentScreen === 'profile') {
    content = (
      <ProfileContainer
        stats={{
          groups: myGroupsQuery.data?.length ?? 0,
          wishes: (myGroupsQuery.data ?? []).reduce((n, g) => n + (g.myWishCount ?? 0), 0),
          exchanges: (myGroupsQuery.data ?? []).filter((g) => g.status === 'REVEALED' || g.status === 'COMPLETED').length,
        }}
        onEditProfile={() => navigateTo('editProfile')}
        onChangePassword={() => navigateTo('changePassword')}
        onOpenLegal={(doc) => {
          setLegalDoc(doc);
          navigateTo('legal');
        }}
        onLogout={handleLogout}
        onNavigateTab={handleNavigateTab}
        chatUnread={chatUnread}
      />
    );
  } else if (currentScreen === 'editProfile') {
    content = (
<EditProfileContainer onDone={goBack} onCancel={goBack} />
    );
  } else if (currentScreen === 'changePassword') {
    content = <ChangePasswordContainer onDone={goBack} onCancel={goBack} />;
  } else if (currentScreen === 'legal') {
    content = <LegalScreen document={legalDoc} onNavigateBack={goBack} />;
  } else if (currentScreen === 'notifications') {
    content = (
      <NotificationsScreen
        notifications={notifications}
        onOpen={openNotification}
        onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
        onNavigateBack={goBack}
      />
    );
  } else if (currentScreen === 'exclusions') {
    content = <ExclusionsContainer groupId={groupDetailId} onDone={goBack} onCancel={goBack} />;
  } else if (currentScreen === 'editGroup') {
    content = (
      <EditGroupContainer
        groupId={groupDetailId}
        onDone={goBack}
        onCancel={goBack}
        onGroupGone={() => setScreenHistory(['dashboard'])}
      />
    );
  } else if (currentScreen === 'reveal') {
    content = (
      <RevealContainer
        groupId={groupDetailId}
        onNavigateBack={goBack}
        onOpenWishlist={() => openGroup(groupDetailId, 'sobre')}
        onOpenChat={() => (chats.some((c) => c.groupId === groupDetailId) ? openChatRoom(groupDetailId) : openGroup(groupDetailId, 'chat'))}
      />
    );
  } else if (currentScreen === 'chats') {
    content = (
      <ChatsScreen
        rooms={chats}
        onOpenRoom={openChatRoom}
        onOpenNotifications={() => navigateTo('notifications')}
        hasNotifications={hasNotifications}
        onNavigateTab={handleNavigateTab}
        onProfilePress={() => handleNavigateTab('perfil')}
      />
    );
  } else if (currentScreen === 'myWishes') {
    content = (
      <MyWishesContainer
        selectedGroupId={myListGroupId}
        onSelectGroup={setMyListGroupId}
        onOpenWish={openWish}
        onAddWish={(groupId) => openWishForm(groupId, null)}
        onEditWish={(groupId, wishId) => openWishForm(groupId, wishId)}
        onOpenEnvelope={(groupId) => openGroup(groupId, 'sobre')}
        onOpenNotifications={() => navigateTo('notifications')}
        hasNotifications={hasNotifications}
        onNavigateTab={handleNavigateTab}
        chatUnread={chatUnread}
        onProfilePress={() => handleNavigateTab('perfil')}
      />
    );
  } else {
    content = (
      <DashboardScreen
        user={user}
        onNavigateToCreateGroup={() => navigateTo('createGroup')}
        onOpenNotifications={() => navigateTo('notifications')}
        onJoinGroup={() => navigateTo('joinGroup')}
        onNavigateTab={handleNavigateTab}
        onOpenGroup={(groupId, tab = 'resumen', askAlias = false) => openGroup(groupId, tab, askAlias)}
      />
    );
  }

  // Mientras cargan las fuentes se muestra el fondo de marca; si fallan, se sigue con las del sistema
  if (!fontsLoaded && !fontError) {
    return <SafeAreaProvider style={{ flex: 1, backgroundColor: theme.colors.surface }} />;
  }

  // Restaurando la sesión guardada (token en el almacenamiento seguro)
  if (status === 'restoring') {
    return (
      <SafeAreaProvider style={{ flex: 1, backgroundColor: theme.colors.surface }}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <View style={authStyles.splash} accessibilityLabel="Cargando EntrePanas">
          <Image source={BRAND_LOGO} style={authStyles.splashLogo} />
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      {content}
      <AppDialogHost />
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
