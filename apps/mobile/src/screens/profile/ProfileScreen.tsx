import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StatusBar } from 'react-native';
import { Alert } from '../../components/common/AppDialog';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Settings,
  Camera,
  KeyRound,
  UserRound,
  Lock,
  Mail,
  MessageSquare,
  Info,
  CircleHelp,
  Shield,
  Headset,
  FileText,
  LogOut,
} from 'lucide-react-native';
import { theme, profileStyles as styles } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';
import { APP_VERSION } from '../../constants/app';
import { ContactModal } from '../../components/profile/ContactModal';
import { FloatingTabBar, type DashboardTab } from '../../components/common/FloatingTabBar';
import { MenuRow } from '../../components/profile/MenuRow';
import { choosePhotoSource, initialsOf } from '../../utils/pickImage';
import type { ProfileView } from '../../types/session';

interface ProfileScreenProps {
  profile: ProfileView;
  stats: { groups: number; wishes: number; exchanges: number };
  onProfileChange: (profile: ProfileView) => void;
  onEditProfile: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
  onNavigateTab: (tab: DashboardTab) => void;
  onOpenLegal: (document: 'terminos' | 'privacidad') => void;
  chatUnread?: number;
}

const HOW_IT_WORKS =
  '1. Crea un grupo o únete con un código.\n' +
  '2. Arma tu lista de deseos con fotos.\n' +
  '3. La organización hace el sorteo y cada quien abre su sobre.\n' +
  '4. Pregunta en los comentarios de cada deseo y lanza pistas en el chat, siempre con alias.\n' +
  '5. El día del intercambio se revela quién le regaló a quién. 🎁';

/** Pestaña "Perfil": datos, estadísticas, cuenta, avisos, ayuda y cerrar sesión */
export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  stats,
  onProfileChange,
  onEditProfile,
  onChangePassword,
  onLogout,
  onNavigateTab,
  onOpenLegal,
  chatUnread = 0,
}) => {
  const insets = useSafeAreaInsets();
  const [contactOpen, setContactOpen] = useState(false);

  // Al conectar la API: POST /api/user/upload (campo "photo", carpeta avatars de Cloudinary)
  const changePhoto = () =>
    choosePhotoSource(
      [1, 1],
      (uri) => onProfileChange({ ...profile, photoUri: uri }),
      profile.photoUri ? () => onProfileChange({ ...profile, photoUri: null }) : undefined
    );

  const confirmLogout = () =>
    Alert.alert('¿Cerrar sesión?', 'Tus grupos y deseos quedan guardados para cuando vuelvas.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: onLogout },
    ]);

  const statItems = [
    { value: stats.groups, label: 'Grupos' },
    { value: stats.wishes, label: 'Deseos' },
    { value: stats.exchanges, label: 'Intercambios' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Íconos claros sobre el encabezado azul marino (se restaura al salir) */}
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 96 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado azul marino */}
        <View style={[styles.hero, { paddingTop: insets.top + 4 }]}>
          <View style={styles.heroTop}>
            <Text style={styles.heroTitle}>Mi Perfil</Text>
            <TouchableOpacity style={styles.heroAction} onPress={onEditProfile} accessibilityLabel="Ajustes de la cuenta">
              <Settings size={24} color={theme.colors.white} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.avatarWrap} onPress={changePhoto} activeOpacity={0.85} accessibilityLabel="Cambiar foto">
            <View style={styles.avatar}>
              {profile.photoUri ? (
                <Image source={{ uri: profile.photoUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{initialsOf(profile.fullname)}</Text>
              )}
            </View>
            <View style={styles.cameraBadge}>
              <Camera size={16} color={theme.colors.primary} strokeWidth={2.4} />
            </View>
          </TouchableOpacity>

          <Text style={styles.heroName}>{profile.fullname}</Text>
          <Text style={styles.heroEmail}>{profile.email}</Text>

          <View style={styles.statsRow}>
            {statItems.map((s) => (
              <View key={s.label} style={styles.stat}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.scrollContent}>
          <View style={styles.anonCard}>
            <Image source={BRAND_ISOTIPO} style={styles.anonMascot} />
            <View style={{ flex: 1 }}>
              <View style={styles.anonTitleRow}>
                <KeyRound size={18} color={theme.colors.secondary} strokeWidth={2.4} />
                <Text style={styles.anonTitle}>Anonimato 100% blindado</Text>
              </View>
              <Text style={styles.anonText}>
                ¡Tranquilo pana! Ningún miembro sabrá quién eres ni a quién le regalas hasta la fiesta de revelación.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>CUENTA</Text>
          <View style={styles.menuCard}>
            <MenuRow icon={UserRound} title="Editar perfil" subtitle="Nombre, foto y apodo festivo" onPress={onEditProfile} />
            <MenuRow icon={Lock} title="Cambiar contraseña" subtitle="Actualiza tu clave de acceso" onPress={onChangePassword} divider />
          </View>

          <Text style={styles.sectionLabel}>NOTIFICACIONES</Text>
          <View style={styles.menuCard}>
            <MenuRow
              icon={Mail}
              title="Correos de EntrePanas"
              subtitle="Sorteos, invitaciones y asignaciones"
              value={profile.notifyEmail}
              onValueChange={(v) => onProfileChange({ ...profile, notifyEmail: v })}
            />
            <MenuRow
              icon={MessageSquare}
              title="Avisos de comentarios"
              subtitle="Preguntas de tus deseos y pistas del chat"
              value={profile.notifyComments}
              onValueChange={(v) => onProfileChange({ ...profile, notifyComments: v })}
              divider
            />
            {(!profile.notifyEmail || !profile.notifyComments) && (
              <View style={styles.infoBox}>
                <Info size={18} color={theme.colors.accentDark} strokeWidth={2.4} />
                <Text style={styles.infoText}>Actívalos para que no te pierdas las pistas secretas ni los mensajes de tu grupo.</Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionLabel}>AYUDA Y SOPORTE</Text>
          <View style={styles.menuCard}>
            <MenuRow
              icon={CircleHelp}
              title="¿Cómo funciona EntrePanas?"
              subtitle="Reglas del juego, sorteo y sobres"
              onPress={() => Alert.alert('¿Cómo funciona EntrePanas?', HOW_IT_WORKS)}
            />
            <MenuRow
              icon={FileText}
              title="Términos y condiciones"
              subtitle="Reglas para usar EntrePanas"
              onPress={() => onOpenLegal('terminos')}
              divider
            />
            <MenuRow
              icon={Shield}
              title="Política de privacidad"
              subtitle="Qué datos guardamos y cómo los cuidamos"
              onPress={() => onOpenLegal('privacidad')}
              divider
            />
            <MenuRow
              icon={Headset}
              title="Contáctanos"
              subtitle="Correo y teléfono del equipo de EntrePanas"
              onPress={() => setContactOpen(true)}
              divider
            />
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout} activeOpacity={0.85}>
            <LogOut size={20} color={theme.colors.danger} strokeWidth={2.4} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
          <Text style={styles.version}>EntrePanas v{APP_VERSION}</Text>
        </View>
      </ScrollView>

      {contactOpen && <ContactModal visible onClose={() => setContactOpen(false)} />}
      <FloatingTabBar activeTab="perfil" onTabChange={onNavigateTab} badges={{ chats: chatUnread }} />
    </SafeAreaView>
  );
};

export default ProfileScreen;
