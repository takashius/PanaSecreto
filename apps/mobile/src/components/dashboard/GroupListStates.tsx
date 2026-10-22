import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { PlusCircle, RefreshCw, Ticket, WifiOff } from 'lucide-react-native';
import { theme, dashboardStyles } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';

/** Tarjetas de relleno mientras llega la primera respuesta */
export function GroupCardSkeleton() {
  const block = (w: number | `${number}%`, h: number) => <View style={[dashboardStyles.skeletonBlock, { width: w, height: h }]} />;
  return (
    <View style={dashboardStyles.skeletonCard} accessibilityLabel="Cargando grupos">
      <View style={dashboardStyles.skeletonRow}>
        {block(48, 48)}
        <View style={{ flex: 1, gap: 6 }}>
          {block('70%', 14)}
          {block('45%', 10)}
        </View>
      </View>
      <View style={dashboardStyles.skeletonRow}>
        {block('48%', 44)}
        {block('48%', 44)}
      </View>
      {block('100%', 8)}
    </View>
  );
}

interface EmptyProps {
  segment: 'creados' | 'participo';
  onCreate: () => void;
  onJoin: () => void;
}

export function EmptyGroups({ segment, onCreate, onJoin }: EmptyProps) {
  const creator = segment === 'creados';
  return (
    <View style={dashboardStyles.emptyCard}>
      <Image source={BRAND_ISOTIPO} style={dashboardStyles.emptyMascot} />
      <Text style={dashboardStyles.emptyTitle}>{creator ? 'Aún no organizas ningún intercambio' : 'Todavía no estás en el grupo de nadie'}</Text>
      <Text style={dashboardStyles.emptyText}>
        {creator
          ? 'Crea un grupo, invita a tus panas con el código y arma el sorteo en un minuto.'
          : 'Pídele el código a quien organiza y únete para recibir tu sobre.'}
      </Text>
      <TouchableOpacity style={dashboardStyles.emptyButton} activeOpacity={0.85} onPress={creator ? onCreate : onJoin}>
        {creator ? <PlusCircle size={18} color={theme.colors.primary} /> : <Ticket size={18} color={theme.colors.primary} />}
        <Text style={dashboardStyles.emptyButtonText}>{creator ? 'Crear mi primer grupo' : 'Unirme con un código'}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function GroupsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={dashboardStyles.emptyCard} accessibilityRole="alert">
      <WifiOff size={32} color={theme.colors.textMuted} />
      <Text style={dashboardStyles.emptyTitle}>No pudimos cargar tus grupos</Text>
      <Text style={dashboardStyles.emptyText}>{message}</Text>
      <TouchableOpacity style={dashboardStyles.emptyButton} activeOpacity={0.85} onPress={onRetry}>
        <RefreshCw size={16} color={theme.colors.primary} />
        <Text style={dashboardStyles.emptyButtonText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
}
