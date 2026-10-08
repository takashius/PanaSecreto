import { useTranslation } from 'react-i18next';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '@context/useAuth';
import { useLogout } from '@api/auth';

export const useUserMenuItems = (): MenuProps['items'] => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        logout();
        void navigate('/login');
      },
    });
  };

  return [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div className="py-1">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {user?.name} {user?.lastName || ''}
          </p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <span>{t('menu.profile', 'Mi Perfil')}</span>,
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined className="text-red-500" />,
      label: <span className="text-red-600 font-medium">{t('menu.logout')}</span>,
      onClick: handleLogout,
    },
  ];
};

export default useUserMenuItems;
