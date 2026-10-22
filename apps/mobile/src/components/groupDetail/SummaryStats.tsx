import React from 'react';
import { View, Text } from 'react-native';
import { CalendarDays, Banknote, Users, type LucideIcon } from 'lucide-react-native';
import { theme, groupDetailStyles as styles } from '../../styles';
import { formatBudget } from '../../utils/format';
import type { GroupDetailView } from '../../types/session';

interface Stat {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  hint: string;
  hintColor: string;
}

/** Fila de tres datos clave: fecha, presupuesto y cupo */
export const SummaryStats: React.FC<{ group: GroupDetailView }> = ({ group }) => {
  const fill = Math.round((group.membersCount / Math.max(group.maxMembers, 1)) * 100);
  const stats: Stat[] = [
    {
      icon: CalendarDays,
      iconColor: theme.colors.primary,
      iconBg: theme.colors.surfaceContainer,
      label: 'Intercambio',
      value: group.exchangeDateLabel,
      hint: group.exchangeTimeLabel,
      hintColor: theme.colors.textMuted,
    },
    {
      icon: Banknote,
      iconColor: theme.colors.secondaryDark,
      iconBg: theme.colors.secondaryFixed,
      label: 'Presupuesto',
      value: formatBudget(group.currency, group.budgetMin, group.budgetMax),
      hint: group.currency === 'USD' ? 'USD fijo' : 'Bolívares',
      hintColor: theme.colors.secondaryDark,
    },
    {
      icon: Users,
      iconColor: theme.colors.accentDark,
      iconBg: theme.colors.accentContainer,
      label: 'Panas listos',
      value: `${group.membersCount} / ${group.maxMembers}`,
      hint: `${fill}% lleno`,
      hintColor: theme.colors.accentDark,
    },
  ];

  return (
    <View style={styles.statsRow}>
      {stats.map(({ icon: Icon, ...s }) => (
        <View key={s.label} style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: s.iconBg }]}>
            <Icon size={18} color={s.iconColor} strokeWidth={2.2} />
          </View>
          <Text style={styles.statLabel}>{s.label}</Text>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
            {s.value}
          </Text>
          <Text style={[styles.statHint, { color: s.hintColor }]}>{s.hint}</Text>
        </View>
      ))}
    </View>
  );
};

export default SummaryStats;
