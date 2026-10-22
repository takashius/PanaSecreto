import { useMemo, useState } from 'react';
import { Button, Input, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { FilterDropdownProps, FilterValue } from 'antd/es/table/interface';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GiftOutlined, SearchOutlined } from '@ant-design/icons';
import PageHeader from '@components/PageHeader';
import GroupStatusTag from '@components/groups/GroupStatusTag';
import { useAdminGroups } from '@api/groups';
import { GROUP_STATUSES, type AdminGroupRow } from '@app-types/groups';
import { formatBudget, formatDate } from '@utils/format';

const getFilterString = (value: FilterValue | null | undefined) => {
  const first = value?.[0];
  return typeof first === 'string' ? first : '';
};

export default function GroupList() {
  const { t } = useTranslation();
  const [filteredInfo, setFilteredInfo] = useState<Record<string, FilterValue | null>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const q = getFilterString(filteredInfo.group);
  const status = getFilterString(filteredInfo.status);

  const { data, isPending, isFetching, refetch } = useAdminGroups({ q, status, page: currentPage, limit: pageSize });

  const columns = useMemo<ColumnsType<AdminGroupRow>>(
    () => [
      {
        title: t('groupsManagement.group'),
        key: 'group',
        filteredValue: filteredInfo.group || null,
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
          <div className="p-3 w-64">
            <Input
              placeholder={t('groupsManagement.searchPlaceholder')}
              value={selectedKeys[0]}
              onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              onPressEnter={() => confirm()}
              className="mb-2"
            />
            <Space>
              <Button type="primary" onClick={() => confirm()} icon={<SearchOutlined />} size="small">
                {t('global.search')}
              </Button>
              <Button onClick={() => clearFilters && clearFilters()} size="small">
                {t('global.clear')}
              </Button>
            </Space>
          </div>
        ),
        filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#0B2D5B' : undefined }} />,
        render: (_: unknown, record: AdminGroupRow) => (
          <Link to={`/groups/${record.id}`} className="flex items-center gap-3 group">
            <span className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-lg shrink-0">
              {record.emoji || '🎁'}
            </span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100 leading-tight group-hover:underline">
                {record.name}
              </p>
              <Typography.Text code className="text-xs">
                {record.inviteCode}
              </Typography.Text>
            </div>
          </Link>
        ),
      },
      {
        title: t('groupsManagement.status'),
        key: 'status',
        filteredValue: filteredInfo.status || null,
        filterMultiple: false,
        filters: GROUP_STATUSES.map((s) => ({ text: t(`groupStatus.${s}`), value: s })),
        render: (_: unknown, record: AdminGroupRow) => <GroupStatusTag status={record.status} />,
      },
      {
        title: t('groupsManagement.creator'),
        key: 'creator',
        responsive: ['xl'],
        render: (_: unknown, record: AdminGroupRow) => (
          <div>
            <p className="text-gray-800 dark:text-gray-200 leading-tight">{record.creator.name}</p>
            <p className="text-xs text-gray-500">{record.creator.email}</p>
          </div>
        ),
      },
      {
        title: t('groupsManagement.members'),
        key: 'members',
        align: 'right' as const,
        render: (_: unknown, record: AdminGroupRow) => (
          <span className="tabular-nums">
            {record.memberCount} / {record.maxParticipants}
          </span>
        ),
      },
      {
        title: t('groupsManagement.exchangeDate'),
        key: 'exchangeDate',
        render: (_: unknown, record: AdminGroupRow) => formatDate(record.exchangeDate),
      },
      {
        title: t('groupsManagement.budget'),
        key: 'budget',
        responsive: ['lg'],
        render: (_: unknown, record: AdminGroupRow) =>
          formatBudget(record.budgetMin, record.budgetMax, record.currency, t('groupsManagement.noLimit')),
      },
    ],
    [filteredInfo, t]
  );

  return (
    <div>
      <PageHeader
        breadcrumbItems={[{ title: <Link to="/">{t('menu.dashboard')}</Link> }, { title: t('groupsManagement.title') }]}
        title={t('groupsManagement.title')}
        titleIcon={<GiftOutlined />}
        description={t('groupsManagement.description')}
        onRefresh={() => void refetch()}
        loading={isFetching}
      />

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.results ?? []}
        loading={isPending}
        scroll={{ x: 'max-content' }}
        onChange={(pagination, filters) => {
          setFilteredInfo(filters);
          if (pagination.current) setCurrentPage(pagination.current);
          if (pagination.pageSize) setPageSize(pagination.pageSize);
        }}
        pagination={{
          current: currentPage,
          pageSize,
          total: data?.total ?? 0,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (totalCount, range) =>
            t('global.showingResults', { start: range[0], end: range[1], total: totalCount }),
        }}
      />
    </div>
  );
}
