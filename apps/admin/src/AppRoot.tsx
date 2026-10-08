import { App, ConfigProvider } from 'antd';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@context/AuthContext';
import { useTheme } from '@context/useTheme';
import { getThemeConfig } from './theme/config';
import { protectedRoutes } from './routes';

const router = createBrowserRouter(protectedRoutes);

export default function AppRoot() {
  const { theme } = useTheme();

  return (
    <ConfigProvider theme={getThemeConfig(theme === 'dark')}>
      <App>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </App>
    </ConfigProvider>
  );
}
