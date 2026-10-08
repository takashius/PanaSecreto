import { Avatar, Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@context/useAuth';

export default function UserMenu() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const items = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div className="py-1">
          <p className="font-semibold text-gray-800 dark:text-gray-200">{user?.name} {user?.lastName || ''}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
      ),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined className="text-red-500" />,
      label: <span className="text-red-600">{t('menu.logout')}</span>,
      onClick: logout,
    },
  ];

  return (
    <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
      <button className="flex items-center gap-2 cursor-pointer focus:outline-none">
        <Avatar
          src={user?.photo}
          icon={!user?.photo && <UserOutlined />}
          className="bg-primary text-white"
        />
        <div className="hidden text-left md:block">
          <p className="text-xs font-semibold leading-tight text-gray-800 dark:text-gray-200">
            {user?.name}
          </p>
          <p className="text-[10px] text-gray-500 uppercase">{String(user?.role || '')}</p>
        </div>
      </button>
    </Dropdown>
  );
}
