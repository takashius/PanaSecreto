import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  CircleHelp,
  Camera,
  ImagePlus,
  Image as ImageIcon,
  Trash2,
  Store,
  CircleDollarSign,
  CircleCheck,
  Check,
  Gift,
} from 'lucide-react-native';
import { theme, wishFormStyles as styles } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';
import { WISH_CATEGORIES, WISH_CATEGORY_ORDER } from '../../constants/wishCategories';
import { formatBudget } from '../../utils/format';
import type { MyWish, WishCategory } from '../../types/session';

/** Mismos límites que el modelo Wish del backend */
const MAX_TITLE = 120;
const MAX_NOTES = 500;

export interface WishFormGroup {
  groupId: string;
  emoji: string;
  name: string;
  currency: 'USD' | 'VES';
  budgetMax: number | null;
  year: number;
}

interface WishFormScreenProps {
  group: WishFormGroup;
  /** Si viene, el formulario edita ese deseo */
  initial?: MyWish | null;
  onSave: (wish: MyWish) => void;
  onCancel: () => void;
}

const parsePrice = (raw: string): number | null => {
  const n = Number(raw.replace(/\./g, '').replace(',', '.'));
  return raw.trim() && Number.isFinite(n) && n >= 0 ? n : null;
};

const isUrl = (v: string) => /^https?:\/\//i.test(v.trim());
const newLocalId = () => `local-${Date.now()}`;

