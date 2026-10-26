import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Alert } from '../../components/common/AppDialog';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MoreVertical,
  Star,
  Store,
  ShoppingBag,
  ExternalLink,
  Lock,
  EyeOff,
  SendHorizontal,
  BellRing,
  ImageOff,
} from 'lucide-react-native';
import { theme, wishDetailStyles as styles } from '../../styles';
import { WISH_CATEGORIES } from '../../constants/wishCategories';
import { CommentItem } from '../../components/wish/CommentItem';
import type { WishComment, WishDetailView } from '../../types/session';
import { TipCard } from '../../components/common/TipCard';

const CURRENCY = { USD: '$', VES: 'Bs. ' } as const;
const MAX_COMMENT = 500;
const GIVER_SUGGESTIONS = ['¿Qué talla usas?', '¿Qué color prefieres?', '¿Alguna marca en especial?'];


interface WishDetailScreenProps {
  wish: WishDetailView;
  onNavigateBack: () => void;
  /** Comentarios del hilo (vienen de la API) */
  comments: WishComment[];
  commentsLoading?: boolean;
  /** false cuando el intercambio finalizó o antes del sorteo */
  canComment?: boolean;
  /** Por qué no se puede comentar (se muestra en lugar del cuadro de texto) */
  closedReason?: string | null;
  /** Publica un comentario; si falla, el texto se conserva */
  onSend: (text: string) => Promise<void>;
  /** Solo el dueño: editar o eliminar el deseo */
  onEdit?: () => void;
  onDelete?: () => void;
}

