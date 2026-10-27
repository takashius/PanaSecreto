import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, FileText, ShieldCheck } from 'lucide-react-native';
import { theme, wishFormStyles as form, formStyles, buttonStyles } from '../../styles';
import { useApiQuery } from '../../api/queryStore';
import { fetchPublicLegal, acceptLegal, type LegalDocKey } from '../../api/legal';
import { Alert } from '../../components/common/AppDialog';
import type { SessionUser } from '../../types/session';

interface LegalAcceptanceScreenProps {
  onAccepted: (user: SessionUser) => void;
}

/** Bloqueo hasta aceptar términos y privacidad vigentes (como UniSAN) */
export const LegalAcceptanceScreen: React.FC<LegalAcceptanceScreenProps> = ({ onAccepted }) => {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'terminos' | 'privacidad'>('terminos');
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const termsQuery = useApiQuery('legal:terms', () => fetchPublicLegal('terms'), { staleMs: 60_000 });
  const privacyQuery = useApiQuery('legal:privacy', () => fetchPublicLegal('privacy'), { staleMs: 60_000 });
  const activeQuery = tab === 'terminos' ? termsQuery : privacyQuery;
  const doc = activeQuery.data;

  const onAccept = async () => {
    if (!checked) {
      Alert.alert('Falta tu confirmación', 'Marca que leíste y aceptas los términos y la política de privacidad.');
      return;
    }
    setSubmitting(true);
    try {
      const profile = await acceptLegal();
      onAccepted(profile as SessionUser);
    } catch {
      Alert.alert('No se pudo guardar', 'Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={form.container} edges={['top', 'bottom']}>
      <View style={[form.header, { borderBottomWidth: 0 }]}>
        <View style={{ flex: 1 }}>
          <Text style={form.headerSubtitle}>EntrePanas</Text>
          <Text style={form.headerTitle}>Documentos actualizados</Text>
          <Text style={[form.tipText, { marginTop: 4 }]}>
            Actualizamos nuestros textos legales. Léelos y acéptalos para seguir usando la app.
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 }}>
        {(['terminos', 'privacidad'] as const).map((key) => {
          const Icon = key === 'terminos' ? FileText : ShieldCheck;
          const active = tab === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setTab(key)}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: active ? theme.colors.secondaryContainer : theme.colors.surfaceVariant,
              }}
            >
              <Icon size={16} color={active ? theme.colors.onSecondaryContainer : theme.colors.textMuted} />
              <Text style={{ fontFamily: theme.typography.fontFamily.semibold, color: active ? theme.colors.onSecondaryContainer : theme.colors.textMuted }}>
                {key === 'terminos' ? 'Términos' : 'Privacidad'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeQuery.loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : activeQuery.error || !doc ? (
        <View style={{ padding: 16 }}>
          <Text style={form.tipText}>No pudimos cargar el documento. {activeQuery.error?.message}</Text>
          <TouchableOpacity onPress={() => void activeQuery.refetch()} style={{ marginTop: 12 }}>
            <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.fontFamily.bold }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text style={[form.label, { fontSize: theme.typography.fontSize.lg }]}>{doc.title}</Text>
          {doc.updatedAt ? (
            <Text style={[form.tipText, { marginBottom: 12 }]}>
              Versión {doc.version} · {new Date(doc.updatedAt).toLocaleDateString('es-VE')}
            </Text>
          ) : null}
          {doc.sections.map((s) => (
            <View key={s.id} style={{ marginBottom: 14, gap: 4 }}>
              {s.title ? <Text style={form.label}>{s.title}</Text> : null}
              <Text style={[form.tipText, { fontSize: theme.typography.fontSize.md, lineHeight: 22 }]}>{s.body.replace(/\n/g, ' ')}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={{ paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 12), gap: 12, borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant, paddingTop: 12 }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}
          onPress={() => setChecked((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
        >
          <View style={[formStyles.checkbox, checked && formStyles.checkboxActive, { marginTop: 2 }]}>
            {checked ? <Check size={14} color={theme.colors.onSecondaryContainer} /> : null}
          </View>
          <Text style={[form.tipText, { flex: 1, color: theme.colors.textDark }]}>
            He leído y acepto los términos y condiciones y la política de privacidad vigentes.
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[buttonStyles.btnPrimary, submitting && { opacity: 0.7 }]}
          onPress={() => void onAccept()}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={theme.colors.onSecondaryContainer} />
          ) : (
            <Text style={buttonStyles.btnPrimaryText}>Aceptar y continuar</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LegalAcceptanceScreen;
