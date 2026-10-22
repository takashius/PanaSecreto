import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LayoutGrid, Lock, MailOpen, MessagesSquare, type LucideIcon } from 'lucide-react-native';
import { theme, groupDetailStyles as styles } from '../../styles';

export type GroupDetailTab = 'resumen' | 'sobre' | 'chat';

interface Props {
  active: GroupDetailTab;
  onChange: (tab: GroupDetailTab) => void;
  /** Antes del sorteo el sobre está cerrado (candado) */
  envelopeLocked: boolean;
  unreadChat: number;
}

/** Selector segmentado Resumen · Mi sobre · Chat */
export const GroupDetailTabs: React.FC<Props> = ({ active, onChange, envelopeLocked, unreadChat }) => {
  const tabs: Array<{ id: GroupDetailTab; label: string; icon: LucideIcon }> = [
    { id: 'resumen', label: 'Resumen', icon: LayoutGrid },
    { id: 'sobre', label: 'Mi sobre', icon: envelopeLocked ? Lock : MailOpen },
    { id: 'chat', label: 'Chat', icon: MessagesSquare },
  ];

  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <TouchableOpacity
            key={id}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onChange(id)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Icon size={18} color={isActive ? theme.colors.white : theme.colors.outline} strokeWidth={2.2} />
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
            {id === 'chat' && unreadChat > 0 && !isActive && <View style={styles.tabDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default GroupDetailTabs;
