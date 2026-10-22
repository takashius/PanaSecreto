import React from 'react';
import { View, Text } from 'react-native';
import { VenetianMask, CircleHelp } from 'lucide-react-native';
import { theme, wishDetailStyles as styles } from '../../styles';
import { timeAgo } from '../../utils/format';
import type { WishComment } from '../../types/session';

interface Props {
  comment: WishComment;
  /** Desde qué lado se mira el hilo: cambia cómo se llama cada persona */
  viewer: 'giver' | 'owner';
  ownerAlias: string;
}

/**
 * Un comentario del hilo anónimo.
 * Quien regala se ve como «Tu amigo secreto»; el dueño del deseo, con su alias («Pana Incógnito #04»).
 */
export const CommentItem: React.FC<Props> = ({ comment, viewer, ownerAlias }) => {
  const mine = comment.author === 'me';
  // ¿Este comentario lo escribió quien regala?
  const byGiver = viewer === 'giver' ? mine : !mine;
  const role = byGiver ? 'Tu amigo secreto' : ownerAlias;

  return (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <View style={[styles.commentAvatar, byGiver ? styles.commentAvatarMe : styles.commentAvatarOther]}>
          {byGiver ? (
            <VenetianMask size={17} color={theme.colors.primary} strokeWidth={2.4} />
          ) : (
            <CircleHelp size={17} color={theme.colors.white} strokeWidth={2.4} />
          )}
        </View>
        <View style={styles.commentAuthor}>
          {mine && viewer === 'giver' ? (
            <>
              <Text style={styles.commentName}>Tú</Text>
              <Text style={styles.commentTime}>·</Text>
              <Text style={styles.commentRole}>{role}</Text>
            </>
          ) : mine ? (
            <Text style={styles.commentName}>Tú</Text>
          ) : (
            <Text style={styles.commentName}>{role}</Text>
          )}
        </View>
        <Text style={styles.commentTime}>{timeAgo(comment.createdAt)}</Text>
      </View>
      <Text style={styles.commentText}>{comment.text}</Text>
    </View>
  );
};

export default CommentItem;
