import React from 'react';
import { View, Text, TouchableOpacity, Pressable, Image } from 'react-native';
import { Calendar, Banknote, MapPin, ChevronRight, Lock, Gift, Mail, LockOpen, PartyPopper, Crown } from 'lucide-react-native';
import { theme, dashboardStyles } from '../../styles';
import type { GroupSummary } from '../../api/groups';
import { formatBudget } from '../../utils/format';
import { exchangeCountdown, monthYear, shortExchangeDate } from '../../utils/groupLabels';

interface Props {
  group: GroupSummary;
  /** Abre el detalle; 'sobre' entra directo a Mi sobre */
  onOpen: (groupId: string, tab?: 'resumen' | 'sobre', askAlias?: boolean) => void;
}

const AVATAR_COLORS = ['#FFD79D', '#B8E1FF', '#D5F2E3', '#FFD3E0'];

function MemberStack({ group }: { group: GroupSummary }) {
  const extra = Math.max(0, group.memberCount - group.memberPreview.length);
  return (
    <View style={[dashboardStyles.avatarStack, { paddingLeft: 8 }]} accessibilityLabel={`${group.memberCount} panas en el grupo`}>
      {group.memberPreview.map((m, i) => (
        <View
          key={i}
          style={[dashboardStyles.stackAvatar, dashboardStyles.stackInitials, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}
        >
          {m.photo ? (
            <Image source={{ uri: m.photo }} style={dashboardStyles.stackPhoto} />
          ) : (
            <Text style={dashboardStyles.stackInitialsText}>{m.initials}</Text>
          )}
        </View>
      ))}
      {extra > 0 && (
        <View style={dashboardStyles.stackBadge}>
          <Text style={dashboardStyles.stackBadgeText}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

export const GroupCard: React.FC<Props> = ({ group, onOpen }) => {
  const isCreator = group.myRole === 'CREATOR';
  const budget = formatBudget(group.currency, group.budgetMin, group.budgetMax);
  const emoji = group.emoji || '🎁';
  const open = (tab: 'resumen' | 'sobre' = 'resumen') => onOpen(group.id, tab);

  /* -------- Encabezado: subtítulo y estado según la etapa del grupo -------- */
  let subtitle: React.ReactNode;
  let badge: React.ReactNode;
  let iconBg: string = theme.colors.surfaceContainerHigh;

  if (group.status === 'WAITING') {
    subtitle = (
      <View style={dashboardStyles.groupDateRow}>
        {isCreator ? <Calendar size={13} color={theme.colors.textMuted} /> : <Crown size={13} color={theme.colors.textMuted} />}
        <Text style={dashboardStyles.groupDateText} numberOfLines={1}>
          {isCreator ? shortExchangeDate(group.exchangeDate) : `Organiza: ${group.creatorName}`}
        </Text>
      </View>
    );
    badge = (
      <View style={dashboardStyles.statusBadgePending}>
        <View style={dashboardStyles.statusDotPending} />
        <Text style={dashboardStyles.statusTextPending}>{isCreator ? 'Esperando panas' : 'Esperando sorteo'}</Text>
      </View>
    );
  } else if (group.status === 'LOCKED') {
    iconBg = theme.colors.secondaryFixed;
    subtitle = (
      <View style={dashboardStyles.groupDateRow}>
        <Lock size={13} color={theme.colors.textMuted} />
        <Text style={dashboardStyles.groupDateText}>Papelitos asignados</Text>
      </View>
    );
    badge = (
      <View style={dashboardStyles.statusBadgeReady}>
        <Gift size={13} color={theme.colors.primary} />
        <Text style={dashboardStyles.statusTextReady}>¡Sorteo listo!</Text>
      </View>
    );
  } else if (group.status === 'REVEALED') {
    iconBg = theme.colors.secondaryFixed;
    subtitle = (
      <View style={dashboardStyles.groupDateRow}>
        <PartyPopper size={13} color={theme.colors.textMuted} />
        <Text style={dashboardStyles.groupDateText}>Ya se reveló quién era quién</Text>
      </View>
    );
    badge = (
      <View style={dashboardStyles.statusBadgeReady}>
        <PartyPopper size={13} color={theme.colors.primary} />
        <Text style={dashboardStyles.statusTextReady}>¡Destape!</Text>
      </View>
    );
  } else {
    iconBg = theme.colors.surfaceContainer;
    subtitle = <Text style={dashboardStyles.groupDateText}>Finalizado en {monthYear(group.completedAt || group.exchangeDate)}</Text>;
    badge = (
      <View style={dashboardStyles.statusBadgeHistory}>
        <Text style={dashboardStyles.statusTextHistory}>Histórico</Text>
      </View>
    );
  }

  const progress = Math.min(1, group.memberCount / Math.max(1, group.maxParticipants));

  return (
    <Pressable
      onPress={() => open()}
      style={({ pressed }) => [dashboardStyles.groupCard, group.status === 'COMPLETED' && { opacity: 0.88 }, pressed && dashboardStyles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Grupo ${group.name}`}
    >
      {group.status === 'WAITING' && <View style={dashboardStyles.cardAccentLine} />}

      <View style={dashboardStyles.cardHeaderRow}>
        <View style={dashboardStyles.cardTitleLeft}>
          <View style={[dashboardStyles.groupIconBox, { backgroundColor: iconBg }]}>
            <Text style={[dashboardStyles.groupIconEmoji, group.status === 'COMPLETED' && { opacity: 0.6 }]}>{emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={dashboardStyles.groupTitleRow}>
              <Text style={[dashboardStyles.groupTitleText, { flexShrink: 1 }]} numberOfLines={1}>
                {group.name}
              </Text>
              {isCreator && group.status !== 'COMPLETED' && <Text style={{ fontSize: 13 }}>⭐</Text>}
            </View>
            {subtitle}
          </View>
        </View>
        {badge}
      </View>

      {group.status === 'WAITING' && (
        <>
          {!group.myAlias && (
            <TouchableOpacity style={dashboardStyles.aliasHint} activeOpacity={0.85} onPress={() => onOpen(group.id, 'resumen', true)}>
              <Text style={{ fontSize: 16 }}>🥸</Text>
              <Text style={dashboardStyles.aliasHintText}>Elige tu alias antes del sorteo</Text>
              <ChevronRight size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          )}

          <View style={dashboardStyles.chipsRow}>
            <View style={dashboardStyles.infoChip}>
              <View style={dashboardStyles.chipIconBox}>
                <Banknote size={16} color={theme.colors.secondaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={dashboardStyles.chipLabel}>Presupuesto</Text>
                <Text style={dashboardStyles.chipValue} numberOfLines={1}>
                  {budget}
                </Text>
              </View>
            </View>
            <View style={dashboardStyles.infoChip}>
              <View style={dashboardStyles.chipIconBoxAlt}>
                {group.locationName ? <MapPin size={16} color={theme.colors.primary} /> : <Calendar size={16} color={theme.colors.primary} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={dashboardStyles.chipLabel}>{group.locationName ? 'Lugar' : 'Intercambio'}</Text>
                <Text style={dashboardStyles.chipValue} numberOfLines={1}>
                  {group.locationName || shortExchangeDate(group.exchangeDate).split(' · ')[0]}
                </Text>
              </View>
            </View>
          </View>

          <View style={dashboardStyles.progressSection}>
            <View style={dashboardStyles.progressHeader}>
              <Text style={dashboardStyles.progressLabel}>Panas en el grupo</Text>
              <Text style={dashboardStyles.progressCount}>
                {group.memberCount} de {group.maxParticipants}
              </Text>
            </View>
            <View style={dashboardStyles.progressBarTrack}>
              <View style={[dashboardStyles.progressBarFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
          </View>

          <View style={dashboardStyles.cardFooter}>
            <MemberStack group={group} />
            <TouchableOpacity style={dashboardStyles.btnManage} activeOpacity={0.8} onPress={() => open()}>
              <Text style={dashboardStyles.btnManageText}>{isCreator ? 'Gestionar' : 'Ver grupo'}</Text>
              <ChevronRight size={14} color={theme.colors.textDark} />
            </TouchableOpacity>
          </View>
        </>
      )}

      {(group.status === 'LOCKED' || group.status === 'REVEALED') && (
        <>
          <View style={dashboardStyles.envelopeHighlightCard}>
            <View style={dashboardStyles.envelopeLeft}>
              <View style={dashboardStyles.envelopeIconPill}>
                {group.status === 'REVEALED' ? (
                  <PartyPopper size={20} color={theme.colors.primary} />
                ) : (
                  <Mail size={20} color={theme.colors.primary} />
                )}
              </View>
              <View style={dashboardStyles.envelopeTextContainer}>
                <Text style={dashboardStyles.envelopeTitle}>
                  {group.status === 'REVEALED'
                    ? '¡Llegó el destape!'
                    : group.envelopeOpened
                      ? 'Ya abriste tu sobre'
                      : 'Tienes tu sobre sellado'}
                </Text>
                <Text style={dashboardStyles.envelopeSub}>
                  {group.status === 'REVEALED' ? 'Mira quién era tu pana secreto' : exchangeCountdown(group.exchangeDate)}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={dashboardStyles.btnOpenEnvelope} activeOpacity={0.85} onPress={() => open('sobre')}>
              <Text style={dashboardStyles.btnOpenEnvelopeText}>
                {group.status === 'LOCKED' && !group.envelopeOpened ? 'Abrir' : 'Ver'}
              </Text>
              <LockOpen size={13} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
          <View style={dashboardStyles.cardFooter}>
            <View style={dashboardStyles.footerMeta}>
              <View style={dashboardStyles.footerDot} />
              <Text style={dashboardStyles.footerMetaText}>{group.memberCount} panas en el sorteo</Text>
            </View>
            <Text style={dashboardStyles.footerBudget}>{budget}</Text>
          </View>
        </>
      )}

      {group.status === 'COMPLETED' && (
        <View style={dashboardStyles.cardFooter}>
          <Text style={dashboardStyles.footerMetaText}>{group.memberCount} panas participaron</Text>
          <View style={dashboardStyles.linkAction}>
            <Text style={dashboardStyles.linkActionText}>Ver recuerdo</Text>
            <ChevronRight size={14} color={theme.colors.secondaryDark} />
          </View>
        </View>
      )}
    </Pressable>
  );
};

export default GroupCard;
