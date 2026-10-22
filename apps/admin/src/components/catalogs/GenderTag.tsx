import { Tag } from 'antd';
import { ManOutlined, WomanOutlined, SmileOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { AliasGender } from '@app-types/catalogs';

const META: Record<AliasGender, { color: string; icon: JSX.Element }> = {
  M: { color: 'blue', icon: <ManOutlined /> },
  F: { color: 'magenta', icon: <WomanOutlined /> },
  N: { color: 'gold', icon: <SmileOutlined /> },
};

/** Género del alias: siempre icono + texto */
export default function GenderTag({ gender }: { gender: AliasGender }) {
  const { t } = useTranslation();
  const meta = META[gender] ?? META.N;
  return (
    <Tag color={meta.color} icon={meta.icon}>
      {t(`aliases.gender.${gender}`)}
    </Tag>
  );
}
