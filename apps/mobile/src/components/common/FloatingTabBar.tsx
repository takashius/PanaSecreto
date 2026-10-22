import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gift, Heart, MessagesSquare, UserRound, type LucideIcon } from 'lucide-react-native';
import { theme, dashboardStyles } from '../../styles';

/**
 * Pestañas principales de la app (diseño Stitch «Nueva Identidad»):
 * Grupos · Chats (un chat grupal anónimo por grupo) · Mis deseos (lista por grupo) · Perfil.
 * El sobre / papelito y "mi pana" viven dentro del detalle de cada grupo.
 */
export type DashboardTab = 'grupos' | 'chats' | 'deseos' | 'perfil';

interface FloatingTabBarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  /** Contadores opcionales (p. ej. mensajes sin leer en Chats); 0 o ausente no muestra badge */
  badges?: Partial<Record<DashboardTab, number>>;
}

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  activeTab,
  onTabChange,
  badges,
}) => {
  const insets = useSafeAreaInsets();

  const tabs: Array<{ id: DashboardTab; label: string; icon: LucideIcon }> = [
    { id: 'grupos', label: 'Grupos', icon: Gift },
    { id: 'chats', label: 'Chats', icon: MessagesSquare },
    { id: 'deseos', label: 'Mis deseos', icon: Heart },
    { id: 'perfil', label: 'Perfil', icon: UserRound },
  ];

  return (
    <View
      style={[
        dashboardStyles.floatingTabBarContainer,
        { bottom: Math.max(insets.bottom, 12) + 6 },
      ]}
      pointerEvents="box-none"
    >
      <View style={dashboardStyles.floatingTabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;
          const badge = badges?.[tab.id] ?? 0;

          return (
            <TouchableOpacity
              key={tab.id}
              style={dashboardStyles.tabItem}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={badge > 0 ? `${tab.label}, ${badge} sin leer` : tab.label}
            >
              <View style={dashboardStyles.tabIconWrapper}>
                <IconComponent
                  size={22}
                  color={isActive ? theme.colors.primary : theme.colors.outline}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
                {badge > 0 && (
                  <View style={dashboardStyles.tabBadge}>
                    <Text style={dashboardStyles.tabBadgeText}>{badge > 9 ? '9+' : badge}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  dashboardStyles.tabLabel,
                  isActive && dashboardStyles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default FloatingTabBar;
