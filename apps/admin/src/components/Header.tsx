import { Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Moon, Sun } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import UserMenu from './UserMenu';
import { useTheme } from '@context/useTheme';

interface HeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Header({ collapsed, onToggleCollapse }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/95 px-4 sm:px-6 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95">
      <div className="flex items-center gap-3">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleCollapse}
          className="text-gray-600 dark:text-gray-300"
        />
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          API Online: <span className="font-mono text-gray-700 dark:text-gray-300">port 4000</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="text"
          icon={theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
          onClick={toggleTheme}
          title="Cambiar tema"
        />
        <LanguageSwitcher />
        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700"></div>
        <UserMenu />
      </div>
    </header>
  );
}
