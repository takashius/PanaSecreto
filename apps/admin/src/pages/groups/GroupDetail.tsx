import { Alert, App, Avatar, Button, Card, Descriptions, Spin, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  LockOutlined,
  NotificationOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/PageHeader';
import GroupStatusTag from '@components/groups/GroupStatusTag';
import { useAdminGroup, useDeleteGroup } from '@api/groups';
import type { GroupMemberView } from '@app-types/groups';
import { formatBudget, formatDate } from '@utils/format';
import { getErrorMessage } from '@utils/GetMessage';

export default function GroupDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { modal, message } = App.useApp();
  const { data: group, isPending, isFetching, refetch } = useAdminGroup(id);
  const deleteMutation = useDeleteGroup();

  if (isPending) {
    return (
      <div className="flex justify-center p-12">
        <Spin size="large" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-4">{t('groupsManagement.notFound')}</p>
        <Link to="/groups">
          <Button>{t('groupsManagement.backToList')}</Button>
        </Link>
      </div>
    );
  }

  const nameOf = (userId: string) => {
    const m = group.members.find((mm) => mm.userId === userId);
    return m ? [m.name, m.lastName].filter(Boolean).join(' ') : userId;
  };

  const confirmDelete = () => {
    modal.confirm({
      title: t('groupsManagement.deleteConfirmTitle'),
      content: t('groupsManagement.deleteConfirmText'),
      okText: t('global.delete'),
      okButtonProps: { danger: true },
      cancelText: t('global.cancel'),
      onOk: () =>
        deleteMutation
          .mutateAsync(group.id)
          .then(() => {
            void message.success(t('groupsManagement.deleted'));
            void navigate('/groups');
          })
          .catch((e) => {
            void message.error(getErrorMessage(e));
          }),
    });
  };

  const columns: ColumnsType<GroupMemberView> = [
    {
      title: t('usersManagement.user'),
      key: 'user',
      render: (_: unknown, m: GroupMemberView) => (
        <div className="flex items-center gap-3">
          <Avatar src={m.photo || undefined} icon={!m.photo && <UserOutlined />} className="bg-primary text-white shrink-0" />
          <div>
            <Link to={`/users-management/${m.userId}`} className="font-semibold text-gray-900 dark:text-gray-100 leading-tight hover:underline">
              {m.name} {m.lastName || ''}
            </Link>
            {m.nickname && <span className="ml-2 text-xs text-gray-500">«{m.nickname}»</span>}
            <p className="text-xs text-gray-500">{m.email}</p>
          </div>
        </div>
      ),
    },
    {
      title: t('usersManagement.role'),
      key: 'role',
      render: (_: unknown, m: GroupMemberView) => (
        <Tag color={m.role === 'CREATOR' ? 'gold' : 'default'}>{t(`memberRole.${m.role}`)}</Tag>
      ),
    },
    {
      title: t('groupsManagement.exclusions'),
      key: 'exclusions',
      render: (_: unknown, m: GroupMemberView) =>
        m.exclusions && m.exclusions.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {m.exclusions.map((e) => (
              <Tag key={e}>{nameOf(e)}</Tag>
            ))}
          </div>
        ) : (
          <span className="text-gray-400 text-xs">{t('groupsManagement.noExclusions')}</span>
        ),
    },
    {
      title: t('groupsManagement.alias'),
      key: 'alias',
      render: (_: unknown, m: GroupMemberView) =>
        m.hasAlias ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            {t('groupsManagement.aliasChosen')}
          </Tag>
        ) : (
          <Tag icon={<ClockCircleOutlined />}>{t('groupsManagement.aliasPending')}</Tag>
        ),
    },
    {
      title: t('groupsManagement.joinedAt'),
      key: 'joinedAt',
      render: (_: unknown, m: GroupMemberView) => formatDate(m.joinedAt),
    },
  ];

  return (
    <div>
      <PageHeader
        breadcrumbItems={[
          { title: <Link to="/">{t('menu.dashboard')}</Link> },
          { title: <Link to="/groups">{t('groupsManagement.title')}</Link> },
          { title: group.name },
        ]}
        title={`${group.emoji ? `${group.emoji} ` : ''}${group.name}`}
        description={group.description}
        onRefresh={() => void refetch()}
        loading={isFetching}
        extra={
          <div className="flex flex-wrap gap-2">
            <Link to={`/push?group=${group.id}`}>
              <Button icon={<NotificationOutlined />}>{t('push.sendToGroup')}</Button>
            </Link>
            <Button danger icon={<DeleteOutlined />} onClick={confirmDelete} loading={deleteMutation.isPending}>
              {t('groupsManagement.deleteGroup')}
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        <Card className="rounded-2xl shadow-xs" title={t('groupsManagement.info')}>
          <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small" colon={false} layout="vertical">
            <Descriptions.Item label={t('groupsManagement.status')}>
              <GroupStatusTag status={group.status} />
            </Descriptions.Item>
            <Descriptions.Item label={t('groupsManagement.creator')}>{group.creatorName}</Descriptions.Item>
            <Descriptions.Item label={t('groupsManagement.inviteCode')}>
              <Tag className="font-mono">{group.inviteCode}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('groupsManagement.exchangeDate')}>{formatDate(group.exchangeDate, true)}</Descriptions.Item>
            <Descriptions.Item label={t('groupsManagement.budget')}>
              {formatBudget(group.budgetMin, group.budgetMax, group.currency, t('groupsManagement.noLimit'))}
            </Descriptions.Item>
            <Descriptions.Item label={t('groupsManagement.members')}>
              <span className="tabular-nums">
                {group.memberCount} / {group.maxParticipants}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label={t('groupsManagement.anonymousClues')}>
              {group.anonymousClues ? t('groupsManagement.yes') : t('groupsManagement.no')}
            </Descriptions.Item>
            <Descriptions.Item label={t('groupsManagement.location')}>
              {group.location ? (
                <div>
                  <p className="leading-tight">{group.location.name}</p>
                  {group.location.address && <p className="text-xs text-gray-500">{group.location.address}</p>}
                  <a
                    className="text-xs inline-flex items-center gap-1 mt-1"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      [group.location.name, group.location.address].filter(Boolean).join(', ')
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <EnvironmentOutlined /> {t('groupsManagement.openMap')}
                  </a>
                </div>
              ) : (
                <span className="text-gray-400">{t('groupsManagement.noLocation')}</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t('groupsManagement.note')} span={2}>
              {group.note ? (
                <span className="whitespace-pre-line">{group.note}</span>
              ) : (
                <span className="text-gray-400">{t('groupsManagement.noNote')}</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t('groupsManagement.createdAt')}>{formatDate(group.createdAt, true)}</Descriptions.Item>
            {group.drawnAt && (
              <Descriptions.Item label={t('groupsManagement.drawnAt')}>{formatDate(group.drawnAt, true)}</Descriptions.Item>
            )}
            {group.revealedAt && (
              <Descriptions.Item label={t('groupsManagement.revealedAt')}>{formatDate(group.revealedAt, true)}</Descriptions.Item>
            )}
            {group.completedAt && (
              <Descriptions.Item label={t('groupsManagement.completedAt')}>{formatDate(group.completedAt, true)}</Descriptions.Item>
            )}
          </Descriptions>
          <Alert
            className="mt-4"
            type="info"
            showIcon
            icon={<LockOutlined />}
            message={t('groupsManagement.privacyNote')}
            description={t('groupsManagement.aliasHelp')}
          />
        </Card>

        <Card
          className="rounded-2xl shadow-xs"
          title={`${t('groupsManagement.members')} (${group.memberCount})`}
          styles={{ body: { padding: 0 } }}
        >
          <Table rowKey="userId" columns={columns} dataSource={group.members} pagination={false} scroll={{ x: 'max-content' }} />
        </Card>
      </div>
    </div>
  );
}
