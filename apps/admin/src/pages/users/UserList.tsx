import { useMemo, useState } from 'react';
import { Avatar, Button, Input, Space, Switch, Table, Tag, message } from 'antd';
import type { FilterDropdownProps, FilterValue } from 'antd/es/table/interface';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlusOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import PageHeader from '@components/PageHeader';
import { useCreateUser, useSetUserActive, useUpdateUser, useUsers } from '@api/users';
import type { CreateUserRequest, ManagedUser } from '@app-types/users';
import { getErrorMessage } from '@utils/GetMessage';
import UserFormModal from './UserFormModal';
import { ALL_ROLES } from '../../constants/roles';

const getFilterString = (value: FilterValue | null | undefined) => {
  const first = value?.[0];
  return typeof first === 'string' ? first : '';
};

export default function UserList() {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const [filteredInfo, setFilteredInfo] = useState<Record<string, FilterValue | null>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);

  const q = getFilterString(filteredInfo.user);
  const active = getFilterString(filteredInfo.active) as 'true' | 'false' | '';
  const role = getFilterString(filteredInfo.role);

  const { data, isPending, isFetching, refetch } = useUsers({
    q,
    active,
    role,
    page: currentPage,
    limit: pageSize,
  });

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const setActiveMutation = useSetUserActive();

  const rows = data?.results ?? [];
  const total = data?.total ?? 0;

  const onSubmit = (values: any) => {
    if (editing?._id) {
      updateMutation.mutate(
        { id: editing._id, payload: values },
        {
          onSuccess: () => {
            void messageApi.success(t('global.updateSuccess'));
            setOpenModal(false);
            setEditing(null);
          },
          onError: (e) => void messageApi.error(getErrorMessage(e)),
        }
      );
      return;
    }

    createMutation.mutate(values as CreateUserRequest, {
      onSuccess: () => {
        void messageApi.success(t('global.createSuccess'));
        setOpenModal(false);
      },
      onError: (e) => void messageApi.error(getErrorMessage(e)),
    });
  };

  const columns = useMemo(
    () => [
      {
        title: t('usersManagement.user'),
        key: 'user',
        filteredValue: filteredInfo.user || null,
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
          <div className="p-3 w-64">
            <Input
              placeholder={t('usersManagement.searchPlaceholder')}
              value={selectedKeys[0]}
              onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              onPressEnter={() => confirm()}
              className="mb-2"
            />
            <Space>
              <Button
                type="primary"
                onClick={() => confirm()}
                icon={<SearchOutlined />}
                size="small"
              >
                {t('global.search')}
              </Button>
              <Button onClick={() => clearFilters && clearFilters()} size="small">
                {t('global.clear')}
              </Button>
            </Space>
          </div>
        ),
        filterIcon: (filtered: boolean) => (
          <SearchOutlined style={{ color: filtered ? '#1E1338' : undefined }} />
        ),
        render: (_: unknown, record: ManagedUser) => (
          <div className="flex items-center gap-3">
            <Avatar
              src={record.photo}
              icon={!record.photo && <UserOutlined />}
              className="bg-primary text-white"
            />
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                {record.name} {record.lastName || ''}
              </p>
              <p className="text-xs text-gray-500">{record.email}</p>
            </div>
          </div>
        ),
      },
      {
        title: t('usersManagement.role'),
        key: 'role',
        filteredValue: filteredInfo.role || null,
        filters: ALL_ROLES.map((r: string) => ({ text: r, value: r })),
        render: (_: unknown, record: ManagedUser) => {
          const r = Array.isArray(record.role) ? record.role[0] : record.role;
          let color = 'default';
          if (r === 'SUPER_ADMIN') color = 'purple';
          else if (r === 'ADMIN') color = 'blue';
          else if (r === 'ORGANIZER') color = 'gold';
          else color = 'cyan';

          return <Tag color={color}>{r}</Tag>;
        },
      },
      {
        title: t('usersManagement.phone'),
        dataIndex: 'phone',
        key: 'phone',
        render: (phone: string) => phone || <span className="text-gray-400 italic">No registrado</span>,
      },
      {
        title: t('usersManagement.status'),
        key: 'active',
        filteredValue: filteredInfo.active || null,
        filters: [
          { text: t('global.active'), value: 'true' },
          { text: t('global.inactive'), value: 'false' },
        ],
        filterMultiple: false,
        render: (_: unknown, record: ManagedUser) => (
          <Switch
            checked={record.active}
            onChange={(checked) => {
              setActiveMutation.mutate(
                { id: record._id, active: checked },
                {
                  onSuccess: () => void messageApi.success(t('global.updateSuccess')),
                  onError: (e) => void messageApi.error(getErrorMessage(e)),
                }
              );
            }}
            checkedChildren="Activo"
            unCheckedChildren="Inactivo"
          />
        ),
      },
      {
        title: t('global.actions'),
        key: 'actions',
        render: (_: unknown, record: ManagedUser) => (
          <Space>
            <Button
              size="small"
              onClick={() => {
                setEditing(record);
                setOpenModal(true);
              }}
            >
              {t('global.edit')}
            </Button>
            <Link to={`/users-management/${record._id}`}>
              <Button size="small" type="link">
                {t('usersManagement.detail')}
              </Button>
            </Link>
          </Space>
        ),
      },
    ],
    [filteredInfo, t, messageApi, setActiveMutation]
  );

  return (
    <div>
      {contextHolder}
      <PageHeader
        title={t('usersManagement.title')}
        description={t('usersManagement.description')}
        onRefresh={() => void refetch()}
        loading={isFetching}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setOpenModal(true);
            }}
          >
            {t('usersManagement.createUser')}
          </Button>
        }
      />

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xs border border-gray-200/80 dark:border-gray-800 overflow-hidden">
        <Table
          rowKey="_id"
          columns={columns as any}
          dataSource={rows}
          loading={isPending}
          onChange={(pagination, filters) => {
            setFilteredInfo(filters);
            if (pagination.current) setCurrentPage(pagination.current);
            if (pagination.pageSize) setPageSize(pagination.pageSize);
          }}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (totalCount, range) =>
              t('global.showingResults', {
                start: range[0],
                end: range[1],
                total: totalCount,
              }),
          }}
        />
      </div>

      <UserFormModal
        open={openModal}
        initialValues={editing}
        onCancel={() => {
          setOpenModal(false);
          setEditing(null);
        }}
        onSubmit={onSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
