import { Sparkles } from 'lucide-react';
import { colors } from '@panasecreto/ui-tokens';

interface AppLogoProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export default function AppLogo({ className, variant = 'dark' }: AppLogoProps) {
  const isDarkBg = variant === 'dark';

  return (
    <div className={`flex items-center gap-2.5 ${className || ''}`}>
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs shrink-0 border"
        style={{
          backgroundColor: isDarkBg ? 'rgba(255, 255, 255, 0.12)' : colors.primary,
          borderColor: isDarkBg ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
        }}
      >
        <Sparkles className="w-5 h-5 text-secondary" style={{ color: colors.secondary }} />
      </div>
      <div className="flex flex-col min-w-0">
        <span
          className={`font-heading text-lg font-bold tracking-tight truncate leading-tight ${
            isDarkBg ? 'text-white' : 'text-primary'
          }`}
        >
          Pana<span style={{ color: colors.secondary }}>Secreto</span>
        </span>
        <span
          className={`text-[9px] font-semibold tracking-wider uppercase ${
            isDarkBg ? 'text-white/60' : 'text-gray-500'
          }`}
        >
          PANEL DE CONTROL
        </span>
      </div>
    </div>
  );
}
