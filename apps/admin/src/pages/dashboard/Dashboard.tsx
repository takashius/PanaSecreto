import { Alert, Button, Card, Empty, Skeleton } from 'antd';
import { GiftOutlined, HeartOutlined, TeamOutlined, UserOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@context/useAuth';
import PageHeader from '@components/PageHeader';
import StatTile from '@components/dashboard/StatTile';
import BarList from '@components/dashboard/BarList';
import ActivityChart from '@components/dashboard/ActivityChart';
import GroupStatusTag from '@components/groups/GroupStatusTag';
import { useDashboardStats } from '@api/stats';
import { GROUP_STATUSES } from '@app-types/groups';
import { ALL_ROLES, isAdminRole } from '../../constants/roles';
import { formatDate, formatNumber } from '@utils/format';

function daysUntil(date: string): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - start.getTime()) / 864e5);
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canSeeStats = isAdminRole(user?.role);
  const { data, isPending, isError, isFetching, refetch } = useDashboardStats();

  const header = (
    <PageHeader
      breadcrumbItems={[{ title: t('menu.dashboard') }]}
      title={t('menu.dashboard')}
      description={t('dashboard.welcome', { name: user?.name || '' })}
      onRefresh={canSeeStats ? () => void refetch() : undefined}
      loading={isFetching}
    />
  );

  // Los organizadores entran al panel pero las métricas globales son solo para administradores
  if (!canSeeStats) {
    return (
      <div>
        {header}
        <Card className="rounded-2xl shadow-xs">
          <Empty description={t('dashboard.subtitle')} />
        </Card>
      </div>
    );
  }

  if (isPending) {
    return (
      <div>
        {header}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="rounded-2xl">
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div>
        {header}
        <Alert
          type="error"
          showIcon
          message={t('dashboard.loadError')}
          action={<Button size="small" onClick={() => void refetch()}>{t('error.retry')}</Button>}
        />
      </div>
    );
  }

  const signups = data.activityByDay.map((d) => ({ date: d.date, value: d.signups }));
  const signupsTotal = signups.reduce((s, p) => s + p.value, 0);

  return (
    <div>
      {header}

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatTile
          label={t('dashboard.users')}
          value={formatNumber(data.users.total)}
          hint={t('dashboard.activeUsers', { count: data.users.active })}
          delta={data.users.newLast30d ? t('dashboard.newLast30d', { count: data.users.newLast30d }) : undefined}
          icon={<UserOutlined />}
          iconClassName="bg-purple-50 text-primary dark:bg-purple-900/30 dark:text-purple-200"
        />
        <StatTile
          label={t('dashboard.groups')}
          value={formatNumber(data.groups.total)}
          delta={data.groups.newLast30d ? t('dashboard.newLast30d', { count: data.groups.newLast30d }) : undefined}
          icon={<GiftOutlined />}
          iconClassName="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
        />
        <StatTile
          label={t('dashboard.participants')}
          value={formatNumber(data.groups.totalMembers)}
          hint={t('dashboard.avgMembers', { avg: data.groups.avgMembers })}
          icon={<TeamOutlined />}
          iconClassName="bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
        />
        <StatTile
          label={t('dashboard.wishes')}
          value={formatNumber(data.wishes.total)}
          icon={<HeartOutlined />}
          iconClassName="bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <Card
          className="rounded-2xl shadow-xs xl:col-span-2"
          title={t('dashboard.activity')}
          extra={<span className="text-xs text-gray-500 hidden sm:inline">{t('dashboard.activityTotal', { count: signupsTotal })}</span>}
        >
          <ActivityChart points={signups} unitLabel={t('dashboard.signups')} />
        </Card>

        <Card
          className="rounded-2xl shadow-xs"
          title={t('dashboard.groupsByStatus')}
          extra={
            <Link to="/groups" className="text-xs">
              {t('dashboard.viewAll')}
            </Link>
          }
        >
          <BarList
            ariaLabel={t('dashboard.groupsByStatus')}
            items={GROUP_STATUSES.map((s) => ({
              key: s,
              label: <GroupStatusTag status={s} />,
              value: data.groups.byStatus[s] ?? 0,
            }))}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="rounded-2xl shadow-xs xl:col-span-2" title={t('dashboard.upcoming')} styles={{ body: { padding: 0 } }}>
          {data.upcomingExchanges.length === 0 ? (
            <div className="p-6">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('dashboard.noUpcoming')} />
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.upcomingExchanges.map((g) => {
                const days = daysUntil(g.exchangeDate);
                const when =
                  days <= 0 ? t('dashboard.today') : days === 1 ? t('dashboard.tomorrow') : t('dashboard.inDays', { count: days });
                return (
                  <li key={g.id}>
                    <Link
                      to={`/groups/${g.id}`}
                      className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                    >
                      <span className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-lg shrink-0">
                        {g.emoji || '🎁'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{g.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(g.exchangeDate)} · {when} · {t('dashboard.membersCount', { count: g.memberCount })}
                        </p>
                        <div className="sm:hidden mt-1">
                          <GroupStatusTag status={g.status} />
                        </div>
                      </div>
                      <span className="hidden sm:inline-flex">
                        <GroupStatusTag status={g.status} />
                      </span>
                      <ArrowRightOutlined className="text-gray-400 group-hover:text-primary transition-colors hidden sm:block" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card
          className="rounded-2xl shadow-xs"
          title={t('dashboard.usersByRole')}
          extra={
            <Link to="/users-management" className="text-xs">
              {t('dashboard.viewAll')}
            </Link>
          }
        >
          <BarList
            ariaLabel={t('dashboard.usersByRole')}
            items={ALL_ROLES.map((r) => ({ key: r, label: t(`roles.${r}`), value: data.users.byRole[r] ?? 0 }))}
          />
        </Card>
      </div>
    </div>
  );
}
