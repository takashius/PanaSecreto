import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Bell, type LucideIcon } from 'lucide-react-native';
import { theme, dashboardStyles } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';
import { useAuth } from '../../auth/AuthContext';

interface Props {
  title: string;
  icon: LucideIcon;
  hasNotifications?: boolean;
  onBellPress: () => void;
  onAvatarPress: () => void;
}

/** Encabezado de las pestañas principales: marca, título, campana y avatar */
export const MainHeader: React.FC<Props> = ({ title, icon: Icon, hasNotifications = true, onBellPress, onAvatarPress }) => {
  const { user } = useAuth();
  return (
  <View style={dashboardStyles.header}>
    <View style={dashboardStyles.headerBrandRow}>
      <View style={dashboardStyles.headerIconPill}>
        <Icon size={20} color={theme.colors.primary} />
      </View>
      <View>
        <Text style={dashboardStyles.headerBrandSub}>EntrePanas</Text>
        <Text style={dashboardStyles.headerTitle}>{title}</Text>
      </View>
    </View>

    <View style={dashboardStyles.headerActions}>
      <TouchableOpacity
        style={dashboardStyles.bellButton}
        activeOpacity={0.7}
        onPress={onBellPress}
        accessibilityLabel="Notificaciones"
      >
        <Bell size={20} color={theme.colors.textDark} />
        {hasNotifications && <View style={dashboardStyles.bellBadge} />}
      </TouchableOpacity>
      <TouchableOpacity
        style={dashboardStyles.profileAvatarButton}
        activeOpacity={0.8}
        onPress={onAvatarPress}
        accessibilityLabel="Perfil"
      >
        <Image source={user?.photo ? { uri: user.photo } : BRAND_ISOTIPO} style={dashboardStyles.profileAvatar} />
      </TouchableOpacity>
    </View>
  </View>
  );
};

export default MainHeader;
