import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { UserCheck, BadgeCheck, MoreVertical, ArrowRight } from 'lucide-react-native';
import { theme, groupDetailStyles as styles } from '../../styles';
import type { GroupMemberPreview } from '../../types/session';

const VISIBLE_MEMBERS = 5;
const MINI_COLORS = [theme.colors.surfaceContainer, theme.colors.secondaryFixed, theme.colors.accentContainer];

interface Props {
  members: GroupMemberPreview[];
  membersCount: number;
  maxMembers: number;
  /** La organización puede abrir el menú de cada pana (p. ej. quitarlo antes del sorteo) */
  canManage: boolean;
  onMemberMenu: (member: GroupMemberPreview) => void;
  onSeeAll: () => void;
}

/** Lista de panas confirmados con barra de cupo */
export const MembersCard: React.FC<Props> = ({ members, membersCount, maxMembers, canManage, onMemberMenu, onSeeAll }) => {
  const visible = members.slice(0, VISIBLE_MEMBERS);
  const rest = members.slice(VISIBLE_MEMBERS);
  const hidden = membersCount - visible.length;
  const fill = Math.min(100, Math.round((membersCount / Math.max(maxMembers, 1)) * 100));

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <UserCheck size={22} color={theme.colors.primary} strokeWidth={2.2} />
        <Text style={[styles.sectionTitle, styles.sectionTitleBox]}>Panas confirmados</Text>
        <Text style={styles.sectionCounter}>
          {membersCount} / {maxMembers}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${fill}%` }]} />
      </View>

      <View>
        {visible.map((m, i) => (
          <View key={m.id} style={[styles.memberRow, i > 0 && styles.memberDivider]}>
            <View style={[styles.avatar, m.isMe && styles.avatarMe]}>
              <Text style={[styles.avatarText, m.isMe && styles.avatarTextMe]}>{m.initials}</Text>
            </View>
            <View style={styles.memberInfo}>
              <View style={styles.memberNameRow}>
                <Text style={styles.memberName} numberOfLines={1}>
                  {m.fullname}
                </Text>
                {(m.isMe || m.isOrganizer) && (
                  <View style={styles.meChip}>
                    <Text style={styles.meChipText}>
                      {[m.isMe && 'Tú', m.isOrganizer && 'Org'].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.memberSubtitle, m.wishlistReady && styles.memberSubtitleReady]}>{m.subtitle}</Text>
            </View>
            {m.isMe ? (
              <BadgeCheck size={24} color={theme.colors.accent} strokeWidth={2} />
            ) : (
              canManage && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => onMemberMenu(m)}
                  accessibilityLabel={`Opciones de ${m.fullname}`}
                >
                  <MoreVertical size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
              )
            )}
          </View>
        ))}
      </View>

      {hidden > 0 && (
        <TouchableOpacity style={styles.moreMembers} onPress={onSeeAll} activeOpacity={0.8}>
          <View style={styles.miniAvatars}>
            {rest.slice(0, 3).map((m, i) => (
              <View
                key={m.id}
                style={[styles.miniAvatar, { backgroundColor: MINI_COLORS[i % MINI_COLORS.length], marginLeft: i ? -8 : 0 }]}
              >
                <Text style={styles.miniAvatarText}>{m.initials}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.moreMembersText}>
            +{hidden} {hidden === 1 ? 'pana más' : 'panas más'}
          </Text>
          <View style={styles.seeAll}>
            <Text style={styles.linkText}>Ver todos</Text>
            <ArrowRight size={16} color={theme.colors.accentDark} strokeWidth={2.4} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default MembersCard;
