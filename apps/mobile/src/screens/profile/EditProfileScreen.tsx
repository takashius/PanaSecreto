import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Alert } from '../../components/common/AppDialog';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, BadgeCheck, UserRound, IdCard, PartyPopper, Info, Mail, Lock, ShieldCheck, CircleCheck } from 'lucide-react-native';
import { theme, profileStyles as styles } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';
import { choosePhotoSource, initialsOf } from '../../utils/pickImage';
import { errorMessage } from '../../api/client';
import type { ProfileView } from '../../types/session';

const MAX_NAME = 80;
const MAX_NICK = 30;

interface EditProfileScreenProps {
  profile: ProfileView;
  /** Guarda en la API; si falla, la pantalla muestra el error y conserva lo escrito */
  onSave: (profile: ProfileView) => Promise<void>;
  onCancel: () => void;
}

const onlyDigits = (v: string) => v.replace(/\D/g, '').slice(0, 10);
/** 4121234567 → "412 123 4567" */
const formatPhone = (d: string) => [d.slice(0, 3), d.slice(3, 6), d.slice(6, 10)].filter(Boolean).join(' ');

/** Editar perfil: foto, nombre, apodo, correo (solo lectura) y teléfono */
export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ profile, onSave, onCancel }) => {
  const insets = useSafeAreaInsets();
  const [photoUri, setPhotoUri] = useState(profile.photoUri ?? null);
  const [fullname, setFullname] = useState(profile.fullname);
  const [nickname, setNickname] = useState(profile.nickname ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const nameError = fullname.trim().length < 2 ? 'Escribe tu nombre completo.' : null;
  const phoneError = phone && phone.length !== 10 ? 'El teléfono debe tener 10 dígitos (ej. 412 123 4567).' : null;
  const dirty =
    photoUri !== (profile.photoUri ?? null) ||
    fullname !== profile.fullname ||
    nickname !== (profile.nickname ?? '') ||
    phone !== (profile.phone ?? '');

  const handleCancel = () => {
    if (!dirty) return onCancel();
    Alert.alert('¿Descartar cambios?', 'Lo que cambiaste en tu perfil se perderá.', [
      { text: 'Seguir editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: onCancel },
    ]);
  };

  const handleSave = async () => {
    setSubmitted(true);
    if (nameError || phoneError || saving) return;
    setSaving(true);
    try {
      await onSave({ ...profile, photoUri, fullname: fullname.trim(), nickname: nickname.trim() || null, phone: phone || null });
      Alert.alert(`¡Listo el pollo, ${fullname.trim().split(' ')[0]}!`, 'Tus datos se actualizaron finísimo.');
    } catch (error) {
      setSaving(false);
      Alert.alert('No pudimos guardar tu perfil', errorMessage(error));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.formHeader}>
        <TouchableOpacity style={styles.headerButton} onPress={handleCancel} accessibilityLabel="Volver">
          <ArrowLeft size={22} color={theme.colors.primary} strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={styles.formHeaderCenter}>
          <Text style={styles.formEyebrow}>EntrePanas</Text>
          <Text style={styles.formTitle}>Editar perfil</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView behavior="padding" enabled={Platform.OS === 'ios'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]} keyboardShouldPersistTaps="handled">
          {/* Foto */}
          <View style={styles.photoBlock}>
            <TouchableOpacity
              onPress={() => choosePhotoSource([1, 1], setPhotoUri, photoUri ? () => setPhotoUri(null) : undefined)}
              activeOpacity={0.85}
              accessibilityLabel="Cambiar foto de perfil"
            >
              <View style={styles.photoRing}>
                <View style={styles.photoAvatar}>
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarInitials}>{initialsOf(fullname || profile.fullname)}</Text>
                  )}
                </View>
              </View>
              <View style={styles.photoCamera}>
                <Camera size={17} color={theme.colors.primary} strokeWidth={2.4} />
              </View>
            </TouchableOpacity>
            <Text style={styles.photoName}>{fullname.trim() || profile.fullname}</Text>
            <View style={styles.verifiedChip}>
              <BadgeCheck size={15} color={theme.colors.accentDark} strokeWidth={2.4} />
              <Text style={styles.verifiedText}>Pana verificado</Text>
            </View>
            <Text style={styles.photoHint}>Toca la cámara para subir una foto (JPG o PNG)</Text>
          </View>

          {/* Datos */}
          <View style={styles.formCard}>
            <View style={styles.formCardHeader}>
              <View style={styles.formCardIcon}>
                <UserRound size={18} color={theme.colors.primary} strokeWidth={2.4} />
              </View>
              <Text style={styles.formCardTitle}>Datos del pana</Text>
            </View>

            <Text style={styles.fieldLabel}>
              Nombre completo <Text style={{ color: theme.colors.coral }}>*</Text>
            </Text>
            <View style={[styles.inputRow, submitted && nameError ? styles.inputRowError : null]}>
              <IdCard size={20} color={theme.colors.textMuted} strokeWidth={2.2} />
              <TextInput
                style={styles.input}
                value={fullname}
                onChangeText={setFullname}
                placeholder="Tu nombre y apellido"
                placeholderTextColor={theme.colors.outline}
                maxLength={MAX_NAME}
                autoCapitalize="words"
              />
            </View>
            {submitted && nameError && <Text style={styles.errorText}>{nameError}</Text>}

            <Text style={styles.fieldLabel}>Apodo festivo</Text>
            <View style={styles.inputRow}>
              <PartyPopper size={20} color={theme.colors.textMuted} strokeWidth={2.2} />
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="Ej: Carlitos"
                placeholderTextColor={theme.colors.outline}
                maxLength={MAX_NICK}
              />
            </View>
            <View style={styles.helper}>
              <Info size={14} color={theme.colors.accentDark} />
              <Text style={styles.helperText}>Así te verán tus panas en la lista del grupo. En el chat siempre usas tu alias secreto.</Text>
            </View>

            <Text style={styles.fieldLabel}>Correo electrónico</Text>
            <View style={[styles.inputRow, styles.inputRowReadonly]}>
              <Mail size={20} color={theme.colors.textMuted} strokeWidth={2.2} />
              <Text style={[styles.input, styles.inputReadonly]} numberOfLines={1}>
                {profile.email}
              </Text>
              <Lock size={18} color={theme.colors.textMuted} strokeWidth={2.2} />
            </View>
            <View style={styles.readonlyNote}>
              <ShieldCheck size={16} color={theme.colors.primary} strokeWidth={2.2} />
              <Text style={styles.helperText}>
                <Text style={{ fontWeight: theme.typography.fontWeight.bold, color: theme.colors.primary }}>Solo lectura:</Text> tu
                correo es confidencial y sirve para coordinar los sorteos.
              </Text>
            </View>

            <Text style={styles.fieldLabel}>
              Teléfono <Text style={styles.fieldLabelLight}>(opcional)</Text>
            </Text>
            <View style={styles.phoneRow}>
              <View style={styles.phonePrefix}>
                <Text>🇻🇪</Text>
                <Text style={styles.phonePrefixText}>+58</Text>
              </View>
              <View style={[styles.inputRow, { flex: 1 }, submitted && phoneError ? styles.inputRowError : null]}>
                <TextInput
                  style={styles.input}
                  value={formatPhone(phone)}
                  onChangeText={(v) => setPhone(onlyDigits(v))}
                  placeholder="412 123 4567"
                  placeholderTextColor={theme.colors.outline}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            {submitted && phoneError && <Text style={styles.errorText}>{phoneError}</Text>}
          </View>

          <View style={styles.shieldCard}>
            <Image source={BRAND_ISOTIPO} style={{ width: 52, height: 52, borderRadius: 14 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.shieldEyebrow}>BLINDAJE ENTREPANAS</Text>
              <Text style={styles.shieldTitle}>¡Anonimato 100% blindado!</Text>
              <Text style={styles.shieldText}>Cambiar tus datos no revela tu identidad secreta en tus grupos ni a tu amigo secreto.</Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TouchableOpacity
            style={[styles.saveButton, (!dirty || saving) && styles.saveButtonDisabled]}
            onPress={() => void handleSave()}
            disabled={!dirty || saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <CircleCheck size={22} color={theme.colors.primary} strokeWidth={2.4} />
            )}
            <Text style={styles.saveButtonText}>{saving ? 'Guardando…' : 'Guardar cambios'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={saving}>
            <Text style={styles.cancelText}>Cancelar y volver al perfil</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;
