import { useEffect, useMemo, ReactNode } from 'react';
import { ConfigContext, DEFAULT_SYSTEM_CONFIG } from './contexts';
import { useSystemConfig } from '../api/config';
import type { SystemConfigData } from '../types/config';

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const { data, isLoading, refetch } = useSystemConfig();

  const config: SystemConfigData = useMemo(() => {
    return {
      appName: data?.appName || DEFAULT_SYSTEM_CONFIG.appName,
      primaryColor: data?.primaryColor || DEFAULT_SYSTEM_CONFIG.primaryColor,
      secondaryColor: data?.secondaryColor || DEFAULT_SYSTEM_CONFIG.secondaryColor,
      accentColor: data?.accentColor || DEFAULT_SYSTEM_CONFIG.accentColor,
      logoUrl: data?.logoUrl || '',
      faviconUrl: data?.faviconUrl || '',
    };
  }, [data]);

  // Actualizar favicon dinámicamente si existe en la configuración
  useEffect(() => {
    if (config.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.head.appendChild(link);
      }
      link.href = config.faviconUrl;
    }
  }, [config.faviconUrl]);

  // Actualizar título del documento
  useEffect(() => {
    if (config.appName) {
      document.title = `${config.appName} | Panel de Control`;
    }
  }, [config.appName]);

  return (
    <ConfigContext.Provider value={{ config, isLoading, refetch }}>
      {children}
    </ConfigContext.Provider>
  );
};
