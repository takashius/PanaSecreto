import { ThemeConfig, theme as antdTheme } from 'antd';
import { colors } from '@panasecreto/ui-tokens';

export function getThemeConfig(isDark: boolean): ThemeConfig {
  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: isDark ? '#F7A800' : colors.primary,
      colorInfo: colors.accent,
      colorSuccess: colors.success,
      colorWarning: colors.secondary,
      colorError: colors.danger,
      borderRadius: 10,
      fontFamily: 'Inter, system-ui, sans-serif',
      colorBgLayout: isDark ? '#12111A' : '#F5F5F5',
      colorBgContainer: isDark ? '#1E1D2A' : '#FFFFFF',
      colorText: isDark ? '#F8F9FA' : '#1C1B24',
      colorTextSecondary: isDark ? '#9CA3AF' : '#6B7280',
    },
    components: {
      Button: {
        controlHeight: 38,
        borderRadius: 8,
        fontWeight: 600,
      },
      Table: {
        borderRadius: 10,
        headerBg: isDark ? '#262436' : '#FAFAFA',
      },
      Card: {
        borderRadiusLG: 14,
      },
      Switch: {
        colorPrimary: colors.primary,
      },
    },
  };
}
