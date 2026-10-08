import { ThemeConfig, theme as antdTheme } from 'antd';
import { colors } from '@panasecreto/ui-tokens';

export function getThemeConfig(isDark: boolean): ThemeConfig {
  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: colors.primary,
      colorInfo: colors.accent,
      colorSuccess: colors.success,
      colorWarning: colors.secondary,
      colorError: colors.danger,
      borderRadius: 10,
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    components: {
      Button: {
        controlHeight: 38,
        borderRadius: 10,
        fontWeight: 600,
      },
      Table: {
        borderRadius: 12,
        headerBg: isDark ? '#1F1E29' : '#F9FAFB',
      },
      Card: {
        borderRadiusLG: 16,
      },
    },
  };
}
