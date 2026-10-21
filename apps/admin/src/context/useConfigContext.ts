import { useContext } from 'react';
import { ConfigContext, type ConfigContextType } from './contexts';

export const useConfigContext = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfigContext debe usarse dentro de un ConfigProvider');
  }
  return context;
};
