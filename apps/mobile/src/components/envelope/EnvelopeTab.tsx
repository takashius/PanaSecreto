import React from 'react';
import { formatBudget } from '../../utils/format';
import { LockedEnvelope } from './LockedEnvelope';
import { SealedEnvelope } from './SealedEnvelope';
import { OpenedEnvelope } from './OpenedEnvelope';
import type { GroupDetailView, WishPreview } from '../../types/session';

interface Props {
  group: GroupDetailView;
  opened: boolean;
  onOpen: () => void;
  onOpenWish: (wish: WishPreview) => void;
  onOpenReveal?: () => void;
}

/** Pestaña "Mi sobre": bloqueado (antes del sorteo) → sellado → abierto */
export const EnvelopeTab: React.FC<Props> = ({ group, opened, onOpen, onOpenWish, onOpenReveal }) => {
  const budgetLabel = `${formatBudget(group.currency, group.budgetMin, group.budgetMax)} ${group.currency === 'USD' ? 'USD' : ''}`.trim();
  const exchangeDateLong = group.envelope?.exchangeDateLong ?? group.exchangeDateLong;

  if (group.status === 'WAITING' || !group.envelope) {
    return (
      <LockedEnvelope
        organizerName={group.organizerName}
        isOrganizer={group.isOrganizer}
        exchangeDateLong={exchangeDateLong}
        budgetLabel={budgetLabel}
      />
    );
  }

  if (!opened && group.status === 'LOCKED') {
    return (
      <SealedEnvelope
        exchangeDateLong={exchangeDateLong}
        budgetLabel={budgetLabel}
        year={new Date(group.envelope.exchangeAt).getFullYear()}
        onOpen={onOpen}
      />
    );
  }

  const budgetMaxLabel = formatBudget(group.currency, null, group.budgetMax ?? group.budgetMin).replace('Hasta', 'hasta');
  return <OpenedEnvelope envelope={group.envelope} budgetMaxLabel={budgetMaxLabel} onOpenWish={onOpenWish} onOpenReveal={onOpenReveal} />;
};

export default EnvelopeTab;
