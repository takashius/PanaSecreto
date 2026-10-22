import { useMemo, useState } from 'react';
import { App, Button, Card, Input, Popconfirm, Segmented, Select, Switch, Table, Tabs, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  ImportOutlined,
  PlusOutlined,
  SmileOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/PageHeader';
import GroupStatusTag from '@components/groups/GroupStatusTag';
import GenderTag from '@components/catalogs/GenderTag';
import {
  useAliasCatalog,
  useClearCustomAlias,
  useCreateAlias,
  useCustomAliases,
  useDeleteAlias,
  useUpdateAlias,
} from '@api/catalogs';
import { ALIAS_GENDERS, type AliasGender, type AliasInput, type AliasSuggestion, type CustomAliasRow } from '@app-types/catalogs';
import { getErrorMessage } from '@utils/GetMessage';
import { formatNumber } from '@utils/format';
import AliasFormModal from './AliasFormModal';
import AliasImportModal from './AliasImportModal';

type GenderFilter = AliasGender | 'ALL';

export default function AliasList() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [tab, setTab] = useState<'catalog' | 'custom'>('catalog');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState<GenderFilter>('ALL');
  const [active, setActive] = useState<'true' | 'false' | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [editing, setEditing] = useState<AliasSuggestion | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const filters = { q: search, gender: gender === 'ALL' ? '' : gender, active, page, limit: pageSize };
  const { data, isPending, isFetching, refetch } = useAliasCatalog(filters);
  const custom = useCustomAliases(tab === 'custom');
  const createMutation = useCreateAlias();
  const updateMutation = useUpdateAlias();
  const deleteMutation = useDeleteAlias();
  const clearMutation = useClearCustomAlias();

  const resetPage = () => setPage(1);

  const save = (values: AliasInput) => {
    const done = () => {
      void message.success(editing ? t('global.updateSuccess') : t('global.createSuccess'));
      setFormOpen(false);
      setEditing(null);
    };
    const fail = (e: unknown) => void message.error(getErrorMessage(e));
    if (editing) updateMutation.mutate({ id: editing.id, ...values }, { onSuccess: done, onError: fail });
    else createMutation.mutate(values, { onSuccess: done, onError: fail });
  };

  const importMany = async (items: AliasInput[]) => {
    let created = 0;
    const failed: string[] = [];
    for (const item of items) {
      try {
        await createMutation.mutateAsync(item);
        created += 1;
      } catch {
        failed.push(item.text);
      }
    }
    return { created, failed };
  };

  const columns = useMemo<ColumnsType<AliasSuggestion>>(
    () => [
      {
        title: t('aliases.text'),
        key: 'text',
        render: (_: unknown, a: AliasSuggestion) => (
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-background dark:bg-gray-800 flex items-center justify-center text-lg shrink-0">
              {a.emoji || '🎁'}
            </span>
            <span className={`font-semibold ${a.active ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 line-through'}`}>
              {a.text}
            </span>
          </div>
        ),
      },
      {
        title: t('aliases.genderLabel'),
        key: 'gender',
        render: (_: unknown, a: AliasSuggestion) => <GenderTag gender={a.gender} />,
      },
      {
        title: t('aliases.activeLabel'),
        key: 'active',
        render: (_: unknown, a: AliasSuggestion) => (
          <Switch
            size="small"
            checked={a.active}
            aria-label={t('aliases.toggleActive', { alias: a.text })}
            onChange={(checked) =>
              updateMutation.mutate(
                { id: a.id, active: checked },
                { onError: (e) => void message.error(getErrorMessage(e)) }
              )
            }
          />
        ),
      },
      {
        title: t('global.actions'),
        key: 'actions',
        align: 'right' as const,
        render: (_: unknown, a: AliasSuggestion) => (
          <div className="flex justify-end gap-1">
            <Tooltip title={t('global.edit')}>
              <Button
                type="text"
                icon={<EditOutlined />}
                aria-label={t('global.edit')}
                onClick={() => {
                  setEditing(a);
                  setFormOpen(true);
                }}
              />
            </Tooltip>
            <Popconfirm
              title={t('aliases.deleteConfirm', { alias: a.text })}
              description={t('aliases.deleteHelp')}
              okText={t('global.delete')}
              okButtonProps={{ danger: true }}
              cancelText={t('global.cancel')}
              onConfirm={() =>
                deleteMutation
                  .mutateAsync(a.id)
                  .then(() => void message.success(t('aliases.deleted')))
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

  const customColumns: ColumnsType<CustomAliasRow> = [
    {
      title: t('aliases.customAlias'),
      key: 'alias',
      render: (_: unknown, r: CustomAliasRow) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">{r.aliasEmoji || '🎁'}</span>
          <span className="font-semibold">{r.alias}</span>
          {r.flagged && (
            <Tag color="red" icon={<ExclamationCircleOutlined />}>
              {t('aliases.flagged')}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: t('usersManagement.user'),
      key: 'user',
      render: (_: unknown, r: CustomAliasRow) => (
        <div>
          <Link to={`/users-management/${r.user.id}`} className="text-gray-900 dark:text-gray-100 hover:underline leading-tight">
            {r.user.name || '—'}
          </Link>
          <p className="text-xs text-gray-500">{r.user.email}</p>
        </div>
      ),
    },
    {
      title: t('groupsManagement.group'),
      key: 'group',
      render: (_: unknown, r: CustomAliasRow) => (
        <div className="flex items-center gap-2">
          <Link to={`/groups/${r.groupId}`} className="hover:underline">
            {r.groupName}
          </Link>
          <GroupStatusTag status={r.status} />
        </div>
      ),
    },
    {
      title: t('global.actions'),
      key: 'actions',
      align: 'right' as const,
      render: (_: unknown, r: CustomAliasRow) => (
        <Popconfirm
          title={t('aliases.clearConfirm', { alias: r.alias })}
          description={r.status === 'WAITING' ? t('aliases.clearHelpWaiting') : t('aliases.clearHelpDrawn')}
          okText={t('aliases.clear')}
          okButtonProps={{ danger: true }}
          cancelText={t('global.cancel')}
          onConfirm={() =>
            clearMutation
              .mutateAsync({ groupId: r.groupId, userId: r.user.id })
              .then(() => void message.success(t('aliases.cleared')))
              .catch((e) => void message.error(getErrorMessage(e)))
          }
        >
          <Button danger size="small" icon={<StopOutlined />}>
            {t('aliases.clear')}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const flaggedCount = custom.data?.results.filter((r) => r.flagged).length ?? 0;

  return (
    <div>
      <PageHeader
        breadcrumbItems={[{ title: <Link to="/">{t('menu.dashboard')}</Link> }, { title: t('aliases.title') }]}
        title={t('aliases.title')}
        titleIcon={<SmileOutlined />}
        description={t('aliases.description')}
        onRefresh={() => void (tab === 'catalog' ? refetch() : custom.refetch())}
        loading={tab === 'catalog' ? isFetching : custom.isFetching}
        extra={
          tab === 'catalog' && (
            <>
              <Button icon={<ImportOutlined />} onClick={() => setImportOpen(true)}>
                {t('aliases.import')}
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                {t('aliases.new')}
              </Button>
            </>
          )
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {ALIAS_GENDERS.map((g) => {
          const stats = data?.byGender?.[g];
          const selected = gender === g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => {
                setGender(selected ? 'ALL' : g);
                resetPage();
                setTab('catalog');
              }}
              aria-pressed={selected}
              className={`text-left rounded-2xl border p-4 transition-colors bg-white dark:bg-gray-900 ${
                selected ? 'border-primary ring-2 ring-primary/20 dark:border-secondary' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <GenderTag gender={g} />
                <span className="text-xs text-gray-500">{t('aliases.activeOf', { active: formatNumber(stats?.active ?? 0) })}</span>
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{formatNumber(stats?.total ?? 0)}</p>
              <p className="text-xs text-gray-500">{t('aliases.suggestionsLabel')}</p>
            </button>
          );
        })}
      </div>

      <Card className="rounded-2xl shadow-xs" styles={{ body: { paddingTop: 8 } }}>
        <Tabs
          activeKey={tab}
          onChange={(k) => setTab(k as 'catalog' | 'custom')}
          items={[
            {
              key: 'catalog',
              label: t('aliases.catalogTab'),
              children: (
                <>
                  <div className="flex flex-col md:flex-row gap-3 mb-4">
                    <Input.Search
                      allowClear
                      value={q}
                      onChange={(e) => {
                        setQ(e.target.value);
                        if (!e.target.value) {
                          setSearch('');
                          resetPage();
                        }
                      }}
                      onSearch={(v) => {
                        setSearch(v.trim());
                        resetPage();
                      }}
                      placeholder={t('aliases.searchPlaceholder')}
                      className="md:max-w-xs"
                    />
                    <Segmented<GenderFilter>
                      value={gender}
                      onChange={(v) => {
                        setGender(v);
                        resetPage();
                      }}
                      options={[
                        { value: 'ALL', label: t('aliases.all') },
                        ...ALIAS_GENDERS.map((g) => ({ value: g as GenderFilter, label: t(`aliases.gender.${g}`) })),
                      ]}
                    />
                    <Select
                      value={active}
                      onChange={(v) => {
                        setActive(v);
                        resetPage();
                      }}
                      className="md:w-44"
                      options={[
                        { value: '', label: t('aliases.anyStatus') },
                        { value: 'true', label: t('global.active') },
                        { value: 'false', label: t('global.inactive') },
                      ]}
                      aria-label={t('aliases.activeLabel')}
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
                      pageSizeOptions: ['20', '50', '100', '200'],
                      showTotal: (total, range) => t('global.showingResults', { start: range[0], end: range[1], total }),
                    }}
                  />
                </>
              ),
            },
            {
              key: 'custom',
              label: (
                <span className="flex items-center gap-2">
                  {t('aliases.customTab')}
                  {flaggedCount > 0 && <Tag color="red" className="!m-0">{flaggedCount}</Tag>}
                </span>
              ),
              children: (
                <>
                  <p className="text-sm text-gray-500 mb-4">{t('aliases.customHelp')}</p>
                  <Table
                    rowKey={(r) => `${r.groupId}:${r.user.id}`}
                    columns={customColumns}
                    dataSource={custom.data?.results ?? []}
                    loading={custom.isPending}
                    scroll={{ x: 'max-content' }}
                    locale={{ emptyText: t('aliases.customEmpty') }}
                    pagination={{ pageSize: 20, hideOnSinglePage: true }}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>

      <AliasFormModal
        open={formOpen}
        alias={editing}
        saving={createMutation.isPending || updateMutation.isPending}
        onCancel={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={save}
      />
      <AliasImportModal open={importOpen} onCancel={() => setImportOpen(false)} onImport={importMany} />
    </div>
  );
}
