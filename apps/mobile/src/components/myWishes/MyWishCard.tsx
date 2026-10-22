import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Star, MoreVertical, Store, MessageSquare, MessageSquareText, CircleCheck, ArrowRight } from 'lucide-react-native';
import { theme, myWishesStyles as styles } from '../../styles';
import { WISH_CATEGORIES } from '../../constants/wishCategories';
import type { MyWish } from '../../types/session';

const CURRENCY = { USD: '$', VES: 'Bs. ' } as const;

interface Props {
  wish: MyWish;
  /** Antes del sorteo nadie ve la lista todavía */
  visibleToFriend: boolean;
  onOpen: (wish: MyWish) => void;
  onTogglePriority: (wish: MyWish) => void;
  onMenu: (wish: MyWish) => void;
}

/** Tarjeta de un deseo propio con el estado de sus comentarios */
export const MyWishCard: React.FC<Props> = ({ wish, visibleToFriend, onOpen, onTogglePriority, onMenu }) => {
  const cat = WISH_CATEGORIES[wish.category];
  const CatIcon = cat.icon;
  const high = wish.priority === 'alta';

  let footer: React.ReactNode;
  if (wish.unansweredCount > 0) {
    footer = (
      <View style={[styles.wishFooter, styles.wishFooterAlert]}>
        <MessageSquare size={18} color={theme.colors.primary} fill={theme.colors.primary} />
        <Text style={[styles.footerText, styles.footerTextStrong]}>
          {wish.unansweredCount} {wish.unansweredCount === 1 ? 'pregunta sin responder' : 'preguntas sin responder'}
        </Text>
        <TouchableOpacity style={styles.replyButton} onPress={() => onOpen(wish)} activeOpacity={0.85}>
          <Text style={styles.replyButtonText}>Responder</Text>
          <ArrowRight size={16} color={theme.colors.primary} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>
    );
  } else if (wish.commentsCount > 0) {
    footer = (
      <View style={styles.wishFooter}>
        <MessageSquareText size={18} color={theme.colors.primary} strokeWidth={2.2} />
        <Text style={styles.footerText}>
          {wish.commentsCount} {wish.commentsCount === 1 ? 'comentario anónimo' : 'comentarios anónimos'}
        </Text>
        <TouchableOpacity onPress={() => onOpen(wish)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.linkText}>Ver comentarios</Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    footer = (
      <View style={styles.wishFooter}>
        <CircleCheck size={18} color={theme.colors.accentDark} strokeWidth={2.2} />
        <Text style={styles.footerText}>{visibleToFriend ? 'Visible para tu amigo' : 'Lista lista para el sorteo'}</Text>
        {!!wish.note && (
          <Text style={styles.footerNote} numberOfLines={1}>
            {wish.note}
          </Text>
        )}
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.wishCard} onPress={() => onOpen(wish)} activeOpacity={0.9}>
      <View style={styles.wishBody}>
        <View style={[styles.thumb, { backgroundColor: cat.bg }]}>
          {wish.imageUrl ? (
            <Image source={{ uri: wish.imageUrl }} style={styles.thumbImage} />
          ) : (
            <CatIcon size={40} color={cat.color} strokeWidth={1.8} />
          )}
          {high && (
            <View style={styles.priorityTag}>
              <Text style={styles.priorityTagText}>Prioridad</Text>
            </View>
          )}
        </View>

        <View style={styles.wishInfo}>
          <View style={styles.wishTopRow}>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{cat.label}</Text>
            </View>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => onTogglePriority(wish)}
              accessibilityLabel={high ? 'Quitar prioridad' : 'Marcar como prioridad'}
            >
              <Star
                size={22}
                color={high ? theme.colors.secondary : theme.colors.outlineVariant}
                fill={high ? theme.colors.secondary : 'transparent'}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => onMenu(wish)} accessibilityLabel="Opciones">
              <MoreVertical size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={styles.wishTitle} numberOfLines={2}>
            {wish.title}
          </Text>
          <View style={styles.wishBottomRow}>
            {wish.price != null && (
              <Text style={styles.wishPrice}>
                ~{CURRENCY[wish.currency]}
                {wish.price.toLocaleString('es-VE')}
              </Text>
            )}
            {!!wish.store && (
              <View style={styles.storeChip}>
                <Store size={14} color={theme.colors.textMuted} strokeWidth={2.2} />
                <Text style={styles.storeChipText} numberOfLines={1}>
                  {wish.store.name}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      {footer}
    </TouchableOpacity>
  );
};

export default MyWishCard;
