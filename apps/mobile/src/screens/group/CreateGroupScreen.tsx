import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  Alert,
} from 'react-native';
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

interface CreateGroupScreenProps {
  onNavigateBack: () => void;
  onGroupCreated?: (newGroup: any) => void;
}

export const CreateGroupScreen: React.FC<CreateGroupScreenProps> = ({
  onNavigateBack,
  onGroupCreated,
}) => {
  // Form States
  const [groupName, setGroupName] = useState('Hallacas con los Primos 🫔');
  const [exchangeDate, setExchangeDate] = useState('24 de Diciembre, 2025');
  const [currency, setCurrency] = useState<'USD' | 'VES'>('USD');
  const [minBudget, setMinBudget] = useState('10');
  const [maxBudget, setMaxBudget] = useState('35');
  const [noLimit, setNoLimit] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(12);
  const [anonymousClues, setAnonymousClues] = useState(true);

  // Success Modal State
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [generatedInviteCode, setGeneratedInviteCode] = useState('PANA-7821-GO');

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

  // Date Selection Picker Simulation
  const handlePickDate = () => {
    Alert.alert(
      '📅 Fecha del Intercambio',
      'Selecciona el día oficial para el destape de los regalos:',
      [
        {
          text: '24 de Diciembre, 2025 (Nochebuena)',
          onPress: () => setExchangeDate('24 de Diciembre, 2025'),
        },
        {
          text: '25 de Diciembre, 2025 (Navidad)',
          onPress: () => setExchangeDate('25 de Diciembre, 2025'),
        },
        {
          text: '31 de Diciembre, 2025 (Fin de Año)',
          onPress: () => setExchangeDate('31 de Diciembre, 2025'),
        },
        {
          text: '15 de Diciembre, 2025 (Parranda de Oficina)',
          onPress: () => setExchangeDate('15 de Diciembre, 2025'),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  // Submit Handler
  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      Alert.alert('Nombre requerido', 'Por favor ingresa un nombre para el grupo de panas.');
      return;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newCode = `PANA-${randomSuffix}-GO`;
    setGeneratedInviteCode(newCode);

    onGroupCreated?.({
      name: groupName,
      date: exchangeDate,
      currency,
      minBudget: noLimit ? null : minBudget,
      maxBudget: noLimit ? null : maxBudget,
      participantsLimit: participantsCount,
      anonymousClues,
      code: newCode,
    });

    setIsSuccessModalVisible(true);
  };

  const handleFinishAndReturn = () => {
    setIsSuccessModalVisible(false);
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
              source={require('../../../assets/icon.png')}
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
              />
            </View>
            <Text style={createGroupStyles.fieldHint}>
              Un nombre con sabor navideño para que todos lo reconozcan rápido.
            </Text>
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
              onPress={handlePickDate}
            >
              <View style={createGroupStyles.dateTriggerLeft}>
                <Calendar size={18} color={theme.colors.secondaryDark} />
                <Text style={createGroupStyles.dateTriggerText}>{exchangeDate}</Text>
              </View>
              <ChevronDown size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Card 2: Rango de Presupuesto */}
        <View style={createGroupStyles.card}>
          <View style={createGroupStyles.cardHeaderRow}>
            <View>
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
            onPress={handleCreateGroup}
          >
            <Mail size={22} color={theme.colors.onSecondaryContainer} />
            <Text style={createGroupStyles.btnSubmitText}>Crear Grupo y Generar Enlace</Text>
          </TouchableOpacity>
          <Text style={createGroupStyles.submitSubtext}>
            Nadie sabrá quién le tocó a quién hasta el destape final
          </Text>
        </View>
      </ScrollView>

      {/* Modal de Éxito de Creación del Grupo */}
      <CreateGroupSuccessModal
        visible={isSuccessModalVisible}
        groupName={groupName}
        inviteCode={generatedInviteCode}
        onClose={() => setIsSuccessModalVisible(false)}
        onGoToGroups={handleFinishAndReturn}
      />
    </SafeAreaView>
  );
};

export default CreateGroupScreen;
