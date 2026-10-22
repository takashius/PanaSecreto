import isotipo from '../../../../assets/iconos/isotipo-app.png';
import { useConfigContext } from '../context/useConfigContext';

interface AppLogoProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export default function AppLogo({ className, variant = 'dark' }: AppLogoProps) {
  const { config } = useConfigContext();
  // Sin logo personalizado se usa el isotipo oficial (assets/iconos en la raíz del monorepo)
  const isDarkBg = variant === 'dark';

  return (
    <div className={`flex items-center gap-2.5 ${className || ''}`}>
      {config.logoUrl ? (
        <img
          src={config.logoUrl}
          alt={config.appName}
          className="h-9 w-auto max-w-[130px] object-contain rounded-md"
        />
      ) : (
        <img src={isotipo} alt={config.appName} className="w-9 h-9 shrink-0 object-contain" />
      )}
      <div className="flex flex-col min-w-0">
        <span
          className={`font-heading text-lg font-bold tracking-tight truncate leading-tight ${
            isDarkBg ? 'text-white' : ''
          }`}
          style={!isDarkBg ? { color: config.primaryColor } : undefined}
        >
          {config.appName}
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
