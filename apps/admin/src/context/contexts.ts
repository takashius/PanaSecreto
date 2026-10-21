import { createContext } from 'react';
import type { AuthContextType } from '@app-types/auth';
import type { SystemConfigData } from '../types/config';

/**
 * Objetos de contexto y valores por defecto.
 * Viven separados de los Provider (.tsx) para que Vite Fast Refresh funcione:
 * un archivo de componentes solo debe exportar componentes.
 */

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  toggleDarkMode: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const DEFAULT_SYSTEM_CONFIG: SystemConfigData = {
  appName: 'EntrePanas',
  primaryColor: '#1E1338',
  secondaryColor: '#F7A800',
  accentColor: '#1D84B5',
  logoUrl: '',
  faviconUrl: '',
};

export interface ConfigContextType {
  config: SystemConfigData;
  isLoading: boolean;
  refetch: () => void;
}

export const ConfigContext = createContext<ConfigContextType | undefined>(undefined);
