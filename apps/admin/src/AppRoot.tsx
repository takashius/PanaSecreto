import { App, ConfigProvider as AntdConfigProvider } from 'antd';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useTheme } from './context/useTheme';
import { useConfigContext } from './context/ConfigContext';
import { getThemeConfig } from './theme/config';
import { protectedRoutes } from './routes';

const router = createBrowserRouter(protectedRoutes);

export default function AppRoot() {
  const { isDarkMode } = useTheme();
  const { config } = useConfigContext();

  return (
    <AntdConfigProvider
      theme={getThemeConfig(isDarkMode, {
        primary: config.primaryColor,
        secondary: config.secondaryColor,
        accent: config.accentColor,
      })}
    >
      <App>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </App>
    </AntdConfigProvider>
  );
}
