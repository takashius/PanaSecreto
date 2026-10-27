import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { Alert } from '../../components/common/AppDialog';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CalendarDays, Clock, Minus, Plus, MapPin, Map, Lock, TriangleAlert, Trash2, CircleCheck } from 'lucide-react-native';
import { theme, wishFormStyles as form, createGroupStyles } from '../../styles';
import { exchangeLabels } from '../../utils/format';
import { CalendarModal } from '../../components/common/CalendarModal';
import { TimePickerModal } from '../../components/common/TimePickerModal';
import type { GroupDetailView } from '../../types/session';

const EMOJIS = ['🎄', '🥂', '🎁', '🎓', '🎾', '🏠', '💼', '⚽', '🎉', '🫔'];
const MAX_NAME = 60;
const MAX_NOTE = 300;
const pad = (n: number) => String(n).padStart(2, '0');

/** Fecha local → ISO con el desfase de Venezuela (UTC-4), como lo guarda el backend */
function toVenezuelaIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00-04:00`;
}
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

  const [emoji, setEmoji] = useState(group.emoji);
  const [name, setName] = useState(group.name);
  // Fecha y hora del intercambio (se eligen con el calendario y el selector de hora)
  const [when, setWhen] = useState(() => new Date(group.exchangeAt));
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const [currency, setCurrency] = useState(group.currency);
  const [min, setMin] = useState(group.budgetMin != null ? String(group.budgetMin) : '');
  const [max, setMax] = useState(group.budgetMax != null ? String(group.budgetMax) : '');
  const [maxMembers, setMaxMembers] = useState(group.maxMembers);
  const [placeName, setPlaceName] = useState(group.location?.name ?? '');
  const [address, setAddress] = useState(group.location?.address ?? '');
  const [note, setNote] = useState(group.note ?? '');
  const [submitted, setSubmitted] = useState(false);

  const iso = toVenezuelaIso(when);
  const whenLabels = exchangeLabels(iso);
  const [now] = useState(() => Date.now());
  const minN = toNumber(min);
  const maxN = toNumber(max);
  const errors = {
    name: name.trim().length < 3 ? 'El nombre debe tener al menos 3 letras.' : null,
    date: when.getTime() < now ? 'La fecha del intercambio ya pasó. Elige una fecha futura.' : null,
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
    if (hasErrors) return;
    const labels = exchangeLabels(iso);
    // El contenedor envía PATCH /api/group/:id solo con lo que cambió
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
              <TouchableOpacity
                style={[form.inputRow, { flex: 3 }, submitted && errors.date ? form.inputError : null]}
                onPress={() => setPicker('date')}
                activeOpacity={0.8}
                accessibilityLabel="Elegir fecha"
              >
                <CalendarDays size={20} color={theme.colors.secondaryDark} strokeWidth={2.2} />
                <Text style={form.inputFlex}>{whenLabels.dateLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[form.inputRow, { flex: 2 }]}
                onPress={() => setPicker('time')}
                activeOpacity={0.8}
                accessibilityLabel="Elegir hora"
              >
                <Clock size={20} color={theme.colors.secondaryDark} strokeWidth={2.2} />
                <Text style={form.inputFlex}>{whenLabels.timeLabel}</Text>
              </TouchableOpacity>
            </View>
            <Text style={form.tipText}>
              Será el {whenLabels.dateLong} a las {whenLabels.timeLabel}.
            </Text>
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
      {picker === 'date' && (
        <CalendarModal
          visible
          value={when}
          onConfirm={(d) => {
            setWhen((w) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), w.getHours(), w.getMinutes()));
            setPicker(null);
          }}
          onCancel={() => setPicker(null)}
        />
      )}
      {picker === 'time' && (
        <TimePickerModal
          visible
          hours={when.getHours()}
          minutes={when.getMinutes()}
          onConfirm={(h, m) => {
            setWhen((w) => new Date(w.getFullYear(), w.getMonth(), w.getDate(), h, m));
            setPicker(null);
          }}
          onCancel={() => setPicker(null)}
        />
      )}
    </SafeAreaView>
  );
};

export default EditGroupScreen;
