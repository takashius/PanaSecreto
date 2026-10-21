import type { ReactNode } from 'react';
import { Tag } from 'antd';
import { ClockCircleOutlined, LockOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { GroupStatus } from '@app-types/groups';

/** Estado del grupo: siempre icono + texto (nunca solo color) */
const STATUS_META: Record<GroupStatus, { color: string; icon: ReactNode }> = {
  WAITING: { color: 'gold', icon: <ClockCircleOutlined /> },
  LOCKED: { color: 'blue', icon: <LockOutlined /> },
  REVEALED: { color: 'purple', icon: <EyeOutlined /> },
  COMPLETED: { color: 'default', icon: <CheckCircleOutlined /> },
};

export default function GroupStatusTag({ status }: { status: GroupStatus }) {
  const { t } = useTranslation();
  const meta = STATUS_META[status] ?? STATUS_META.WAITING;
  return (
    <Tag color={meta.color} icon={meta.icon}>
      {t(`groupStatus.${status}`)}
    </Tag>
  );
}
