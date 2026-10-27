import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react-native';
import { theme, wishFormStyles as form } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';
import { useApiQuery } from '../../api/queryStore';
import { fetchPublicLegal, type LegalDocKey } from '../../api/legal';

interface LegalScreenProps {
  document: 'terminos' | 'privacidad';
  onNavigateBack: () => void;
}

const keyOf = (document: 'terminos' | 'privacidad'): LegalDocKey => (document === 'terminos' ? 'terms' : 'privacy');

/** Términos o privacidad desde la API (misma fuente que la web pública) */
export const LegalScreen: React.FC<LegalScreenProps> = ({ document, onNavigateBack }) => {
  const insets = useSafeAreaInsets();
  const Icon = document === 'terminos' ? FileText : ShieldCheck;
  const queryKey = `legal:${keyOf(document)}`;
  const { data: doc, loading, error, refetch } = useApiQuery(queryKey, () => fetchPublicLegal(keyOf(document)), {
    staleMs: 120_000,
  });

  return (
    <SafeAreaView style={form.container} edges={['top']}>
      <View style={form.header}>
        <TouchableOpacity style={form.headerButton} onPress={onNavigateBack} accessibilityLabel="Volver">
          <ArrowLeft size={22} color={theme.colors.primary} strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={form.headerCenter}>
          <Text style={form.headerSubtitle}>EntrePanas</Text>
          <Text style={[form.headerTitle, { fontSize: theme.typography.fontSize.xl }]}>
            {doc?.title ?? (document === 'terminos' ? 'Términos y condiciones' : 'Política de privacidad')}
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error || !doc ? (
        <View style={{ padding: 16, gap: 12 }}>
          <Text style={form.tipText}>No pudimos cargar este documento.</Text>
          <TouchableOpacity onPress={() => void refetch()}>
            <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.fontFamily.bold }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[form.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
          <View style={form.tipCard}>
            <Image source={BRAND_ISOTIPO} style={form.mascot} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon size={16} color={theme.colors.secondaryDark} strokeWidth={2.4} />
                <Text style={form.tipTitle}>Versión {doc.version}</Text>
              </View>
              <Text style={form.tipText}>
                {doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString('es-VE') : 'Vigente'}
              </Text>
            </View>
          </View>

          <View style={form.card}>
            {doc.sections.map((s) => (
              <View key={s.id} style={{ gap: 6, marginTop: 6 }}>
                {s.title ? <Text style={form.label}>{s.title}</Text> : null}
                <Text style={[form.tipText, { fontSize: theme.typography.fontSize.md, lineHeight: 23 }]}>{s.body}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default LegalScreen;
