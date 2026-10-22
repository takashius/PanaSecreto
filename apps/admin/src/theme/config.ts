import { ThemeConfig, theme as antdTheme } from 'antd';
import { colors } from '@panasecreto/ui-tokens';

export function getThemeConfig(
  isDark: boolean,
  customColors?: { primary?: string; secondary?: string; accent?: string }
): ThemeConfig {
  const primary = customColors?.primary || colors.primary;
  const secondary = customColors?.secondary || colors.secondary;
  const accent = customColors?.accent || colors.accent;

  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: isDark ? (customColors?.secondary || '#FFC107') : primary,
      colorInfo: accent,
      colorSuccess: colors.success,
      colorWarning: secondary,
      colorError: colors.danger,
      borderRadius: 10,
      fontFamily: 'Nunito, system-ui, sans-serif',
      colorBgLayout: isDark ? '#06152B' : colors.background,
      colorBgContainer: isDark ? '#0C2242' : '#FFFFFF',
      colorText: isDark ? '#F8F7F2' : '#13213A',
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
        headerBg: isDark ? '#16325A' : '#FAFAFA',
      },
      Card: {
        borderRadiusLG: 14,
      },
      Switch: {
        colorPrimary: isDark ? '#1A4580' : primary,
      },
    },
  };
}
