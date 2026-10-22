import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react-native';
import { theme, wishFormStyles as form } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';
import { PRIVACY, TERMS } from '../../constants/legal';

interface LegalScreenProps {
  document: 'terminos' | 'privacidad';
  onNavigateBack: () => void;
}

/** Términos y condiciones o Política de privacidad, leídos dentro de la app */
export const LegalScreen: React.FC<LegalScreenProps> = ({ document, onNavigateBack }) => {
  const insets = useSafeAreaInsets();
  const doc = document === 'terminos' ? TERMS : PRIVACY;
  const Icon = document === 'terminos' ? FileText : ShieldCheck;

  return (
    <SafeAreaView style={form.container} edges={['top']}>
      <View style={form.header}>
        <TouchableOpacity style={form.headerButton} onPress={onNavigateBack} accessibilityLabel="Volver">
          <ArrowLeft size={22} color={theme.colors.primary} strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={form.headerCenter}>
          <Text style={form.headerSubtitle}>EntrePanas</Text>
          <Text style={[form.headerTitle, { fontSize: theme.typography.fontSize.xl }]}>{doc.title}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={[form.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        <View style={form.tipCard}>
          <Image source={BRAND_ISOTIPO} style={form.mascot} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon size={16} color={theme.colors.secondaryDark} strokeWidth={2.4} />
              <Text style={form.tipTitle}>Última actualización</Text>
            </View>
            <Text style={form.tipText}>{doc.updatedAt}</Text>
          </View>
        </View>

        <View style={form.card}>
          <Text style={[form.tipText, { color: theme.colors.textDark, fontSize: theme.typography.fontSize.md, lineHeight: 23 }]}>
            {doc.intro}
          </Text>
          {doc.sections.map((s) => (
            <View key={s.title} style={{ gap: 6, marginTop: 6 }}>
              <Text style={form.label}>{s.title}</Text>
              <Text style={[form.tipText, { fontSize: theme.typography.fontSize.md, lineHeight: 23 }]}>{s.body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LegalScreen;
