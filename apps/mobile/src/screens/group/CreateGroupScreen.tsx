import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Alert } from '../../components/common/AppDialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MoreVertical,
  Users,
  Calendar,
  ChevronDown,
  PartyPopper,
  Drama,
  Sparkles,
  Mail,
  Minus,
  Plus,
} from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { createGroupStyles } from '../../styles/createGroup.styles';
import { CreateGroupSuccessModal } from '../../components/group/CreateGroupSuccessModal';
import { CalendarModal } from '../../components/common/CalendarModal';

import { BRAND_ISOTIPO } from '../../constants/brand';
import { createGroup, type ApiGroup } from '../../api/groupDetail';
import { ApiError, errorMessage } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

/** Emojis para identificar el grupo en las listas */
const GROUP_EMOJIS = ['🎄', '🎁', '🥂', '🫔', '🎉', '💼', '🏠', '⚽', '🎓', '🎾'];
/** Hora por defecto del intercambio (se puede cambiar luego en Editar grupo) */
const DEFAULT_HOUR = 19;
const toAmount = (v: string) => {
  const clean = v.replace(/\s/g, '').replace(',', '.');
  if (!clean) return null;
  const n = Number(clean);
  return Number.isFinite(n) ? n : NaN;
};

interface CreateGroupScreenProps {
  onNavigateBack: () => void;
  /** El grupo ya existe en el servidor */
  onGroupCreated?: (group: ApiGroup) => void;
  /** Abre el detalle del grupo recién creado */
  onOpenGroup?: (groupId: string) => void;
}

