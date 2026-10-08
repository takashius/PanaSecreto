import { ReactNode } from 'react';
import { Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface PageHeaderProps {
  title: string;
  description?: string;
  extra?: ReactNode;
  onRefresh?: () => void;
  loading?: boolean;
}

export default function PageHeader({
  title,
  description,
  extra,
  onRefresh,
  loading,
}: PageHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200/80 pb-4 dark:border-gray-800">
      <div>
        <h1 className="text-2xl font-bold font-heading text-gray-900 dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={onRefresh}
            loading={loading}
          >
            {t('pageHeader.refresh')}
          </Button>
        )}
        {extra}
      </div>
    </div>
  );
}
