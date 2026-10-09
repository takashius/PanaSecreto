import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import {
  PartyPopper,
  Bell,
  PlusCircle,
  ArrowRight,
  Crown,
  Users,
  Calendar,
  Banknote,
  Wine,
  ChevronRight,
  Lock,
  Gift,
  Mail,
  LockOpen,
  RotateCcw,
  Smartphone,
  LogOut,
} from 'lucide-react-native';
import { theme, dashboardStyles, commonStyles } from '../../styles';
import { FloatingTabBar, DashboardTab } from '../../components/common/FloatingTabBar';

interface DashboardScreenProps {
  user?: any;
  onLogout?: () => void;
  onNavigateToCreateGroup?: () => void;
}

export default function DashboardScreen({
  user,
  onLogout,
  onNavigateToCreateGroup,
}: DashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedSegment, setSelectedSegment] = useState<'creados' | 'participo'>('creados');
  const [activeTab, setActiveTab] = useState<DashboardTab>('grupos');

  const fullName = user?.fullname || user?.identifier || 'Carlos';
  const firstName = fullName.split(' ')[0] || 'Carlos';

  const handleOpenEnvelope = () => {
    Alert.alert(
      '🎁 ¡Sobre Secreto Abierto!',
      'Tu Pana Secreto asignado es:\n\n✨ María Rodríguez ✨\n\nPresupuesto: Máx $15\nFecha de entrega: en 4 días\n\n¡Recuerda mantener el secreto hasta la parranda! 🤫'
    );
  };

  const handleCreateGroup = () => {
    if (onNavigateToCreateGroup) {
      onNavigateToCreateGroup();
    } else {
      Alert.alert(
        'Nuevo Grupo',
        '¡Pronto podrás configurar tu grupo, fijar reglas de exclusión y armar el sorteo!'
      );
    }
  };

  const handleEnterCode = () => {
    Alert.prompt
      ? Alert.prompt(
          'Código de Invitación',
          'Ingresa el código o enlace que te compartieron tus panas:',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Unirme',
              onPress: (code?: string) =>
                Alert.alert('¡Éxito!', `Te has unido al grupo con el código ${code || 'PANA-2024'}`),
            },
          ]
        )
      : Alert.alert(
          'Código de Invitación',
          'Ingresa el código que te compartieron tus panas para unirte a su intercambio.'
        );
  };

  const handleProfilePress = () => {
    Alert.alert(
      `Perfil de Pana`,
      `Sesión activa como ${fullName}.\n¿Deseas cerrar tu sesión?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: onLogout },
      ]
    );
  };

  return (
    <SafeAreaView style={dashboardStyles.container} edges={['top']}>
      {/* 1. Top Bar / App Header */}
      <View style={dashboardStyles.header}>
        <View style={dashboardStyles.headerBrandRow}>
          <View style={dashboardStyles.headerIconPill}>
            <PartyPopper size={20} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={dashboardStyles.headerBrandSub}>PanaSecreto</Text>
            <Text style={dashboardStyles.headerTitle}>Mis Grupos</Text>
          </View>
        </View>

        <View style={dashboardStyles.headerActions}>
          <TouchableOpacity
            style={dashboardStyles.bellButton}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert('Notificaciones', '¡Todo al día! No tienes notificaciones pendientes.')
            }
          >
            <Bell size={20} color={theme.colors.textDark} />
            <View style={dashboardStyles.bellBadge} />
          </TouchableOpacity>

          <TouchableOpacity
            style={dashboardStyles.profileAvatarButton}
            activeOpacity={0.8}
            onPress={handleProfilePress}
          >
            <Image
              source={require('../../../assets/icon.png')}
              style={dashboardStyles.profileAvatar}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Scrollable Dashboard Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 16) + 90, // Margen suficiente para el tab flotante
        }}
      >
        {/* Saludo & Quick CTA */}
        <View style={dashboardStyles.greetingRow}>
          <View style={dashboardStyles.greetingTextContainer}>
            <Text style={dashboardStyles.greetingSub} numberOfLines={1}>
              ¡Activo pal' intercambio!
            </Text>
            <Text
              style={dashboardStyles.greetingTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              ¡Epa, {firstName}! 👋
            </Text>
          </View>

          <TouchableOpacity
            style={dashboardStyles.btnCreateGroup}
            activeOpacity={0.85}
            onPress={handleCreateGroup}
          >
            <PlusCircle size={18} color={theme.colors.primary} />
            <Text style={dashboardStyles.btnCreateGroupText}>Crear Grupo</Text>
          </TouchableOpacity>
        </View>

        {/* Banner Mascota ("Tip del Guaca") */}
        <View style={dashboardStyles.mascotBanner}>
          <View style={dashboardStyles.mascotBannerGlow} pointerEvents="none">
            <Svg width="200" height="200" viewBox="0 0 200 200">
              <Defs>
                <RadialGradient
                  id="guacaGlowGrad"
                  cx="65%"
                  cy="65%"
                  r="60%"
                  fx="65%"
                  fy="65%"
                >
                  <Stop offset="0%" stopColor="#FEAE10" stopOpacity="0.45" />
                  <Stop offset="35%" stopColor="#FEAE10" stopOpacity="0.22" />
                  <Stop offset="70%" stopColor="#20153A" stopOpacity="0.08" />
                  <Stop offset="100%" stopColor="#20153A" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Rect x="0" y="0" width="200" height="200" fill="url(#guacaGlowGrad)" />
            </Svg>
          </View>
          <View style={dashboardStyles.mascotBannerContent}>
            <View style={dashboardStyles.mascotAvatarWrapper}>
              <Image
                source={require('../../../assets/icon.png')}
                style={dashboardStyles.mascotAvatarImage}
              />
              <View style={dashboardStyles.mascotStarBadge}>
                <Text style={dashboardStyles.mascotStarText}>✦</Text>
              </View>
            </View>

            <View style={dashboardStyles.mascotBannerBody}>
              <View style={dashboardStyles.tipBadge}>
                <Text style={dashboardStyles.tipBadgeText}>Tip del Guaca</Text>
              </View>
              <Text style={dashboardStyles.mascotBannerTitle}>
                ¡Ponte las pilas con tu lista!
              </Text>
              <Text style={dashboardStyles.mascotBannerSub}>
                Sube qué te cuadra recibir para que tu Pana Secreto no te regale unas medias aburridas.
              </Text>
            </View>

            <TouchableOpacity
              style={dashboardStyles.mascotArrowButton}
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert(
                  'Lista de Deseos',
                  'Pronto podrás armar tu lista de regalos para que tu pana secreto la vea en secreto.'
                )
              }
            >
              <ArrowRight size={18} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Segmented Control / Filtros */}
        <View style={dashboardStyles.segmentedContainer}>
          <TouchableOpacity
            style={[
              dashboardStyles.segmentTab,
              selectedSegment === 'creados' && dashboardStyles.segmentTabActive,
            ]}
            onPress={() => setSelectedSegment('creados')}
            activeOpacity={0.8}
          >
            <Crown
              size={16}
              color={
                selectedSegment === 'creados'
                  ? theme.colors.primary
                  : theme.colors.textMuted
              }
            />
            <Text
              style={[
                dashboardStyles.segmentText,
                selectedSegment === 'creados' && dashboardStyles.segmentTextActive,
              ]}
            >
              Mis Grupos
            </Text>
            <View
              style={[
                dashboardStyles.segmentBadge,
                selectedSegment === 'creados' && dashboardStyles.segmentBadgeActive,
              ]}
            >
              <Text
                style={[
                  dashboardStyles.segmentBadgeText,
                  selectedSegment === 'creados' && dashboardStyles.segmentBadgeTextActive,
                ]}
              >
                2
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              dashboardStyles.segmentTab,
              selectedSegment === 'participo' && dashboardStyles.segmentTabActive,
            ]}
            onPress={() => setSelectedSegment('participo')}
            activeOpacity={0.8}
          >
            <Users
              size={16}
              color={
                selectedSegment === 'participo'
                  ? theme.colors.primary
                  : theme.colors.textMuted
              }
            />
            <Text
              style={[
                dashboardStyles.segmentText,
                selectedSegment === 'participo' && dashboardStyles.segmentTextActive,
              ]}
            >
              Participo
            </Text>
            <View
              style={[
                dashboardStyles.segmentBadge,
                selectedSegment === 'participo' && dashboardStyles.segmentBadgeActive,
              ]}
            >
              <Text
                style={[
                  dashboardStyles.segmentBadgeText,
                  selectedSegment === 'participo' && dashboardStyles.segmentBadgeTextActive,
                ]}
              >
                3
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Lista de Grupos */}
        {selectedSegment === 'creados' ? (
          <View style={dashboardStyles.cardsList}>
            {/* TARJETA 1: La Familia Miranda */}
            <View style={dashboardStyles.groupCard}>
              <View style={dashboardStyles.cardAccentLine} />

              <View style={dashboardStyles.cardHeaderRow}>
                <View style={dashboardStyles.cardTitleLeft}>
                  <View style={dashboardStyles.groupIconBox}>
                    <Text style={dashboardStyles.groupIconEmoji}>🎄</Text>
                  </View>
                  <View>
                    <View style={dashboardStyles.groupTitleRow}>
                      <Text style={dashboardStyles.groupTitleText}>La Familia Miranda</Text>
                      <Text style={{ fontSize: 13 }}>⭐</Text>
                    </View>
                    <View style={dashboardStyles.groupDateRow}>
                      <Calendar size={13} color={theme.colors.textMuted} />
                      <Text style={dashboardStyles.groupDateText}>Límite: 24 de Diciembre</Text>
                    </View>
                  </View>
                </View>

                <View style={dashboardStyles.statusBadgePending}>
                  <View style={dashboardStyles.statusDotPending} />
                  <Text style={dashboardStyles.statusTextPending}>Esperando panas</Text>
                </View>
              </View>

              {/* Chips de Presupuesto y Modalidad */}
              <View style={dashboardStyles.chipsRow}>
                <View style={dashboardStyles.infoChip}>
                  <View style={dashboardStyles.chipIconBox}>
                    <Banknote size={16} color={theme.colors.secondaryDark} />
                  </View>
                  <View>
                    <Text style={dashboardStyles.chipLabel}>Presupuesto</Text>
                    <Text style={dashboardStyles.chipValue}>Máx $25</Text>
                  </View>
                </View>

                <View style={dashboardStyles.infoChip}>
                  <View style={dashboardStyles.chipIconBoxAlt}>
                    <Wine size={16} color={theme.colors.primary} />
                  </View>
                  <View>
                    <Text style={dashboardStyles.chipLabel}>Modalidad</Text>
                    <Text style={dashboardStyles.chipValue}>Parranda & Cena</Text>
                  </View>
                </View>
              </View>

              {/* Barra de Progreso de Integrantes */}
              <View style={dashboardStyles.progressSection}>
                <View style={dashboardStyles.progressHeader}>
                  <Text style={dashboardStyles.progressLabel}>Panas confirmados</Text>
                  <Text style={dashboardStyles.progressCount}>8 de 10 listos</Text>
                </View>
                <View style={dashboardStyles.progressBarTrack}>
                  <View style={[dashboardStyles.progressBarFill, { width: '80%' }]} />
                </View>
              </View>

              {/* Footer con Avatares y Gestionar */}
              <View style={dashboardStyles.cardFooter}>
                <View style={dashboardStyles.avatarStack}>
                  <View style={[dashboardStyles.stackAvatar, { backgroundColor: '#FFD79D', alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 14 }}>👩</Text>
                  </View>
                  <View style={[dashboardStyles.stackAvatar, { backgroundColor: '#B8E1FF', alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 14 }}>👴</Text>
                  </View>
                  <View style={[dashboardStyles.stackAvatar, { backgroundColor: '#D5F2E3', alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 14 }}>👨</Text>
                  </View>
                  <View style={dashboardStyles.stackAvatarEmoji}>
                    <Text style={{ fontSize: 13 }}>🎭</Text>
                  </View>
                  <View style={dashboardStyles.stackBadge}>
                    <Text style={dashboardStyles.stackBadgeText}>+4</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={dashboardStyles.btnManage}
                  activeOpacity={0.8}
                  onPress={() =>
                    Alert.alert('Gestionar Grupo', 'Panel de gestión para La Familia Miranda.')
                  }
                >
                  <Text style={dashboardStyles.btnManageText}>Gestionar</Text>
                  <ChevronRight size={14} color={theme.colors.textDark} />
                </TouchableOpacity>
              </View>
            </View>

            {/* TARJETA 2: Panas de la Oficina (¡Sorteo Listo!) */}
            <View style={dashboardStyles.groupCard}>
              <View style={dashboardStyles.cardHeaderRow}>
                <View style={dashboardStyles.cardTitleLeft}>
                  <View style={[dashboardStyles.groupIconBox, { backgroundColor: theme.colors.secondaryFixed }]}>
                    <Text style={dashboardStyles.groupIconEmoji}>🥂</Text>
                  </View>
                  <View>
                    <Text style={dashboardStyles.groupTitleText}>Panas de la Oficina</Text>
                    <View style={dashboardStyles.groupDateRow}>
                      <Lock size={13} color={theme.colors.textMuted} />
                      <Text style={dashboardStyles.groupDateText}>Papelitos Asignados</Text>
                    </View>
                  </View>
                </View>

                <View style={dashboardStyles.statusBadgeReady}>
                  <Gift size={13} color={theme.colors.primary} />
                  <Text style={dashboardStyles.statusTextReady}>¡Sorteo Listo!</Text>
                </View>
              </View>

              {/* Tarjeta Destacada: Sacar Papelito CTA */}
              <View style={dashboardStyles.envelopeHighlightCard}>
                <View style={dashboardStyles.envelopeLeft}>
                  <View style={dashboardStyles.envelopeIconPill}>
                    <Mail size={20} color={theme.colors.primary} />
                  </View>
                  <View style={dashboardStyles.envelopeTextContainer}>
                    <Text style={dashboardStyles.envelopeTitle}>Tienes tu sobre sellado</Text>
                    <Text style={dashboardStyles.envelopeSub}>El intercambio es en 4 días</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={dashboardStyles.btnOpenEnvelope}
                  activeOpacity={0.85}
                  onPress={handleOpenEnvelope}
                >
                  <Text style={dashboardStyles.btnOpenEnvelopeText}>Abrir</Text>
                  <LockOpen size={13} color={theme.colors.white} />
                </TouchableOpacity>
              </View>

              {/* Meta Info */}
              <View style={dashboardStyles.cardFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.secondaryContainer }} />
                  <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>12/12 miembros completos</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.colors.textDark }}>
                  Máx $15
                </Text>
              </View>
            </View>

            {/* TARJETA 3: Los de la Promo (Grupo Histórico) */}
            <View style={[dashboardStyles.groupCard, { opacity: 0.88 }]}>
              <View style={dashboardStyles.cardHeaderRow}>
                <View style={dashboardStyles.cardTitleLeft}>
                  <View style={[dashboardStyles.groupIconBox, { backgroundColor: theme.colors.surfaceContainer }]}>
                    <Text style={[dashboardStyles.groupIconEmoji, { opacity: 0.6 }]}>🎓</Text>
                  </View>
                  <View>
                    <Text style={dashboardStyles.groupTitleText}>Los de la Promo UCAB</Text>
                    <Text style={dashboardStyles.groupDateText}>Finalizado en Dic 2023</Text>
                  </View>
                </View>

                <View style={dashboardStyles.statusBadgeHistory}>
                  <Text style={dashboardStyles.statusTextHistory}>Histórico</Text>
                </View>
              </View>

              <View style={dashboardStyles.cardFooter}>
                <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>16 panas participaron</Text>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  activeOpacity={0.7}
                  onPress={() =>
                    Alert.alert(
                      'Revivir Grupo',
                      '¿Deseas duplicar este grupo con las mismas reglas para el intercambio de este año?'
                    )
                  }
                >
                  <RotateCcw size={14} color={theme.colors.secondaryDark} />
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.colors.secondaryDark }}>
                    Revivir este año
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* Pestaña "Participo" */
          <View style={dashboardStyles.cardsList}>
            <View style={dashboardStyles.groupCard}>
              <View style={dashboardStyles.cardHeaderRow}>
                <View style={dashboardStyles.cardTitleLeft}>
                  <View style={[dashboardStyles.groupIconBox, { backgroundColor: '#E0F4FF' }]}>
                    <Text style={dashboardStyles.groupIconEmoji}>🎾</Text>
                  </View>
                  <View>
                    <Text style={dashboardStyles.groupTitleText}>Panas del Pádel</Text>
                    <Text style={dashboardStyles.groupDateText}>Organiza: Juan Pérez</Text>
                  </View>
                </View>
                <View style={dashboardStyles.statusBadgePending}>
                  <Text style={dashboardStyles.statusTextPending}>Esperando Sorteo</Text>
                </View>
              </View>

              <View style={dashboardStyles.cardFooter}>
                <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>6 de 8 confirmados</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.colors.textDark }}>Máx $30</Text>
              </View>
            </View>

            <View style={dashboardStyles.groupCard}>
              <View style={dashboardStyles.cardHeaderRow}>
                <View style={dashboardStyles.cardTitleLeft}>
                  <View style={[dashboardStyles.groupIconBox, { backgroundColor: '#FFF0D4' }]}>
                    <Text style={dashboardStyles.groupIconEmoji}>🏫</Text>
                  </View>
                  <View>
                    <Text style={dashboardStyles.groupTitleText}>Amigos del Colegio</Text>
                    <Text style={dashboardStyles.groupDateText}>Organiza: Andrea V.</Text>
                  </View>
                </View>
                <View style={dashboardStyles.statusBadgeReady}>
                  <Gift size={13} color={theme.colors.primary} />
                  <Text style={dashboardStyles.statusTextReady}>¡Listo!</Text>
                </View>
              </View>

              <View style={dashboardStyles.envelopeHighlightCard}>
                <View style={dashboardStyles.envelopeLeft}>
                  <View style={dashboardStyles.envelopeIconPill}>
                    <Mail size={20} color={theme.colors.primary} />
                  </View>
                  <View style={dashboardStyles.envelopeTextContainer}>
                    <Text style={dashboardStyles.envelopeTitle}>Sobre asignado</Text>
                    <Text style={dashboardStyles.envelopeSub}>Entrega el 21 de Diciembre</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={dashboardStyles.btnOpenEnvelope}
                  activeOpacity={0.85}
                  onPress={handleOpenEnvelope}
                >
                  <Text style={dashboardStyles.btnOpenEnvelopeText}>Ver</Text>
                  <LockOpen size={13} color={theme.colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Banner: ¿Te llegó un código? */}
        <View style={dashboardStyles.inviteBanner}>
          <View style={dashboardStyles.inviteLeft}>
            <View style={dashboardStyles.inviteIconBox}>
              <Smartphone size={20} color={theme.colors.secondaryDark} />
            </View>
            <View style={dashboardStyles.inviteTextContainer}>
              <Text style={dashboardStyles.inviteTitle}>¿Te llegó un código?</Text>
              <Text style={dashboardStyles.inviteSub}>
                Únete al grupo de tus panas con tu enlace
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={dashboardStyles.btnInviteEnter}
            activeOpacity={0.85}
            onPress={handleEnterCode}
          >
            <Text style={dashboardStyles.btnInviteEnterText}>Ingresar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 3. Menú Flotante Inferior (Floating Tab Bar) */}
      <FloatingTabBar
        activeTab={activeTab}
        onTabChange={(newTab) => {
          setActiveTab(newTab);
          if (newTab !== 'grupos') {
            Alert.alert(
              `Sección ${newTab === 'papelitos' ? 'Papelitos' : newTab === 'chat' ? 'Chat Secreto' : 'Mi Pana'}`,
              `Esta vista de ${newTab} estará disponible en el próximo paso.`
            );
          }
        }}
      />
    </SafeAreaView>
  );
}
