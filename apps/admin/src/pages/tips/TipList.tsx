import { useMemo, useState } from 'react';
import { App, Button, Input, Popconfirm, Select, Switch, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { BulbOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/PageHeader';
import { useCreateTip, useDeleteTip, useTips, useUpdateTip } from '@api/catalogs';
import { TIP_SCREENS, type Tip, type TipInput } from '@app-types/catalogs';
import { getErrorMessage } from '@utils/GetMessage';
import TipFormModal from './TipFormModal';
import TipPreviewPanel from './TipPreviewPanel';

export default function TipList() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [screen, setScreen] = useState('');
  const [active, setActive] = useState<'true' | 'false' | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [editing, setEditing] = useState<Tip | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const { data, isPending, isFetching, refetch } = useTips({ q: search, screen, active, page, limit: pageSize });
  const createMutation = useCreateTip();
  const updateMutation = useUpdateTip();
  const deleteMutation = useDeleteTip();

  const save = (values: TipInput) => {
    const done = () => {
      void message.success(editing ? t('global.updateSuccess') : t('global.createSuccess'));
      setFormOpen(false);
      setEditing(null);
    };
    const fail = (e: unknown) => void message.error(getErrorMessage(e));
    if (editing) updateMutation.mutate({ id: editing.id, ...values }, { onSuccess: done, onError: fail });
    else createMutation.mutate(values, { onSuccess: done, onError: fail });
  };

  const emptyScreens = useMemo(
    () => (data ? TIP_SCREENS.filter((s) => s !== 'general' && (data.activePerScreen?.[s] ?? 0) === 0) : []),
    [data]
  );

  const columns = useMemo<ColumnsType<Tip>>(
    () => [
      {
        title: t('tips.text'),
        key: 'text',
        render: (_: unknown, tip: Tip) => (
          <p className={`min-w-[240px] max-w-sm whitespace-normal leading-snug ${tip.active ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
            {tip.text}
          </p>
        ),
      },
      {
        title: t('tips.screens'),
        key: 'screens',
        render: (_: unknown, tip: Tip) => (
          <div className="flex flex-wrap gap-1 min-w-[140px] max-w-[220px]">
            {tip.screens.map((s) => (
              <Tag key={s} color={s === 'general' ? 'gold' : 'blue'} className="!m-0">
                {t(`tips.screen.${s}`)}
              </Tag>
            ))}
          </div>
        ),
      },
      {
        title: t('tips.weight'),
        key: 'weight',
        align: 'center' as const,
        render: (_: unknown, tip: Tip) => (
          <span className="tabular-nums" aria-label={t('tips.weightAria', { weight: tip.weight })}>
            {'●'.repeat(tip.weight)}
            <span className="text-gray-300 dark:text-gray-600">{'●'.repeat(5 - tip.weight)}</span>
          </span>
        ),
      },
      {
        title: t('tips.activeLabel'),
        key: 'active',
        render: (_: unknown, tip: Tip) => (
          <Switch
            size="small"
            checked={tip.active}
            aria-label={t('tips.toggleActive')}
            onChange={(checked) =>
              updateMutation.mutate({ id: tip.id, active: checked }, { onError: (e) => void message.error(getErrorMessage(e)) })
            }
          />
        ),
      },
      {
        title: t('global.actions'),
        key: 'actions',
        align: 'right' as const,
        render: (_: unknown, tip: Tip) => (
          <div className="flex justify-end gap-1">
            <Tooltip title={t('global.edit')}>
              <Button
                type="text"
                icon={<EditOutlined />}
                aria-label={t('global.edit')}
                onClick={() => {
                  setEditing(tip);
                  setFormOpen(true);
                }}
              />
            </Tooltip>
            <Popconfirm
              title={t('tips.deleteConfirm')}
              description={t('tips.deleteHelp')}
              okText={t('global.delete')}
              okButtonProps={{ danger: true }}
              cancelText={t('global.cancel')}
              onConfirm={() =>
                deleteMutation
                  .mutateAsync(tip.id)
                  .then(() => void message.success(t('tips.deleted')))
                  .catch((e) => void message.error(getErrorMessage(e)))
              }
            >
              <Button type="text" danger icon={<DeleteOutlined />} aria-label={t('global.delete')} />
            </Popconfirm>
          </div>
        ),
      },
    ],
    [t, updateMutation, deleteMutation, message]
  );

  return (
    <div>
      <PageHeader
        breadcrumbItems={[{ title: <Link to="/">{t('menu.dashboard')}</Link> }, { title: t('tips.title') }]}
        title={t('tips.title')}
        titleIcon={<BulbOutlined />}
        description={t('tips.description')}
        onRefresh={() => void refetch()}
        loading={isFetching}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            {t('tips.new')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 2xl:grid-cols-[1fr_360px] gap-6">
        <div className="min-w-0">
          {emptyScreens.length > 0 && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
              {t('tips.emptyScreens')}{' '}
              <strong>{emptyScreens.map((s) => t(`tips.screen.${s}`)).join(', ')}</strong>
            </div>
          )}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <Input.Search
              allowClear
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                if (!e.target.value) {
                  setSearch('');
                  setPage(1);
                }
              }}
              onSearch={(v) => {
                setSearch(v.trim());
                setPage(1);
              }}
              placeholder={t('tips.searchPlaceholder')}
              className="md:max-w-xs"
            />
            <Select
              value={screen}
              onChange={(v) => {
                setScreen(v);
                setPage(1);
              }}
              className="md:w-60"
              aria-label={t('tips.screens')}
              options={[
                { value: '', label: t('tips.allScreens') },
                ...TIP_SCREENS.map((s) => ({
                  value: s,
                  label: `${t(`tips.screen.${s}`)} (${data?.activePerScreen?.[s] ?? 0})`,
                })),
              ]}
            />
            <Select
              value={active}
              onChange={(v) => {
                setActive(v);
                setPage(1);
              }}
              className="md:w-40"
              aria-label={t('tips.activeLabel')}
              options={[
                { value: '', label: t('aliases.anyStatus') },
                { value: 'true', label: t('global.active') },
                { value: 'false', label: t('global.inactive') },
              ]}
            />
          </div>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={data?.results ?? []}
            loading={isPending}
            scroll={{ x: 'max-content' }}
            onChange={(pagination) => {
              if (pagination.current) setPage(pagination.current);
              if (pagination.pageSize) setPageSize(pagination.pageSize);
            }}
            pagination={{
              current: page,
              pageSize,
              total: data?.total ?? 0,
              showSizeChanger: true,
              pageSizeOptions: ['20', '50', '100'],
              showTotal: (total, range) => t('global.showingResults', { start: range[0], end: range[1], total }),
            }}
          />
        </div>
        <TipPreviewPanel />
      </div>

      <TipFormModal
        open={formOpen}
        tip={editing}
        saving={createMutation.isPending || updateMutation.isPending}
        onCancel={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={save}
      />
    </div>
  );
}
