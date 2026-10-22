import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { MapPin, Map } from 'lucide-react-native';
import { theme, groupDetailStyles as styles } from '../../styles';
import type { GroupDetailView } from '../../types/session';

interface Props {
  location: GroupDetailView['location'];
  note: GroupDetailView['note'];
  canEdit: boolean;
  onEdit: () => void;
}

/** Lugar del encuentro + nota de la organización para el día del intercambio */
export const MeetingPlaceCard: React.FC<Props> = ({ location, note, canEdit, onEdit }) => {
  const openMap = () => {
    if (!location) return;
    const query = encodeURIComponent(`${location.name}, ${location.address}`);
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <MapPin size={18} color={theme.colors.primary} strokeWidth={2.2} />
        </View>
        <Text style={[styles.sectionTitle, styles.sectionTitleBox]}>Lugar del encuentro</Text>
        {canEdit && (
          <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.linkText}>{location ? 'Editar' : 'Agregar'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {location ? (
        <View style={[styles.insetBox, styles.placeRow]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.placeName}>{location.name}</Text>
            <Text style={styles.placeAddress}>{location.address}</Text>
          </View>
          <TouchableOpacity style={styles.pillButton} onPress={openMap} activeOpacity={0.8}>
            <Map size={16} color={theme.colors.accentDark} strokeWidth={2.2} />
            <Text style={styles.pillButtonText}>Ver mapa</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.insetBox, styles.emptyPlace]}>
          <Text style={styles.bodyText}>
            {canEdit ? 'Indica dónde será la parranda para que todos lleguen.' : 'La organización aún no ha indicado el lugar.'}
          </Text>
        </View>
      )}

      {!!note && (
        <View style={styles.noteBox}>
          <Text style={styles.noteEmoji}>🎁</Text>
          <Text style={styles.noteText}>“{note}”</Text>
        </View>
      )}
    </View>
  );
};

export default MeetingPlaceCard;
