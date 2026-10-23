import React, { useCallback, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, RefreshCw, PenLine, List } from 'lucide-react-native';
import { theme, aliasPickerStyles as styles } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';
import { fetchAliasSuggestions, setMyAlias, type AliasSuggestion } from '../../api/groupDetail';
import { ApiError, errorMessage } from '../../api/client';
import { useApiQuery } from '../../api/queryStore';

type Gender = 'M' | 'F' | 'N';
const GENDER_OPTIONS: Array<{ id: Gender; label: string }> = [
  { id: 'M', label: 'Masculinos' },
  { id: 'F', label: 'Femeninos' },
  { id: 'N', label: 'Neutros' },
];
const CUSTOM_EMOJIS = ['🎁', '🥸', '🤫', '🕵️', '🦜', '🎄', '🫓', '🧀', '🌟', '🎭'];
const MIN = 3;
const MAX = 30;

interface Props {
  visible: boolean;
  groupId: string;
  groupName: string;
  /** Alias actual (para cambiarlo antes del sorteo) */
  currentAlias?: string | null;
  onClose: () => void;
  onSaved: (alias: string, emoji: string) => void;
}

/**
 * Elegir el alias del grupo: 5 sugerencias al azar según el género (o el que elija la persona),
 * «Ver otras 5» sin repetir, o escribir uno propio (el backend filtra groserías y repetidos).
 */
export const AliasPickerModal: React.FC<Props> = ({ visible, groupId, groupName, currentAlias, onClose, onSaved }) => {
  const insets = useSafeAreaInsets();
  const [gender, setGender] = useState<Gender | null>(null);
  // Cada "Ver otras 5" es una ronda nueva que excluye lo ya visto
  const [round, setRound] = useState(0);
  const [seen, setSeen] = useState<string[]>([]);
  const [selected, setSelected] = useState<AliasSuggestion | null>(null);
  const [custom, setCustom] = useState(false);
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState(CUSTOM_EMOJIS[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetcher = useCallback(async () => {
    const res = await fetchAliasSuggestions(groupId, gender, seen);
    // Se acabaron las sugerencias nuevas: vuelve a empezar
    if (res.results.length === 0 && seen.length > 0) return fetchAliasSuggestions(groupId, gender, []);
    return res;
  }, [groupId, gender, seen]);
  const suggestions = useApiQuery(`alias:${groupId}:${gender ?? 'perfil'}:${round}`, fetcher, { enabled: visible });
  const options = suggestions.data?.results ?? [];
  const loading = suggestions.fetching && !suggestions.data;
  // Sin género elegido, el servidor usa el del perfil
  const activeGender = gender ?? suggestions.data?.gender ?? null;
  const current = options.find((o) => o.id === selected?.id) ?? null;

  const changeGender = (next: Gender) => {
    setGender(next);
    setSeen([]);
    setRound((n) => n + 1);
    setSelected(null);
  };

  const moreOptions = () => {
    setSeen((prev) => (options.length < 5 ? [] : [...prev, ...options.map((o) => o.id)]));
    setRound((n) => n + 1);
    setSelected(null);
  };

  const save = async () => {
    const alias = custom ? text.trim() : current?.text;
    const chosenEmoji = custom ? emoji : current?.emoji || '🎁';
    if (!alias) return setError(custom ? 'Escribe tu alias.' : 'Elige una de las sugerencias.');
    if (alias.length < MIN || alias.length > MAX) return setError(`El alias debe tener entre ${MIN} y ${MAX} caracteres.`);
    setSaving(true);
    setError(null);
    try {
      const res = await setMyAlias(groupId, alias, chosenEmoji);
      onSaved(res.alias, res.aliasEmoji);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} accessibilityLabel="Cerrar" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <Image source={BRAND_ISOTIPO} style={styles.mascot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{currentAlias ? 'Cambia tu alias' : 'Elige tu alias 🥸'}</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              En «{groupName}» te verán con este nombre en el chat, en los comentarios y en el sobre de quien te regala. Puedes cambiarlo
              hasta el sorteo.
            </Text>

            {!custom ? (
              <>
                <View style={styles.genderRow} accessibilityRole="tablist">
                  {GENDER_OPTIONS.map((g) => {
                    const active = activeGender === g.id;
                    return (
                      <TouchableOpacity
                        key={g.id}
                        style={[styles.genderItem, active && styles.genderItemActive]}
                        onPress={() => changeGender(g.id)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: active }}
                      >
                        <Text style={[styles.genderText, active && styles.genderTextActive]}>{g.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {loading ? (
                  <View style={{ paddingVertical: 40 }}>
                    <ActivityIndicator color={theme.colors.primary} />
                  </View>
                ) : (
                  options.map((o) => {
                    const active = current?.id === o.id;
                    return (
                      <TouchableOpacity
                        key={o.id}
                        style={[styles.option, active && styles.optionActive]}
                        onPress={() => {
                          setSelected(o);
                          setError(null);
                        }}
                        activeOpacity={0.85}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                      >
                        <Text style={styles.optionEmoji}>{o.emoji || '🎁'}</Text>
                        <Text style={styles.optionText}>{o.text}</Text>
                        <View style={[styles.radio, active && styles.radioActive]}>
                          {active && <Check size={14} color={theme.colors.white} strokeWidth={3} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}

                <View style={styles.linkRow}>
                  <TouchableOpacity style={styles.linkButton} onPress={moreOptions} disabled={suggestions.fetching}>
                    <RefreshCw size={16} color={theme.colors.secondaryDark} />
                    <Text style={styles.linkText}>Ver otras 5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => {
                      setCustom(true);
                      setError(null);
                    }}
                  >
                    <PenLine size={16} color={theme.colors.secondaryDark} />
                    <Text style={styles.linkText}>Escribir el mío</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.customCard}>
                  <TextInput
                    style={styles.input}
                    value={text}
                    onChangeText={(v) => {
                      setText(v);
                      setError(null);
                    }}
                    placeholder="Ej. El Gocho Misterioso"
                    placeholderTextColor={theme.colors.outline}
                    maxLength={MAX}
                    autoFocus
                  />
                  <Text style={styles.hint}>
                    {text.trim().length}/{MAX} · Que no delate quién eres y que sea sano 😉
                  </Text>
                  <View style={styles.emojiRow}>
                    {CUSTOM_EMOJIS.map((e) => (
                      <TouchableOpacity
                        key={e}
                        style={[styles.emojiChip, emoji === e && styles.emojiChipActive]}
                        onPress={() => setEmoji(e)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: emoji === e }}
                      >
                        <Text style={{ fontSize: 20 }}>{e}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.linkRow}>
                  <TouchableOpacity style={styles.linkButton} onPress={() => setCustom(false)}>
                    <List size={16} color={theme.colors.secondaryDark} />
                    <Text style={styles.linkText}>Volver a las sugerencias</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {error || (suggestions.error && !custom) ? (
              <Text style={styles.error}>{error ?? suggestions.error?.message}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.saveButton, saving && { opacity: 0.6 }]}
              onPress={() => void save()}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving && <ActivityIndicator color={theme.colors.primary} />}
              <Text style={styles.saveButtonText}>{saving ? 'Guardando…' : 'Usar este alias'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.laterButton} onPress={onClose}>
              <Text style={styles.laterText}>{currentAlias ? 'Cancelar' : 'Lo elijo después'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AliasPickerModal;
