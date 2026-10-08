import type { ReactNode } from 'react';
import { Breadcrumb, Typography, Button, Space } from 'antd';
import type { BreadcrumbProps } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

interface PageHeaderProps {
  breadcrumbItems?: BreadcrumbProps['items'];
  title: string;
  titleIcon?: ReactNode;
  description?: string;
  extra?: ReactNode;
  onRefresh?: () => void;
  loading?: boolean;
}

export default function PageHeader({
  breadcrumbItems,
  title,
  titleIcon,
  description,
  extra,
  onRefresh,
  loading = false,
}: PageHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6">
      {breadcrumbItems && (
        <div className="mb-2">
          <Breadcrumb items={breadcrumbItems} separator=">" className="text-xs" />
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <Title level={3} className="!mb-1 !mt-0 flex items-center gap-2">
            {titleIcon && <span className="text-xl">{titleIcon}</span>}
            {title}
          </Title>
          {description && (
            <Text type="secondary" className="text-sm">
              {description}
            </Text>
          )}
        </div>

        <Space>
          {onRefresh && (
            <Button icon={<ReloadOutlined spin={loading} />} onClick={onRefresh} loading={loading}>
              {t('pageHeader.refresh')}
            </Button>
          )}
          {extra}
        </Space>
      </div>
    </div>
  );
}
