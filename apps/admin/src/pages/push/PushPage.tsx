import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, App, Button, Card, Checkbox, Input, Segmented, Spin, Statistic, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  AndroidOutlined,
  AppleOutlined,
  GiftOutlined,
  GlobalOutlined,
  MobileOutlined,
  NotificationOutlined,
  SendOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/PageHeader';
import { usePushAudience, usePushCampaigns, usePushStats, useSendPush } from '@api/push';
import { PUSH_BODY_MAX, PUSH_TITLE_MAX, type PushAudience, type PushCampaign } from '@app-types/push';
import { formatDate } from '@utils/format';
import { getErrorMessage } from '@utils/GetMessage';
import PushPreview from './PushPreview';
import { GroupPicker, UserPicker } from './AudiencePickers';

/**
 * Avisos push del panel: a todos, a los miembros de un grupo o a usuarios elegidos.
 * Admite ?group=<id> o ?user=<id> para llegar con los destinatarios ya elegidos (desde el detalle).
 */
export default function PushPage() {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const [params] = useSearchParams();
  const presetGroup = params.get('group') ?? undefined;
  const presetUser = params.get('user') ?? '';

  const [audience, setAudience] = useState<PushAudience>(presetGroup ? 'group' : presetUser ? 'users' : 'all');
  const [groupId, setGroupId] = useState<string | undefined>(presetGroup);
  const [userIds, setUserIds] = useState<string[]>(presetUser ? [presetUser] : []);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [inApp, setInApp] = useState(false);
  const [page, setPage] = useState(1);

  const stats = usePushStats();
  const preview = usePushAudience(audience, groupId, userIds);
  const campaigns = usePushCampaigns(page, 10);
  const sendMutation = useSendPush();


  const ready = audience === 'all' || (audience === 'group' && !!groupId) || (audience === 'users' && userIds.length > 0);
  const canSend = ready && title.trim().length > 0 && body.trim().length > 0 && !sendMutation.isPending;
  const counts = ready ? preview.data : undefined;
  const nobody = !!counts && counts.reachable === 0;

  const send = () => {
    if (!counts) return;
    modal.confirm({
      title: t('push.confirmTitle'),
      content: (
        <div className="space-y-1">
          <p>{t('push.confirmBody', { users: counts.reachable, devices: counts.devices })}</p>
          {inApp && <p className="text-gray-500">{t('push.confirmInApp', { count: counts.selected })}</p>}
        </div>
      ),
      okText: t('push.send'),
      cancelText: t('global.cancel'),
      onOk: () =>
        sendMutation
          .mutateAsync({
            audience,
            groupId: audience === 'group' ? groupId : undefined,
            userIds: audience === 'users' ? userIds : undefined,
            title: title.trim(),
            body: body.trim(),
            inApp,
          })
          .then((c) => {
            void message.success(t('push.sentOk', { count: c.sent }));
            setTitle('');
            setBody('');
            setPage(1);
          })
          .catch((e) => void message.error(getErrorMessage(e))),
    });
  };

  const columns = useMemo<ColumnsType<PushCampaign>>(
    () => [
      {
        title: t('push.colDate'),
        key: 'date',
        width: 150,
        render: (_: unknown, c: PushCampaign) => <span className="whitespace-nowrap text-sm">{formatDate(c.createdAt, true)}</span>,
      },
      {
        title: t('push.colMessage'),
        key: 'message',
        render: (_: unknown, c: PushCampaign) => (
          <div className="min-w-[220px] max-w-md">
            <p className="font-semibold text-gray-900 dark:text-gray-100 leading-snug">{c.title}</p>
            <p className="text-sm text-gray-500 leading-snug whitespace-pre-line">{c.body}</p>
          </div>
        ),
      },
      {
        title: t('push.colAudience'),
        key: 'audience',
        render: (_: unknown, c: PushCampaign) =>
          c.audience === 'all' ? (
            <Tag icon={<GlobalOutlined />} color="blue">
              {t('push.audience.all')}
            </Tag>
          ) : c.audience === 'group' ? (
            <Tag icon={<GiftOutlined />} color="gold">
              {c.groupId ? <Link to={`/groups/${c.groupId}`}>{c.groupName}</Link> : c.groupName}
            </Tag>
          ) : (
            <Tooltip title={c.users.map((u) => u.name || u.email).join(', ')}>
              <Tag icon={<UserOutlined />}>{t('push.usersCount', { count: c.selected })}</Tag>
            </Tooltip>
          ),
      },
      {
        title: t('push.colReach'),
        key: 'reach',
        render: (_: unknown, c: PushCampaign) => (
          <div className="text-sm whitespace-nowrap">
            <p>
              <strong>{c.sent}</strong> / {c.devices} {t('push.devicesShort')}
            </p>
            <p className="text-gray-500">{t('push.reachOf', { reachable: c.reachable, selected: c.selected })}</p>
          </div>
        ),
      },
      {
        title: t('push.colInApp'),
        key: 'inApp',
        align: 'center' as const,
        render: (_: unknown, c: PushCampaign) => (c.inApp ? <Tag color="green">{t('push.yes')}</Tag> : <span className="text-gray-400">—</span>),
      },
      {
        title: t('push.colSentBy'),
        key: 'sentBy',
        render: (_: unknown, c: PushCampaign) => <span className="text-sm">{c.sentByName ?? '—'}</span>,
      },
    ],
    [t]
  );

  return (
    <div>
      <PageHeader
        breadcrumbItems={[{ title: <Link to="/">{t('menu.dashboard')}</Link> }, { title: t('push.title') }]}
        title={t('push.title')}
        titleIcon={<NotificationOutlined />}
        description={t('push.description')}
        onRefresh={() => {
          void stats.refetch();
          void campaigns.refetch();
        }}
        loading={stats.isFetching || campaigns.isFetching}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="rounded-2xl shadow-xs">
          <Statistic title={t('push.statDevices')} value={stats.data?.devices ?? 0} prefix={<MobileOutlined />} loading={stats.isPending} />
          <p className="text-xs text-gray-500 mt-1">
            <AndroidOutlined /> {stats.data?.android ?? 0} · <AppleOutlined /> {stats.data?.ios ?? 0}
          </p>
        </Card>
        <Card className="rounded-2xl shadow-xs">
          <Statistic title={t('push.statUsers')} value={stats.data?.usersWithDevice ?? 0} prefix={<TeamOutlined />} loading={stats.isPending} />
        </Card>
        <Card className="rounded-2xl shadow-xs">
          <Statistic title={t('push.statReachable')} value={stats.data?.reachable ?? 0} prefix={<NotificationOutlined />} loading={stats.isPending} />
          <p className="text-xs text-gray-500 mt-1">{t('push.statReachableHelp')}</p>
        </Card>
        <Card className="rounded-2xl shadow-xs">
          <Statistic title={t('push.statSent')} value={campaigns.data?.total ?? 0} prefix={<SendOutlined />} loading={campaigns.isPending} />
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 mb-6">
        <Card className="rounded-2xl shadow-xs" title={t('push.newTitle')}>
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold mb-2">{t('push.to')}</p>
              <Segmented<PushAudience>
                block
                value={audience}
                onChange={setAudience}
                options={[
                  { value: 'all', label: t('push.audience.all'), icon: <GlobalOutlined /> },
                  { value: 'group', label: t('push.audience.group'), icon: <GiftOutlined /> },
                  { value: 'users', label: t('push.audience.users'), icon: <UserOutlined /> },
                ]}
              />
            </div>

            {audience === 'group' && <GroupPicker value={groupId} onChange={setGroupId} presetId={presetGroup} />}
            {audience === 'users' && <UserPicker value={userIds} onChange={setUserIds} presetId={presetUser} />}

            <div>
              <label htmlFor="push-title" className="text-sm font-semibold block mb-2">
                {t('push.titleLabel')}
              </label>
              <Input
                id="push-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={PUSH_TITLE_MAX}
                showCount
                placeholder={t('push.titlePlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="push-body" className="text-sm font-semibold block mb-2">
                {t('push.bodyLabel')}
              </label>
              <Input.TextArea
                id="push-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={PUSH_BODY_MAX}
                showCount
                autoSize={{ minRows: 3, maxRows: 6 }}
                placeholder={t('push.bodyPlaceholder')}
              />
            </div>

            <Checkbox checked={inApp} onChange={(e) => setInApp(e.target.checked)}>
              <span className="font-semibold">{t('push.inApp')}</span>
              <span className="block text-xs text-gray-500">{t('push.inAppHelp')}</span>
            </Checkbox>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl shadow-xs" title={t('push.previewTitle')}>
            <PushPreview title={title.trim()} body={body.trim()} />
          </Card>

          <Card className="rounded-2xl shadow-xs" title={t('push.reachTitle')}>
            {!ready ? (
              <p className="text-sm text-gray-500">{audience === 'group' ? t('push.pickGroup') : t('push.pickUsers')}</p>
            ) : preview.isPending ? (
              <div className="flex justify-center py-4">
                <Spin />
              </div>
            ) : counts ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-baseline justify-between">
                  <span className="text-gray-500">{t('push.reachSelected')}</span>
                  <strong className="tabular-nums">{counts.selected}</strong>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-gray-500">{t('push.reachNoDevice')}</span>
                  <span className="tabular-nums">{counts.selected - counts.withDevice}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-gray-500">{t('push.reachOptedOut')}</span>
                  <span className="tabular-nums">{counts.optedOut}</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-gray-100 dark:border-gray-800 pt-2">
                  <span className="font-semibold">{t('push.reachWillReceive')}</span>
                  <strong className="text-lg tabular-nums text-primary dark:text-secondary">
                    {t('push.reachUsersDevices', { users: counts.reachable, devices: counts.devices })}
                  </strong>
                </div>
              </div>
            ) : (
              <p className="text-sm text-danger">{getErrorMessage(preview.error)}</p>
            )}

            {nobody && (
              <Alert
                className="!mt-4"
                type={inApp ? 'info' : 'warning'}
                showIcon
                message={inApp ? t('push.nobodyInApp') : t('push.nobody')}
              />
            )}

            <Button
              type="primary"
              size="large"
              block
              className="!mt-4"
              icon={<SendOutlined />}
              disabled={!canSend || (nobody && !inApp) || !counts}
              loading={sendMutation.isPending}
              onClick={send}
            >
              {t('push.send')}
            </Button>
          </Card>
        </div>
      </div>

      <Card className="rounded-2xl shadow-xs" title={t('push.historyTitle')}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={campaigns.data?.results ?? []}
          loading={campaigns.isPending}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: t('push.historyEmpty') }}
          pagination={{
            current: page,
            pageSize: 10,
            total: campaigns.data?.total ?? 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>
    </div>
  );
}
