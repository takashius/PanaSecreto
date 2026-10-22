import React from "react";
import { View, Text, Image } from "react-native";
import { theme, groupDetailStyles as styles } from "../../styles";
import { BRAND_ISOTIPO } from "../../constants/brand";
import type { GroupDetailView, GroupStatus } from "../../types/session";

const STATUS_LABEL: Record<GroupStatus, string> = {
  WAITING: "Esperando panas",
  LOCKED: "Sorteo listo",
  REVEALED: "Revelado",
  COMPLETED: "Finalizado",
};

/** Colores del chip de estado: celeste (esperando), amarillo (sorteo listo), coral (revelado), gris (finalizado) */
const STATUS_COLORS: Record<
  GroupStatus,
  { bg: string; dot: string; text: string }
> = {
  WAITING: {
    bg: theme.colors.accentContainer,
    dot: theme.colors.accent,
    text: theme.colors.accentDark,
  },
  LOCKED: {
    bg: theme.colors.secondaryFixed,
    dot: theme.colors.secondary,
    text: theme.colors.secondaryDark,
  },
  REVEALED: {
    bg: theme.colors.coralContainer,
    dot: theme.colors.coral,
    text: theme.colors.coral,
  },
  COMPLETED: {
    bg: theme.colors.surfaceContainer,
    dot: theme.colors.outline,
    text: theme.colors.textSecondary,
  },
};

interface Props {
  group: Pick<
    GroupDetailView,
    "emoji" | "name" | "status" | "organizerName" | "isOrganizer"
  >;
}

/** Tarjeta principal: emoji, estado, rol, nombre y organizador */
export const GroupDetailHero: React.FC<Props> = ({ group }) => {
  const c = STATUS_COLORS[group.status];
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroGlow} />
      <View>
        <View style={styles.heroEmojiBox}>
          <Text style={styles.heroEmoji}>{group.emoji}</Text>
        </View>
        <Image source={BRAND_ISOTIPO} style={styles.heroMascot} />
      </View>

      <View style={styles.heroInfo}>
        <View style={styles.chipsRow}>
          <View style={[styles.statusChip, { backgroundColor: c.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: c.dot }]} />
            <Text style={[styles.statusChipText, { color: c.text }]}>
              {STATUS_LABEL[group.status]}
            </Text>
          </View>
          <View style={styles.roleChip}>
            <Text style={styles.roleChipText}>
              {group.isOrganizer ? "Tú organizas" : "Participante"}
            </Text>
          </View>
        </View>
        <Text style={styles.heroTitle} numberOfLines={2}>
          {group.name}
        </Text>
        <Text style={styles.heroSubtitle}>
          Organizado por{" "}
          <Text style={styles.heroSubtitleStrong}>{group.organizerName}</Text>{" "}
          ✨
        </Text>
      </View>
    </View>
  );
};

export default GroupDetailHero;
