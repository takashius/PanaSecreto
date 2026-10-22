import React from 'react';
import { Modal, View, Text, TouchableOpacity, Image, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Phone, MessageCircle, UserRound } from 'lucide-react-native';
import { theme, dialogStyles as styles } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';
import { CONTACT } from '../../constants/app';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** Hoja inferior "Contáctanos" con el nombre, correo y teléfono del equipo */
export const ContactModal: React.FC<Props> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const open = (url: string) => void Linking.openURL(url).catch(() => undefined);

  const rows = [
    { icon: UserRound, label: 'Contacto', value: CONTACT.name, hint: CONTACT.role },
    {
      icon: Mail,
      label: 'Correo',
      value: CONTACT.email,
      onPress: () => open(`mailto:${CONTACT.email}?subject=${encodeURIComponent('Ayuda con EntrePanas')}`),
    },
    ...(CONTACT.phone
      ? [
          { icon: Phone, label: 'Teléfono', value: CONTACT.phoneLabel || CONTACT.phone, onPress: () => open(`tel:${CONTACT.phone}`) },
          {
            icon: MessageCircle,
            label: 'WhatsApp',
            value: 'Escríbenos por WhatsApp',
            onPress: () => open(`https://wa.me/${CONTACT.phone.replace(/\D/g, '')}`),
          },
        ]
      : []),
  ];

  return (
    <Modal transparent visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.handle} />
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Image source={BRAND_ISOTIPO} style={styles.mascot} />
            <Text style={styles.title}>Contáctanos</Text>
            <Text style={styles.message}>¿Dudas, ideas o algo no funciona? Escríbenos y te respondemos lo antes posible.</Text>
          </View>
          {rows.map(({ icon: Icon, label, value, hint, onPress }) => (
            <TouchableOpacity key={label} style={styles.contactRow} onPress={onPress} disabled={!onPress} activeOpacity={0.8}>
              <View style={styles.contactIcon}>
                <Icon size={20} color={theme.colors.accentDark} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactLabel}>{label}</Text>
                <Text style={styles.contactValue} selectable>
                  {value}
                </Text>
                {!!hint && <Text style={styles.contactLabel}>{hint}</Text>}
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.button, styles.buttonPrimary, styles.buttonStacked]} onPress={onClose}>
            <Text style={styles.buttonText}>Listo</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default ContactModal;