export const CreateGroupScreen: React.FC<CreateGroupScreenProps> = ({
  onNavigateBack,
  onGroupCreated,
  onOpenGroup,
}) => {
  const { user } = useAuth();
  // Form States
  const [groupName, setGroupName] = useState('');
  const [emoji, setEmoji] = useState(GROUP_EMOJIS[0]);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<ApiGroup | null>(null);
  // Fecha del intercambio elegida en el calendario
  const [exchangeDate, setExchangeDate] = useState<Date | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [currency, setCurrency] = useState<'USD' | 'VES'>('USD');
  const [minBudget, setMinBudget] = useState('10');
  const [maxBudget, setMaxBudget] = useState('35');
  const [noLimit, setNoLimit] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(12);
  const [anonymousClues, setAnonymousClues] = useState(true);


  // Change Currency
  const handleSelectCurrency = (curr: 'USD' | 'VES') => {
    setCurrency(curr);
    if (curr === 'USD') {
      setMinBudget('10');
      setMaxBudget('35');
    } else {
      setMinBudget('450');
      setMaxBudget('1600');
    }
  };

  // Preset Chips
  const handleApplyPreset = (min: number, max: number) => {
    setNoLimit(false);
    setMinBudget(min.toString());
    setMaxBudget(max.toString());
  };

  // Stepper
  const handleAdjustParticipants = (delta: number) => {
    setParticipantsCount((prev) => Math.max(3, Math.min(50, prev + delta)));
  };

  const exchangeDateLabel = exchangeDate
    ? exchangeDate.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  // Submit Handler
  const handleCreateGroup = async () => {
    const name = groupName.trim();
    if (name.length < 3) {
      Alert.alert('Nombre requerido', 'Ponle al grupo un nombre de al menos 3 letras.');
      return;
    }
    if (!exchangeDate) {
      Alert.alert('Falta la fecha', 'Elige en el calendario el día del intercambio.');
      return;
    }
    const when = new Date(exchangeDate);
    when.setHours(DEFAULT_HOUR, 0, 0, 0);
    if (when.getTime() <= Date.now()) {
      Alert.alert('Fecha pasada', 'El intercambio tiene que ser en una fecha futura.');
      return;
    }
    const budgetMin = noLimit ? null : toAmount(minBudget);
    const budgetMax = noLimit ? null : toAmount(maxBudget);
    if ((budgetMin != null && (Number.isNaN(budgetMin) || budgetMin < 0)) || (budgetMax != null && (Number.isNaN(budgetMax) || budgetMax < 0))) {
      Alert.alert('Presupuesto', 'Escribe montos válidos (solo números).');
      return;
    }
    if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) {
      Alert.alert('Presupuesto', 'El monto mínimo no puede ser mayor que el máximo.');
      return;
    }

    setSaving(true);
    try {
      const group = await createGroup({
        name,
        emoji,
        exchangeDate: when.toISOString(),
        currency,
        budgetMin,
        budgetMax,
        maxParticipants: participantsCount,
        anonymousClues,
      });
      setCreated(group);
      onGroupCreated?.(group);
    } catch (error) {
      Alert.alert('No pudimos crear el grupo', error instanceof ApiError ? error.message : errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleFinishAndReturn = () => {
    setCreated(null);
    onNavigateBack();
  };

  const currencySymbol = currency === 'USD' ? '$' : 'Bs.';

  return (
    <SafeAreaView style={createGroupStyles.container} edges={['top', 'bottom']}>
      {/* 1. Barra Superior / Header */}
      <View style={createGroupStyles.header}>
        <View style={createGroupStyles.headerLeft}>
          <TouchableOpacity
            style={createGroupStyles.btnBack}
            activeOpacity={0.7}
            onPress={onNavigateBack}
            accessibilityLabel="Volver al dashboard"
          >
            <ArrowLeft size={24} color={theme.colors.textDark} />
          </TouchableOpacity>
          <Text style={createGroupStyles.headerTitle}>Crear Grupo</Text>
        </View>

        <View style={createGroupStyles.headerRight}>
          <TouchableOpacity
            style={createGroupStyles.btnMore}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert('Crear Grupo', 'Configura los detalles de tu sorteo de Amigo Secreto.')
            }
          >
            <MoreVertical size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <View style={createGroupStyles.headerAvatarRing}>
            <Image
              source={user?.photo ? { uri: user.photo } : BRAND_ISOTIPO}
              style={createGroupStyles.headerAvatarImg}
            />
          </View>
        </View>
      </View>

      {/* 2. Contenido Desplazable del Formulario */}
      <ScrollView
        contentContainerStyle={createGroupStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Festive Hero Card */}
        <View style={createGroupStyles.heroCard}>
          <View style={createGroupStyles.heroDecoCircle1} />
          <View style={createGroupStyles.heroDecoCircle2} />

          <View style={createGroupStyles.heroContentRow}>
            <View style={createGroupStyles.heroTextCol}>
              <View style={createGroupStyles.heroBadge}>
                <Text style={createGroupStyles.heroBadgeText}>Nuevo Sorteo 🪅</Text>
              </View>
              <Text style={createGroupStyles.heroTitle}>Arma la Parranda Navideña</Text>
              <Text style={createGroupStyles.heroSubtitle}>
                Configura las reglas del juego, invita a los panas y deja que la suerte reparta los papelitos.
              </Text>
            </View>

            <View style={createGroupStyles.heroIconCircle}>
              <PartyPopper size={28} color={theme.colors.secondaryDark} />
            </View>
          </View>
        </View>

        {/* Card 1: Identidad del Grupo */}
        <View style={createGroupStyles.card}>
          {/* Nombre del Grupo */}
          <View style={createGroupStyles.fieldGroup}>
            <View style={createGroupStyles.fieldLabelRow}>
              <View style={createGroupStyles.fieldLabelLeft}>
                <Users size={18} color={theme.colors.textSecondary} />
                <Text style={createGroupStyles.fieldLabel}>Nombre del Grupo</Text>
              </View>
            </View>

            <View style={createGroupStyles.fieldInputContainer}>
              <TextInput
                style={createGroupStyles.fieldInput}
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Ej. Gaitas en la Oficina"
                placeholderTextColor={theme.colors.outlineVariant}
                maxLength={80}
              />
            </View>
            <Text style={createGroupStyles.fieldHint}>
              Un nombre con sabor navideño para que todos lo reconozcan rápido.
            </Text>
            <View style={createGroupStyles.emojiRow} accessibilityRole="radiogroup" accessibilityLabel="Ícono del grupo">
              {GROUP_EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[createGroupStyles.emojiChip, emoji === e && createGroupStyles.emojiChipActive]}
                  onPress={() => setEmoji(e)}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: emoji === e }}
                >
                  <Text style={createGroupStyles.emojiChipText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Fecha del Intercambio */}
          <View style={createGroupStyles.fieldGroup}>
            <View style={createGroupStyles.fieldLabelRow}>
              <View style={createGroupStyles.fieldLabelLeft}>
                <Calendar size={18} color={theme.colors.textSecondary} />
                <Text style={createGroupStyles.fieldLabel}>Fecha del Intercambio</Text>
              </View>
              <View style={createGroupStyles.pillBadge}>
                <Text style={createGroupStyles.pillBadgeText}>Gran Destape ✨</Text>
              </View>
            </View>

            <TouchableOpacity
              style={createGroupStyles.dateTrigger}
              activeOpacity={0.8}
              onPress={() => setCalendarOpen(true)}
            >
              <View style={createGroupStyles.dateTriggerLeft}>
                <Calendar size={18} color={theme.colors.secondaryDark} />
                <Text
                  style={[createGroupStyles.dateTriggerText, !exchangeDateLabel && { color: theme.colors.outline }]}
                  numberOfLines={1}
                >
                  {exchangeDateLabel ? exchangeDateLabel.charAt(0).toUpperCase() + exchangeDateLabel.slice(1) : 'Elige la fecha en el calendario'}
                </Text>
              </View>
              <ChevronDown size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <Text style={createGroupStyles.fieldHint}>A las 7:00 PM. La hora y el lugar los ajustas luego en «Editar grupo».</Text>
          </View>
        </View>

        {/* Card 2: Rango de Presupuesto */}
        <View style={createGroupStyles.card}>
          <View style={createGroupStyles.cardHeaderRow}>
            <View style={createGroupStyles.cardHeaderText}>
              <Text style={createGroupStyles.cardHeaderTitle}>Rango de Presupuesto</Text>
              <Text style={createGroupStyles.cardHeaderSub}>
                Establece una guía para que nadie gaste de más (ni de menos).
              </Text>
            </View>
            <View style={createGroupStyles.pillBadge}>
              <Text style={createGroupStyles.pillBadgeText}>Opcional</Text>
            </View>
          </View>

          {/* Selector de Moneda */}
          <View style={createGroupStyles.currencyTabs}>
            <TouchableOpacity
              style={[
                createGroupStyles.currencyTab,
                currency === 'USD' && createGroupStyles.currencyTabActive,
              ]}
              onPress={() => handleSelectCurrency('USD')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  createGroupStyles.currencyTabText,
                  currency === 'USD' && createGroupStyles.currencyTabTextActive,
                ]}
              >
                USD ($)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                createGroupStyles.currencyTab,
                currency === 'VES' && createGroupStyles.currencyTabActive,
              ]}
              onPress={() => handleSelectCurrency('VES')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  createGroupStyles.currencyTabText,
                  currency === 'VES' && createGroupStyles.currencyTabTextActive,
                ]}
              >
                Bolívares (Bs.)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Inputs Numéricos Duales */}
          <View style={createGroupStyles.budgetInputsRow}>
            <View style={createGroupStyles.budgetInputCol}>
              <Text style={createGroupStyles.budgetInputSubLabel}>Monto Mínimo</Text>
              <View
                style={[
                  createGroupStyles.budgetBox,
                  noLimit && createGroupStyles.budgetBoxDisabled,
                ]}
              >
                <Text style={createGroupStyles.budgetSymbol}>{currencySymbol}</Text>
                <TextInput
                  style={createGroupStyles.budgetAmountInput}
                  value={minBudget}
                  onChangeText={setMinBudget}
                  keyboardType="numeric"
                  editable={!noLimit}
                />
              </View>
            </View>

            <View style={createGroupStyles.budgetDivider}>
              <Text style={createGroupStyles.budgetDividerText}>=</Text>
            </View>

            <View style={createGroupStyles.budgetInputCol}>
              <Text style={createGroupStyles.budgetInputSubLabel}>Monto Máximo</Text>
              <View
                style={[
                  createGroupStyles.budgetBox,
                  noLimit && createGroupStyles.budgetBoxDisabled,
                ]}
              >
                <Text style={createGroupStyles.budgetSymbol}>{currencySymbol}</Text>
                <TextInput
                  style={createGroupStyles.budgetAmountInput}
                  value={maxBudget}
                  onChangeText={setMaxBudget}
                  keyboardType="numeric"
                  editable={!noLimit}
                />
              </View>
            </View>
          </View>

          {/* Barra visual de rango */}
          <View style={createGroupStyles.rangeTrackWrap}>
            <View style={createGroupStyles.rangeTrackBg}>
              <View
                style={[
                  createGroupStyles.rangeTrackFill,
                  {
                    left: '18%',
                    width: noLimit ? '0%' : '55%',
                    opacity: noLimit ? 0.3 : 1,
                  },
                ]}
              />
            </View>
            <View style={createGroupStyles.rangeTrackLabels}>
              <Text style={createGroupStyles.rangeTrackLabelText}>
                {currencySymbol}{minBudget} sugerido
              </Text>
              <Text style={createGroupStyles.rangeTrackLabelText}>
                {currencySymbol}{maxBudget} tope
              </Text>
            </View>
          </View>

          {/* Chips Predefinidos */}
          <View style={createGroupStyles.chipsWrap}>
            {currency === 'USD' ? (
              <>
                <TouchableOpacity
                  style={[
                    createGroupStyles.presetChip,
                    minBudget === '5' && maxBudget === '15' && !noLimit && createGroupStyles.presetChipActive,
                  ]}
                  onPress={() => handleApplyPreset(5, 15)}
                  activeOpacity={0.8}
                >
                  <Text style={createGroupStyles.presetChipText}>$5 - $15</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    createGroupStyles.presetChip,
                    minBudget === '15' && maxBudget === '30' && !noLimit && createGroupStyles.presetChipActive,
                  ]}
                  onPress={() => handleApplyPreset(15, 30)}
                  activeOpacity={0.8}
                >
                  <Text style={createGroupStyles.presetChipText}>$15 - $30</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    createGroupStyles.presetChip,
                    minBudget === '30' && maxBudget === '50' && !noLimit && createGroupStyles.presetChipActive,
                  ]}
                  onPress={() => handleApplyPreset(30, 50)}
                  activeOpacity={0.8}
                >
                  <Text style={createGroupStyles.presetChipText}>$30 - $50+</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    createGroupStyles.presetChip,
                    minBudget === '250' && maxBudget === '700' && !noLimit && createGroupStyles.presetChipActive,
                  ]}
                  onPress={() => handleApplyPreset(250, 700)}
                  activeOpacity={0.8}
                >
                  <Text style={createGroupStyles.presetChipText}>Bs. 250 - 700</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    createGroupStyles.presetChip,
                    minBudget === '700' && maxBudget === '1500' && !noLimit && createGroupStyles.presetChipActive,
                  ]}
                  onPress={() => handleApplyPreset(700, 1500)}
                  activeOpacity={0.8}
                >
                  <Text style={createGroupStyles.presetChipText}>Bs. 700 - 1500</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    createGroupStyles.presetChip,
                    minBudget === '1500' && maxBudget === '3000' && !noLimit && createGroupStyles.presetChipActive,
                  ]}
                  onPress={() => handleApplyPreset(1500, 3000)}
                  activeOpacity={0.8}
                >
                  <Text style={createGroupStyles.presetChipText}>Bs. 1500 - 3000+</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Switch: Sin límite estricto */}
          <View style={createGroupStyles.switchRow}>
            <View style={createGroupStyles.switchTextCol}>
              <Text style={createGroupStyles.switchTitle}>Sin límite estricto</Text>
              <Text style={createGroupStyles.switchSub}>A convenir informalmente entre panas</Text>
            </View>
            <Switch
              value={noLimit}
              onValueChange={setNoLimit}
              trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.secondaryContainer }}
              thumbColor={theme.colors.white}
            />
          </View>
        </View>

        {/* Card 3: Reglas y Cupos */}
        <View style={createGroupStyles.card}>
          {/* Límite de Panas */}
          <View style={createGroupStyles.switchRow}>
            <View style={createGroupStyles.switchTextCol}>
              <View style={createGroupStyles.fieldLabelLeft}>
                <Users size={18} color={theme.colors.textSecondary} />
                <Text style={createGroupStyles.fieldLabel}>Límite de Panas</Text>
              </View>
              <Text style={createGroupStyles.switchSub}>Cupos máximos en el sorteo</Text>
            </View>

            <View style={createGroupStyles.stepperContainer}>
              <TouchableOpacity
                style={createGroupStyles.stepperBtn}
                activeOpacity={0.8}
                onPress={() => handleAdjustParticipants(-1)}
                accessibilityLabel="Restar participante"
              >
                <Minus size={18} color={theme.colors.textDark} />
              </TouchableOpacity>

              <Text style={createGroupStyles.stepperValue}>{participantsCount}</Text>

              <TouchableOpacity
                style={createGroupStyles.stepperBtn}
                activeOpacity={0.8}
                onPress={() => handleAdjustParticipants(1)}
                accessibilityLabel="Sumar participante"
              >
                <Plus size={18} color={theme.colors.textDark} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={createGroupStyles.cardDivider} />

          {/* Pistas anónimas de pana */}
          <View style={createGroupStyles.switchRow}>
            <View style={createGroupStyles.switchTextCol}>
              <View style={createGroupStyles.fieldLabelLeft}>
                <Drama size={18} color={theme.colors.secondaryDark} />
                <Text style={createGroupStyles.fieldLabel}>Pistas anónimas de pana</Text>
              </View>
              <Text style={createGroupStyles.switchSub}>
                Permite enviar preguntas y pistas secretas al amigo asignado antes del destape.
              </Text>
            </View>

            <Switch
              value={anonymousClues}
              onValueChange={setAnonymousClues}
              trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.secondaryContainer }}
              thumbColor={theme.colors.white}
            />
          </View>
        </View>

        {/* Mascot Delight Note Banner */}
        <View style={createGroupStyles.mascotTipBanner}>
          <View style={createGroupStyles.mascotTipAvatar}>
            <Sparkles size={20} color={theme.colors.secondaryContainer} />
          </View>
          <Text style={createGroupStyles.mascotTipText}>
            <Text style={{ fontWeight: '700' }}>¡Todo listo mi pana!</Text> Al crear el grupo obtendrás un enlace exclusivo para invitar por WhatsApp a tu familia o combo de amigos.
          </Text>
        </View>

        {/* Primary CTA Action */}
        <View style={createGroupStyles.submitWrap}>
          <TouchableOpacity
            style={createGroupStyles.btnSubmit}
            activeOpacity={0.88}
            onPress={() => void handleCreateGroup()}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={theme.colors.onSecondaryContainer} />
            ) : (
              <Mail size={22} color={theme.colors.onSecondaryContainer} />
            )}
            <Text style={createGroupStyles.btnSubmitText}>{saving ? 'Creando el grupo…' : 'Crear Grupo y Generar Enlace'}</Text>
          </TouchableOpacity>
          <Text style={createGroupStyles.submitSubtext}>
            Nadie sabrá quién le tocó a quién hasta el destape final
          </Text>
        </View>
      </ScrollView>

      {/* Modal de Éxito de Creación del Grupo */}
      <CreateGroupSuccessModal
        visible={!!created}
        groupName={created?.name}
        inviteCode={created?.inviteCode}
        onClose={handleFinishAndReturn}
        onGoToGroups={handleFinishAndReturn}
        onOpenGroup={created && onOpenGroup ? () => onOpenGroup(created.id) : undefined}
      />
      {calendarOpen && (
        <CalendarModal
          visible
          value={exchangeDate}
          onConfirm={(d) => {
            setExchangeDate(d);
            setCalendarOpen(false);
          }}
          onCancel={() => setCalendarOpen(false)}
        />
      )}
    </SafeAreaView>
  );
};

export default CreateGroupScreen;
