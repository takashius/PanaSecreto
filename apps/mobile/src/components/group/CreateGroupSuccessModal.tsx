import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  Linking,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Copy, Check, MessageCircle, Link as LinkIcon } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { createGroupStyles } from '../../styles/createGroup.styles';

interface CreateGroupSuccessModalProps {
  visible: boolean;
  groupName?: string;
  inviteCode?: string;
  onClose: () => void;
  onGoToGroups: () => void;
}

export const CreateGroupSuccessModal: React.FC<CreateGroupSuccessModalProps> = ({
  visible,
  groupName = 'Hallacas con los Primos 🫔',
  inviteCode = 'PANA-7821-GO',
  onClose,
  onGoToGroups,
}) => {
  const insets = useSafeAreaInsets();
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const shareUrl = `https://panasecreto.app/join/${inviteCode}`;
  const shareMessage = `¡Pana! Únete a nuestro Amigo Secreto "${groupName}" en PanaSecreto. 🎄🎁\nCódigo: ${inviteCode}\nEnlace: ${shareUrl}`;

  const handleCopyCode = async () => {
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleCopyLink = async () => {
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleShareWhatsApp = async () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Share.share({
          message: shareMessage,
          title: `Únete a ${groupName}`,
        });
      }
    } catch {
      await Share.share({
        message: shareMessage,
        title: `Únete a ${groupName}`,
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={createGroupStyles.modalBackdrop}>
        <View style={[createGroupStyles.modalSheet, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}>
          {/* Barra de agarre / Drag Handle */}
          <View style={createGroupStyles.modalHandle} />

          {/* Mascota Guaca con sobre */}
          <Image
            source={require('../../../assets/icon.png')}
            style={createGroupStyles.modalMascotImage}
            accessibilityLabel="Mascota Guaca de PanaSecreto"
          />

          {/* Textos de cabecera */}
          <Text style={createGroupStyles.modalSubBadge}>¡TODO LISTO!</Text>
          <Text style={createGroupStyles.modalTitle}>¡Grupo Creado con Éxito! 🎉</Text>
          <Text style={createGroupStyles.modalDescription}>
            Pasa el código a tus panas para que entren antes del sorteo.
          </Text>

          {/* Tarjeta de Código Secreto */}
          <View style={createGroupStyles.codeCard}>
            <View style={createGroupStyles.codeCardLeft}>
              <Text style={createGroupStyles.codeCardLabel}>Código de invitación</Text>
              <Text style={createGroupStyles.codeCardCode}>{inviteCode}</Text>
            </View>

            <TouchableOpacity
              style={createGroupStyles.btnCopyCode}
              activeOpacity={0.8}
              onPress={handleCopyCode}
            >
              {codeCopied ? (
                <Check size={16} color={theme.colors.success} />
              ) : (
                <Copy size={16} color={theme.colors.secondaryDark} />
              )}
              <Text style={[createGroupStyles.btnCopyCodeText, codeCopied && { color: theme.colors.success }]}>
                {codeCopied ? '¡Copiado!' : 'Copiar'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Botones de acción */}
          <View style={createGroupStyles.modalActions}>
            <TouchableOpacity
              style={createGroupStyles.btnWhatsapp}
              activeOpacity={0.85}
              onPress={handleShareWhatsApp}
            >
              <MessageCircle size={20} color={theme.colors.secondaryContainer} />
              <Text style={createGroupStyles.btnWhatsappText}>Compartir por WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={createGroupStyles.btnCopyLink}
              activeOpacity={0.85}
              onPress={handleCopyLink}
            >
              <LinkIcon size={18} color={linkCopied ? theme.colors.success : theme.colors.textDark} />
              <Text style={[createGroupStyles.btnCopyLinkText, linkCopied && { color: theme.colors.success }]}>
                {linkCopied ? '¡Enlace Copiado!' : 'Copiar Link Directo'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={createGroupStyles.btnDismissModal}
              activeOpacity={0.7}
              onPress={onGoToGroups}
            >
              <Text style={createGroupStyles.btnDismissModalText}>Volver a mis grupos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CreateGroupSuccessModal;