/** Agregar o editar un deseo: foto obligatoria, nombre, precio, categoría, tienda, notas y prioridad */
export const WishFormScreen: React.FC<WishFormScreenProps> = ({ group, initial, onSave, onCancel }) => {
  const insets = useSafeAreaInsets();
  const editing = !!initial;

  const [imageUri, setImageUri] = useState<string | null>(initial?.imageUrl ?? null);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [currency, setCurrency] = useState<'USD' | 'VES'>(initial?.currency ?? group.currency);
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : '');
  const [category, setCategory] = useState<WishCategory>(initial?.category ?? 'ropa');
  const [where, setWhere] = useState(initial?.url ?? initial?.store?.name ?? '');
  const [notes, setNotes] = useState(initial?.subtitle ?? '');
  const [priority, setPriority] = useState<'normal' | 'alta'>(initial?.priority ?? 'normal');
  const [submitted, setSubmitted] = useState(false);

  const priceValue = parsePrice(price);
  const sameCurrency = currency === group.currency;
  const overBudget = sameCurrency && group.budgetMax != null && priceValue != null && priceValue > group.budgetMax;
  const errors = {
    image: !imageUri ? 'Agrega una foto de referencia.' : null,
    title: !title.trim() ? 'Escribe qué te gustaría recibir.' : null,
  };
  const dirty =
    !!imageUri !== !!initial?.imageUrl || title !== (initial?.title ?? '') || price !== (initial?.price != null ? String(initial.price) : '') || notes !== (initial?.subtitle ?? '') || where !== (initial?.url ?? initial?.store?.name ?? '');

  const pick = async (source: 'camera' | 'library') => {
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permiso necesario',
        source === 'camera'
          ? 'Activa el acceso a la cámara en los ajustes del teléfono para tomar la foto.'
          : 'Activa el acceso a tus fotos en los ajustes del teléfono para elegir una imagen.'
      );
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.8 };
    const result =
      source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  };

  const handleCancel = () => {
    if (!dirty) return onCancel();
    Alert.alert('¿Descartar cambios?', 'Lo que escribiste en este deseo se perderá.', [
      { text: 'Seguir editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: onCancel },
    ]);
  };

  const handleSave = () => {
    setSubmitted(true);
    if (errors.image || errors.title) {
      Alert.alert('Faltan datos', [errors.image, errors.title].filter(Boolean).join('\n'));
      return;
    }
    const whereValue = where.trim();
    // Al conectar la API: POST/PUT /api/group/:id/wishlist (multipart con la imagen, que se sube a Cloudinary)
    onSave({
      id: initial?.id ?? newLocalId(),
      title: title.trim(),
      subtitle: notes.trim() || null,
      price: priceValue,
      currency,
      category,
      imageUrl: imageUri,
      priority,
      store: whereValue && !isUrl(whereValue) ? { name: whereValue } : null,
      url: whereValue && isUrl(whereValue) ? whereValue : null,
      note: initial?.note ?? null,
      commentsCount: initial?.commentsCount ?? 0,
      unansweredCount: initial?.unansweredCount ?? 0,
      comments: initial?.comments ?? [],
    });
  };

  const budgetLabel = group.budgetMax != null ? formatBudget(group.currency, null, group.budgetMax).replace('Hasta ', '') : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleCancel} accessibilityLabel="Volver">
          <ArrowLeft size={22} color={theme.colors.primary} strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{editing ? 'Editar deseo' : 'Agregar deseo'}</Text>
          <Text style={styles.headerSubtitle}>Paso a paso con flow</Text>
        </View>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() =>
            Alert.alert(
              'Tips pa’ tu lista',
              '• Usa una foto clara del producto exacto.\n• Sé específico con el nombre y el modelo.\n• Pon la talla y el color en las notas.\n• Marca con prioridad alta lo que más quieres.'
            )
          }
          accessibilityLabel="Ayuda"
        >
          <CircleHelp size={22} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.groupPill}>
        <Text>{group.emoji}</Text>
        <Text style={styles.groupPillName}>{group.name}</Text>
        <View style={styles.groupPillDot} />
        <Text style={styles.groupPillYear}>Amigo Secreto {group.year}</Text>
      </View>

      <KeyboardAvoidingView behavior="padding" enabled={Platform.OS === 'ios'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {!editing && (
            <View style={styles.tipCard}>
              <Image source={BRAND_ISOTIPO} style={styles.mascot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>¡No dejes que te regalen medias!</Text>
                <Text style={styles.tipText}>Pon fotos claritas y pistas precisas pa’ que tu pana la pegue del techo.</Text>
              </View>
            </View>
          )}

          {/* Foto */}
          <View style={styles.card}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>
                Foto de referencia <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.requiredChip}>
                <Text style={styles.requiredChipText}>Obligatorio</Text>
              </View>
            </View>
            {imageUri ? (
              <>
                <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
                <View style={styles.previewActions}>
                  <TouchableOpacity style={styles.photoButton} onPress={() => void pick('library')} activeOpacity={0.85}>
                    <ImagePlus size={20} color={theme.colors.accentDark} strokeWidth={2.2} />
                    <Text style={styles.photoButtonText}>Cambiar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoButton} onPress={() => setImageUri(null)} activeOpacity={0.85}>
                    <Trash2 size={20} color={theme.colors.danger} strokeWidth={2.2} />
                    <Text style={[styles.photoButtonText, { color: theme.colors.danger }]}>Quitar</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={[styles.dropZone, submitted && errors.image ? styles.dropZoneError : null]}>
                <View style={styles.examplePhoto}>
                  <ImageIcon size={34} color={theme.colors.outline} strokeWidth={1.8} />
                </View>
                <Text style={styles.dropTitle}>¡Una foto vale más que mil indirectas!</Text>
                <Text style={styles.dropText}>Sube una captura de la prenda, el modelo exacto o la caja del producto.</Text>
                <View style={styles.photoButtons}>
                  <TouchableOpacity style={styles.photoButton} onPress={() => void pick('camera')} activeOpacity={0.85}>
                    <Camera size={20} color={theme.colors.accentDark} strokeWidth={2.2} />
                    <Text style={styles.photoButtonText}>Tomar foto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.photoButton, styles.photoButtonDark]}
                    onPress={() => void pick('library')}
                    activeOpacity={0.85}
                  >
                    <ImagePlus size={20} color={theme.colors.secondary} strokeWidth={2.2} />
                    <Text style={[styles.photoButtonText, styles.photoButtonTextLight]}>Galería</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {submitted && errors.image && <Text style={styles.errorText}>{errors.image}</Text>}
          </View>

          {/* Nombre */}
          <View style={styles.card}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>
                ¿Qué te gustaría recibir? <Text style={styles.required}>*</Text>
              </Text>
              <Text style={styles.labelHint}>Sé específico</Text>
            </View>
            <TextInput
              style={[styles.input, submitted && errors.title ? styles.inputError : null]}
              value={title}
              onChangeText={setTitle}
              placeholder="Ej: Camiseta oficial de la Vinotinto 2026"
              placeholderTextColor={theme.colors.outline}
              maxLength={MAX_TITLE}
              returnKeyType="next"
            />
            {submitted && errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          {/* Precio */}
          <View style={styles.card}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Precio aproximado</Text>
              <View style={styles.currencyToggle}>
                {(['USD', 'VES'] as const).map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.currencyOption, currency === c && styles.currencyOptionActive]}
                    onPress={() => setCurrency(c)}
                  >
                    <Text style={[styles.currencyText, currency === c && styles.currencyTextActive]}>
                      {c === 'USD' ? 'USD $' : 'Bs.'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.pricePrefix}>{currency === 'USD' ? '$' : 'Bs.'}</Text>
              <TextInput
                style={styles.priceInput}
                value={price}
                onChangeText={(v) => setPrice(v.replace(/[^0-9.,]/g, ''))}
                placeholder="0"
                placeholderTextColor={theme.colors.outline}
                keyboardType="decimal-pad"
              />
              <Text style={styles.priceSuffix}>{currency === 'USD' ? 'USD' : 'Bs.'}</Text>
            </View>
            {budgetLabel && (
              <View style={[styles.budgetBox, overBudget && styles.budgetBoxOver]}>
                <CircleDollarSign
                  size={22}
                  color={overBudget ? theme.colors.coral : theme.colors.secondary}
                  fill={overBudget ? theme.colors.coralContainer : theme.colors.secondaryFixed}
                />
                <Text style={styles.budgetText}>
                  {overBudget ? (
                    <>
                      Se pasa del presupuesto del grupo (<Text style={styles.strong}>hasta {budgetLabel}</Text>). Tu pana
                      podría no alcanzarlo.
                    </>
                  ) : (
                    <>
                      Presupuesto fijado del grupo: <Text style={styles.strong}>hasta {budgetLabel}</Text>. ¡Pana que se
                      pase pone la diferencia! 😉
                    </>
                  )}
                </Text>
              </View>
            )}
          </View>

          {/* Categoría */}
          <View style={styles.card}>
            <Text style={styles.label}>Categoría del regalo</Text>
            <View style={styles.chips}>
              {WISH_CATEGORY_ORDER.map((id) => {
                const c = WISH_CATEGORIES[id];
                const active = category === id;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setCategory(id)}
                    activeOpacity={0.85}
                    accessibilityState={{ selected: active }}
                  >
                    {active ? <Check size={16} color={theme.colors.white} strokeWidth={3} /> : <Text>{c.emoji}</Text>}
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.formLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Dónde se consigue */}
          <View style={styles.card}>
            <Text style={styles.label}>
              ¿Dónde se consigue? <Text style={styles.optional}>(Opcional)</Text>
            </Text>
            <View style={styles.inputRow}>
              <Store size={20} color={theme.colors.textMuted} strokeWidth={2.2} />
              <TextInput
                style={styles.inputFlex}
                value={where}
                onChangeText={setWhere}
                placeholder="Ej: Traki Sambil, Mercado Libre o pega el link"
                placeholderTextColor={theme.colors.outline}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Notas */}
          <View style={styles.card}>
            <Text style={styles.label}>
              Talla, color o notas clave <Text style={styles.optional}>(Opcional)</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Ej: Talla M, preferiblemente vinotinto con cuello blanco. ¡Nada de colores flúor, pana!"
              placeholderTextColor={theme.colors.outline}
              multiline
              maxLength={MAX_NOTES}
            />
            <Text style={styles.counter}>
              {notes.length}/{MAX_NOTES}
            </Text>
          </View>

          {/* Prioridad */}
          <View style={styles.card}>
            <Text style={styles.label}>Nivel de ganas / Prioridad</Text>
            <View style={styles.priorityRow}>
              {(
                [
                  { id: 'normal', emoji: '🎁', title: 'Normal', text: 'Me gusta y me sirve chévere' },
                  { id: 'alta', emoji: '⭐', title: '¡Prioridad alta!', text: '¡El que más deseo este año!' },
                ] as const
              ).map((o) => {
                const active = priority === o.id;
                return (
                  <TouchableOpacity
                    key={o.id}
                    style={[styles.priorityOption, active && styles.priorityOptionActive]}
                    onPress={() => setPriority(o.id)}
                    activeOpacity={0.85}
                    accessibilityState={{ selected: active }}
                  >
                    {active && (
                      <View style={styles.priorityCheck}>
                        <CircleCheck size={22} color={theme.colors.white} fill={theme.colors.secondary} />
                      </View>
                    )}
                    <Text style={styles.priorityEmoji}>{o.emoji}</Text>
                    <Text style={styles.priorityTitle}>{o.title}</Text>
                    <Text style={styles.priorityText}>{o.text}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Confidencialidad */}
          <View style={styles.privacyCard}>
            <Image source={BRAND_ISOTIPO} style={styles.mascot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>Confidencialidad EntrePanas 🛡️</Text>
              <Text style={styles.tipText}>
                Tu amigo secreto podrá ver este deseo en tu lista y hacerte preguntas anónimas en los comentarios sin revelar
                su identidad. <Text style={styles.strong}>¡Cero sapos! 🤫</Text>
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
            <Gift size={22} color={theme.colors.primary} strokeWidth={2.4} />
            <Text style={styles.saveButtonText}>{editing ? 'Guardar cambios' : 'Guardar deseo'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancelar y volver</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default WishFormScreen;