/** Detalle de un deseo con su hilo de comentarios anónimos (sin tiempo real: se notifica al otro lado) */
export const WishDetailScreen: React.FC<WishDetailScreenProps> = ({
  wish,
  onNavigateBack,
  comments,
  commentsLoading = false,
  canComment = true,
  closedReason = null,
  onSend,
  onEdit,
  onDelete,
}) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const isGiver = wish.viewer === 'giver';
  const cat = WISH_CATEGORIES[wish.category];
  const CatIcon = cat.icon;
  const otherName = isGiver ? wish.ownerAlias : 'tu amigo secreto';
  const canSend = draft.trim().length > 0 && !sending && canComment;

  const send = async (text: string = draft) => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      // El backend guarda el comentario y avisa al otro lado (sin decir quién es)
      await onSend(value);
      setDraft('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (error) {
      Alert.alert('No se pudo enviar', error instanceof Error ? error.message : 'Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const handleMore = () => {
    Alert.alert(wish.title, undefined, [
      { text: 'Editar deseo', onPress: () => onEdit?.() },
      {
        text: 'Eliminar deseo',
        style: 'destructive',
        onPress: () =>
          Alert.alert('¿Eliminar este deseo?', 'Se borrarán también sus comentarios.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => onDelete?.() },
          ]),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onNavigateBack} accessibilityLabel="Volver">
          <ArrowLeft size={24} color={theme.colors.primary} strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {isGiver ? `Deseo de ${wish.ownerAlias}` : 'Mi deseo'}
          </Text>
          <Text style={styles.headerSubtitle}>{wish.groupName}</Text>
        </View>
        {isGiver ? (
          <View style={styles.headerButton} />
        ) : (
          <TouchableOpacity style={styles.headerButton} onPress={handleMore} accessibilityLabel="Opciones del deseo">
            <MoreVertical size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView behavior="padding" enabled={Platform.OS === 'ios'} style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Tarjeta del deseo */}
          <View style={styles.wishCard}>
            <View style={styles.imageFrame}>
              {wish.priority === 'alta' && (
                <View style={styles.imageTopRow}>
                  <View style={styles.priorityChip}>
                    <Star size={16} color={theme.colors.secondary} fill={theme.colors.secondary} />
                    <Text style={styles.priorityChipText}>Prioridad alta</Text>
                  </View>
                </View>
              )}
              {wish.imageUrl ? (
                <Image source={{ uri: wish.imageUrl }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: cat.bg }]}>
                  <CatIcon size={64} color={cat.color} strokeWidth={1.8} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ImageOff size={14} color={theme.colors.textMuted} />
                    <Text style={styles.imagePlaceholderText}>Foto de referencia</Text>
                  </View>
                </View>
              )}
              <View style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{cat.label}</Text>
              </View>
            </View>

            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{wish.title}</Text>
                {!!wish.subtitle && <Text style={styles.subtitle}>{wish.subtitle}</Text>}
              </View>
              {wish.price != null && (
                <View style={styles.priceBox}>
                  <Text style={styles.priceLabel}>ESTIMADO</Text>
                  <Text style={styles.price}>
                    ~{CURRENCY[wish.currency]}
                    {wish.price.toLocaleString('es-VE')}
                  </Text>
                  <Text style={styles.priceCurrency}>{wish.currency === 'USD' ? 'USD' : 'Bs.'}</Text>
                </View>
              )}
            </View>

            {!!wish.store && (
              <View style={styles.storeRow}>
                <Text style={styles.storeLabel}>Tienda sugerida:</Text>
                <View style={styles.storeChip}>
                  <Store size={16} color={theme.colors.accentDark} strokeWidth={2.2} />
                  <Text style={styles.storeName}>{wish.store.name}</Text>
                  {!!wish.store.detail && <Text style={styles.storeDetail}>· {wish.store.detail}</Text>}
                </View>
              </View>
            )}

            {!!wish.url && (
              <TouchableOpacity
                style={styles.storeButton}
                onPress={() => void Linking.openURL(wish.url as string)}
                activeOpacity={0.8}
              >
                <ShoppingBag size={20} color={theme.colors.accentDark} strokeWidth={2.2} />
                <Text style={styles.storeButtonText}>Ver en tienda</Text>
                <ExternalLink size={18} color={theme.colors.textMuted} strokeWidth={2.2} />
              </TouchableOpacity>
            )}
          </View>

          {/* Privacidad del hilo */}
          <View style={styles.privacyBox}>
            <View style={styles.privacyIcon}>
              <Lock size={18} color={theme.colors.white} strokeWidth={2.4} />
            </View>
            <Text style={styles.privacyText}>
              {isGiver
                ? `Solo tú y tu pana ven estos comentarios. Te ve como «Tu amigo secreto»; tú lo ves como «${wish.ownerAlias}».`
                : 'Solo tú y tu amigo secreto ven estos comentarios. No sabrás quién es hasta la revelación, y tus respuestas le llegan por notificación.'}
            </Text>
          </View>

          {/* Comentarios */}
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Preguntas y comentarios anónimos</Text>
            {comments.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{comments.length}</Text>
              </View>
            )}
            <EyeOff size={20} color={theme.colors.textMuted} strokeWidth={2.2} />
          </View>

          {commentsLoading && comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : comments.length > 0 ? (
            comments.map((c) => <CommentItem key={c.id} comment={c} viewer={wish.viewer} ownerAlias={wish.ownerAlias} />)
          ) : (
            <View style={styles.emptyComments}>
              <Text style={styles.emptyTitle}>{isGiver ? 'Aún no hay preguntas' : 'Nadie ha preguntado todavía'}</Text>
              <Text style={styles.emptyText}>
                {isGiver
                  ? '¿Dudas con la talla, el color o el modelo? Pregúntale sin revelar quién eres.'
                  : 'Cuando tu amigo secreto te pregunte algo sobre este deseo, te avisaremos.'}
              </Text>
              {isGiver && canComment && (
                <View style={styles.suggestions}>
                  {GIVER_SUGGESTIONS.map((q) => (
                    <TouchableOpacity key={q} style={styles.suggestion} onPress={() => void send(q)} activeOpacity={0.8}>
                      <Text style={styles.suggestionText}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          <TipCard
            screen="deseo.detalle"
            fallback="Pregunta la talla, el color o el modelo en los comentarios. Tu pana nunca sabrá que eres tú."
            style={{ marginTop: 16 }}
          />
        </ScrollView>

        {/* Escribir comentario */}
        {!canComment ? (
          <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <View style={styles.composerHint}>
              <Lock size={14} color={theme.colors.textMuted} strokeWidth={2.2} />
              <Text style={styles.composerHintText}>{closedReason ?? 'Los comentarios están cerrados.'}</Text>
            </View>
          </View>
        ) : (
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <View style={styles.composerRow}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Escribe un comentario…"
              placeholderTextColor={theme.colors.outline}
              multiline
              maxLength={MAX_COMMENT}
            />
            <TouchableOpacity
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
              onPress={() => void send()}
              disabled={!canSend}
              accessibilityLabel="Enviar comentario"
            >
              <SendHorizontal size={22} color={theme.colors.primary} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
          <View style={styles.composerHint}>
            <BellRing size={14} color={theme.colors.coral} strokeWidth={2.2} />
            <Text style={styles.composerHintText}>Le avisaremos a {otherName} por notificación</Text>
          </View>
        </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default WishDetailScreen;
