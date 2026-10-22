import React from 'react';
import { View, Text, TouchableOpacity, Linking, Share } from 'react-native';
import { Alert } from '../common/AppDialog';
import * as Clipboard from 'expo-clipboard';
import { Send, Copy, MessageCircle, Mail, Link } from 'lucide-react-native';
import { theme, groupDetailStyles as styles } from '../../styles';
import { inviteLink } from '../../utils/format';

interface Props {
  groupName: string;
  code: string;
  missing: number;
}

/** Código de invitación y atajos para compartirlo */
export const InviteCard: React.FC<Props> = ({ groupName, code, missing }) => {
  const link = inviteLink(code);
  const message = `¡Epa, pana! Únete a mi Amigo Secreto «${groupName}» en EntrePanas con el código ${code}: ${link}`;

  const copy = async (value: string, what: string) => {
    await Clipboard.setStringAsync(value);
    Alert.alert('¡Listo!', `${what} copiado. Pásalo a tus panas.`);
  };

  const shareWhatsApp = async () => {
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    try {
      await Linking.openURL(url);
    } catch {
      await Share.share({ message });
    }
  };

  const shareMail = () => {
    const subject = encodeURIComponent(`Te invito a «${groupName}» en EntrePanas`);
    void Linking.openURL(`mailto:?subject=${subject}&body=${encodeURIComponent(message)}`);
  };

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Send size={22} color={theme.colors.secondary} strokeWidth={2.4} />
        <Text style={[styles.sectionTitle, styles.sectionTitleBox]}>Invita a tus panas</Text>
        <View style={styles.secretChip}>
          <Text style={styles.secretChipText}>Código secreto</Text>
        </View>
      </View>

      <Text style={styles.bodyText}>
        {missing > 0 ? (
          <>
            Faltan solo <Text style={styles.bodyStrong}>{missing} {missing === 1 ? 'pana' : 'panas'}</Text> para completar el
            cupo del grupo.
          </>
        ) : (
          'El grupo está completo. Puedes subir el cupo desde Editar grupo.'
        )}
      </Text>

      <View style={[styles.insetBox, styles.codeBox]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.codeLabel}>CÓDIGO DE ACCESO</Text>
          <Text style={styles.codeValue} selectable>
            {code}
          </Text>
        </View>
        <TouchableOpacity style={styles.copyButton} onPress={() => void copy(code, 'Código')} activeOpacity={0.8}>
          <Copy size={18} color={theme.colors.primary} strokeWidth={2.2} />
          <Text style={styles.copyButtonText}>Copiar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.shareRow}>
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: theme.colors.whatsappContainer }]}
          onPress={() => void shareWhatsApp()}
          activeOpacity={0.8}
        >
          <MessageCircle size={18} color={theme.colors.whatsapp} strokeWidth={2.2} />
          <Text style={[styles.shareButtonText, { color: theme.colors.whatsapp }]}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} onPress={shareMail} activeOpacity={0.8}>
          <Mail size={18} color={theme.colors.primary} strokeWidth={2.2} />
          <Text style={styles.shareButtonText}>Correo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} onPress={() => void copy(link, 'Link')} activeOpacity={0.8}>
          <Link size={18} color={theme.colors.primary} strokeWidth={2.2} />
          <Text style={styles.shareButtonText}>Link</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default InviteCard;
