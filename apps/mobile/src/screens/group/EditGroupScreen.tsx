import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CalendarDays, Clock, Minus, Plus, MapPin, Map, Lock, TriangleAlert, Trash2, CircleCheck } from 'lucide-react-native';
import { theme, wishFormStyles as form, createGroupStyles } from '../../styles';
import { exchangeLabels } from '../../utils/format';
import type { GroupDetailView } from '../../types/session';

const EMOJIS = ['🎄', '🥂', '🎁', '🎓', '🎾', '🏠', '💼', '⚽', '🎉', '🫔'];
const MAX_NAME = 60;
const MAX_NOTE = 300;
const pad = (n: number) => String(n).padStart(2, '0');

/** ISO → "24/12/2026" y "20:00" */
function splitIso(iso: string) {
  const d = new Date(iso);
  return { date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

/** "24/12/2026" + "20:00" → ISO en hora de Venezuela (UTC-4), o null si no es válido */
function joinIso(date: string, time: string): string | null {
  const dm = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date.trim());
  const tm = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!dm || !tm) return null;
  const [, dd, mm, yyyy] = dm;
  const [, hh, mi] = tm;
  if (+mm < 1 || +mm > 12 || +dd < 1 || +dd > 31 || +hh > 23 || +mi > 59) return null;
  const iso = `${yyyy}-${mm}-${dd}T${pad(+hh)}:${mi}:00-04:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) || d.getDate() !== +dd ? null : iso;
}

/** Formatea mientras se escribe: "24122026" → "24/12/2026" */
const maskDate = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean).join('/');
};
const maskTime = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
};
const toNumber = (v: string) => (v.trim() ? Number(v.replace(',', '.')) : null);

interface EditGroupScreenProps {
  group: GroupDetailView;
  onSave: (group: GroupDetailView) => void;
  onDelete: () => void;
  onCancel: () => void;
}

/** Editar grupo (organización): datos, fecha, presupuesto, cupo, lugar, nota y zona de peligro */
export const EditGroupScreen: React.FC<EditGroupScreenProps> = ({ group, onSave, onDelete, onCancel }) => {
  const insets = useSafeAreaInsets();
  const locked = group.status !== 'WAITING';
  const initial = splitIso(group.exchangeAt);

  const [emoji, setEmoji] = useState(group.emoji);
  const [name, setName] = useState(group.name);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [currency, setCurrency] = useState(group.currency);
  const [min, setMin] = useState(group.budgetMin != null ? String(group.budgetMin) : '');
  const [max, setMax] = useState(group.budgetMax != null ? String(group.budgetMax) : '');
  const [maxMembers, setMaxMembers] = useState(group.maxMembers);
  const [placeName, setPlaceName] = useState(group.location?.name ?? '');
  const [address, setAddress] = useState(group.location?.address ?? '');
  const [note, setNote] = useState(group.note ?? '');
  const [submitted, setSubmitted] = useState(false);

  const iso = joinIso(date, time);
  const minN = toNumber(min);
  const maxN = toNumber(max);
  const errors = {
    name: name.trim().length < 3 ? 'El nombre debe tener al menos 3 letras.' : null,
    date: !iso ? 'Usa el formato DD/MM/AAAA y una hora válida (ej. 20:00).' : null,
    budget:
      (minN != null && (Number.isNaN(minN) || minN < 0)) || (maxN != null && (Number.isNaN(maxN) || maxN < 0))
        ? 'Escribe montos válidos.'
        : minN != null && maxN != null && minN > maxN
          ? 'El mínimo no puede ser mayor que el máximo.'
          : null,
    place: !!address.trim() && !placeName.trim() ? 'Ponle un nombre al lugar (ej. Casa de la abuela).' : null,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const handleSave = () => {
    setSubmitted(true);
    if (hasErrors || !iso) return;
    const labels = exchangeLabels(iso);
    // Al conectar la API: PATCH /api/group/:id (el backend valida con membersVersion)
    onSave({
      ...group,
      emoji,
      name: name.trim(),
      exchangeAt: iso,
      exchangeDateLabel: labels.dateLabel,
      exchangeTimeLabel: labels.timeLabel,
      exchangeDateLong: labels.dateLong,
      currency: locked ? group.currency : currency,
      budgetMin: locked ? group.budgetMin : minN,
      budgetMax: locked ? group.budgetMax : maxN,
      maxMembers,
      location: placeName.trim() ? { name: placeName.trim(), address: address.trim() } : null,
      note: note.trim() || null,
    });
  };

  const confirmDelete = () =>
    Alert.alert('¿Eliminar el grupo?', `Se borrará «${group.name}» con sus sobres, deseos y chat. A todos les llegará un aviso. Esto no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar grupo', style: 'destructive', onPress: onDelete },
    ]);

  const sym = currency === 'USD' ? '$' : 'Bs.';

  return (
    <SafeAreaView style={form.container} edges={['top']}>
      <View style={form.header}>
        <TouchableOpacity style={form.headerButton} onPress={onCancel} accessibilityLabel="Volver">
          <ArrowLeft size={22} color={theme.colors.primary} strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={form.headerCenter}>
          <Text style={form.headerTitle}>Editar grupo</Text>
          <Text style={form.headerSubtitle}>Tú organizas</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView behavior="padding" enabled={Platform.OS === 'ios'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={form.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Datos */}
          <View style={form.card}>
            <Text style={form.label}>Datos del grupo</Text>
            <View style={form.chips}>
              {EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  onPress={() => setEmoji(e)}
                  style={[form.chip, { paddingHorizontal: 10 }, emoji === e && { borderColor: theme.colors.secondary, backgroundColor: theme.colors.secondarySoft }]}
                  accessibilityLabel={`Emoji ${e}`}
                >
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[form.input, submitted && errors.name ? form.inputError : null]}
              value={name}
              onChangeText={setName}
              placeholder="Nombre del grupo"
              placeholderTextColor={theme.colors.outline}
              maxLength={MAX_NAME}
            />
            {submitted && errors.name && <Text style={form.errorText}>{errors.name}</Text>}
          </View>

          {/* Fecha */}
          <View style={form.card}>
            <Text style={form.label}>Fecha y hora del intercambio</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[form.inputRow, { flex: 3 }, submitted && errors.date ? form.inputError : null]}>
                <CalendarDays size={20} color={theme.colors.textMuted} strokeWidth={2.2} />
                <TextInput
                  style={form.inputFlex}
                  value={date}
                  onChangeText={(v) => setDate(maskDate(v))}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={theme.colors.outline}
                  keyboardType="number-pad"
                />
              </View>
              <View style={[form.inputRow, { flex: 2 }, submitted && errors.date ? form.inputError : null]}>
                <Clock size={20} color={theme.colors.textMuted} strokeWidth={2.2} />
                <TextInput
                  style={form.inputFlex}
                  value={time}
                  onChangeText={(v) => setTime(maskTime(v))}
                  placeholder="20:00"
                  placeholderTextColor={theme.colors.outline}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            {iso && <Text style={form.tipText}>Será el {exchangeLabels(iso).dateLong} a las {exchangeLabels(iso).timeLabel}.</Text>}
            {submitted && errors.date && <Text style={form.errorText}>{errors.date}</Text>}
          </View>

          {/* Presupuesto */}
          <View style={form.card}>
            <View style={form.labelRow}>
              <Text style={form.label}>Presupuesto</Text>
              <View style={form.currencyToggle}>
                {(['USD', 'VES'] as const).map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[form.currencyOption, currency === c && form.currencyOptionActive]}
                    onPress={() => setCurrency(c)}
                    disabled={locked}
                  >
                    <Text style={[form.currencyText, currency === c && form.currencyTextActive]}>{c === 'USD' ? 'USD $' : 'Bs.'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, opacity: locked ? 0.5 : 1 }}>
              {[
                { label: 'Mínimo', value: min, set: setMin },
                { label: 'Máximo', value: max, set: setMax },
              ].map((f) => (
                <View key={f.label} style={[form.inputRow, { flex: 1 }]}>
                  <Text style={form.priceSuffix}>{f.label}</Text>
                  <Text style={form.pricePrefix}>{sym}</Text>
                  <TextInput
                    style={form.priceInput}
                    value={f.value}
                    onChangeText={(v) => f.set(v.replace(/[^0-9.,]/g, ''))}
                    editable={!locked}
                    keyboardType="decimal-pad"
                    placeholder="—"
                    placeholderTextColor={theme.colors.outline}
                  />
                </View>
              ))}
            </View>
            {locked ? (
              <View style={form.budgetBox}>
                <Lock size={18} color={theme.colors.secondaryDark} />
                <Text style={form.budgetText}>Después del sorteo el presupuesto queda fijo, para que nadie se vea afectado.</Text>
              </View>
            ) : (
              <Text style={form.tipText}>Deja el mínimo vacío si solo quieren poner un tope.</Text>
            )}
            {submitted && errors.budget && <Text style={form.errorText}>{errors.budget}</Text>}
          </View>

          {/* Cupo */}
          <View style={form.card}>
            <Text style={form.label}>Cupo de panas</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={form.tipText}>
                {group.membersCount} confirmados · máximo {maxMembers}
              </Text>
              <View style={createGroupStyles.stepperContainer}>
                <TouchableOpacity
                  style={createGroupStyles.stepperBtn}
                  onPress={() => setMaxMembers((n) => Math.max(group.membersCount, 3, n - 1))}
                  disabled={locked}
                  accessibilityLabel="Menos cupo"
                >
                  <Minus size={18} color={theme.colors.primary} />
                </TouchableOpacity>
                <Text style={createGroupStyles.stepperValue}>{maxMembers}</Text>
                <TouchableOpacity
                  style={createGroupStyles.stepperBtn}
                  onPress={() => setMaxMembers((n) => Math.min(50, n + 1))}
                  disabled={locked}
                  accessibilityLabel="Más cupo"
                >
                  <Plus size={18} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Lugar y nota */}
          <View style={form.card}>
            <Text style={form.label}>Lugar del encuentro</Text>
            <View style={[form.inputRow, submitted && errors.place ? form.inputError : null]}>
              <MapPin size={20} color={theme.colors.textMuted} strokeWidth={2.2} />
              <TextInput
                style={form.inputFlex}
                value={placeName}
                onChangeText={setPlaceName}
                placeholder="Nombre del lugar (ej. Casa de la abuela)"
                placeholderTextColor={theme.colors.outline}
              />
            </View>
            <TextInput
              style={form.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Dirección"
              placeholderTextColor={theme.colors.outline}
            />
            {submitted && errors.place && <Text style={form.errorText}>{errors.place}</Text>}
            {!!(placeName.trim() || address.trim()) && (
              <TouchableOpacity
                style={[form.photoButton, { alignSelf: 'flex-start', paddingHorizontal: 16 }]}
                onPress={() =>
                  void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${placeName}, ${address}`)}`)
                }
              >
                <Map size={18} color={theme.colors.accentDark} />
                <Text style={form.photoButtonText}>Revisar en el mapa</Text>
              </TouchableOpacity>
            )}

            <Text style={[form.label, { marginTop: 6 }]}>
              Nota para los panas <Text style={form.optional}>(Opcional)</Text>
            </Text>
            <TextInput
              style={[form.input, form.textArea]}
              value={note}
              onChangeText={setNote}
              placeholder="Ej: Lleven el regalo bien envuelto y algo pa’ picar."
              placeholderTextColor={theme.colors.outline}
              multiline
              maxLength={MAX_NOTE}
            />
            <Text style={form.counter}>
              {note.length}/{MAX_NOTE}
            </Text>
          </View>

          {/* Zona de peligro */}
          <View style={[form.card, { borderColor: theme.colors.coral, backgroundColor: theme.colors.coralContainer }]}>
            <View style={form.labelRow}>
              <TriangleAlert size={20} color={theme.colors.danger} />
              <Text style={[form.label, { color: theme.colors.danger }]}>Zona de cuidado</Text>
            </View>
            <Text style={form.tipText}>Si eliminas el grupo se cancela el intercambio y se borran los sobres, las listas de deseos y el chat.</Text>
            <TouchableOpacity
              style={[form.photoButton, { borderColor: theme.colors.danger }]}
              onPress={confirmDelete}
              activeOpacity={0.85}
            >
              <Trash2 size={18} color={theme.colors.danger} />
              <Text style={[form.photoButtonText, { color: theme.colors.danger }]}>Eliminar grupo definitivamente</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={[form.footer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TouchableOpacity style={form.saveButton} onPress={handleSave} activeOpacity={0.85}>
            <CircleCheck size={22} color={theme.colors.primary} strokeWidth={2.4} />
            <Text style={form.saveButtonText}>Guardar cambios</Text>
          </TouchableOpacity>
          <TouchableOpacity style={form.cancelButton} onPress={onCancel}>
            <Text style={form.cancelText}>Cancelar y volver al grupo</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditGroupScreen;
