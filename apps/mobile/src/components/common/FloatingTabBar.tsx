import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gift, Mail, MessageSquare, Sparkles } from 'lucide-react-native';
import { theme, dashboardStyles } from '../../styles';

export type DashboardTab = 'grupos' | 'papelitos' | 'chat' | 'mipana';

interface FloatingTabBarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const insets = useSafeAreaInsets();

  const tabs: Array<{ id: DashboardTab; label: string; icon: any }> = [
    { id: 'grupos', label: 'Grupos', icon: Gift },
    { id: 'papelitos', label: 'Papelitos', icon: Mail },
    { id: 'chat', label: 'Chat Secreto', icon: MessageSquare },
    { id: 'mipana', label: 'Mi Pana', icon: Sparkles },
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

          return (
            <TouchableOpacity
              key={tab.id}
              style={dashboardStyles.tabItem}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.7}
            >
              <View style={dashboardStyles.tabIconWrapper}>
                <IconComponent
                  size={22}
                  color={isActive ? theme.colors.primary : theme.colors.outline}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
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
