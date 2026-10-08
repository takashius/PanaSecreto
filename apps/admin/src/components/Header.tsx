import { Layout, Avatar, Dropdown, Switch } from 'antd';
import { UserOutlined, MoonOutlined, SunFilled, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useUserMenuItems } from './UserMenu';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '@context/useAuth';
import { useConfigContext } from '@context/ConfigContext';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  sidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Header({
  darkMode,
  toggleDarkMode,
  sidebarCollapsed = false,
  onToggleCollapse,
}: HeaderProps) {
  const { user } = useAuth();
  const { config } = useConfigContext();
  const userMenuItems = useUserMenuItems();

  return (
    <AntHeader
      style={{ backgroundColor: darkMode ? '#140C26' : config.primaryColor }}
      className={`fixed left-0 right-0 top-0 z-20 flex h-16 items-center justify-between px-4 sm:px-6 shadow-md transition-all duration-300 ${
        sidebarCollapsed ? 'sm:ml-20' : 'sm:ml-64'
      }`}
    >
      {/* Left side: Collapse button & API status */}
      <div className="flex items-center gap-3">
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="rounded-lg p-2 text-white/90 hover:bg-white/10 hover:text-white transition-colors focus:outline-none"
            title={sidebarCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
          >
            {sidebarCollapsed ? <MenuUnfoldOutlined className="text-lg" /> : <MenuFoldOutlined className="text-lg" />}
          </button>
        )}

        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs border border-white/15">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>API Online:</span>
          <span className="font-mono" style={{ color: config.secondaryColor }}>
            port 4000
          </span>
        </div>
      </div>

      {/* Right side: Language, Theme Switcher, User Menu */}
      <div className="flex items-center gap-3 sm:gap-4">
        <LanguageSwitcher />

        <Switch
          checked={darkMode}
          onChange={toggleDarkMode}
          checkedChildren={<SunFilled className="text-amber-300" />}
          unCheckedChildren={<MoonOutlined className="text-gray-200" />}
          style={{ transform: 'scale(1.15)' }}
        />

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <button
            type="button"
            className="flex items-center gap-2.5 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none"
          >
            <Avatar
              icon={!user?.photo && <UserOutlined />}
              src={user?.photo || undefined}
              className="font-bold border-2 border-white/30 shrink-0 cursor-pointer text-purple-950"
              style={{ backgroundColor: config.secondaryColor }}
            />
            <span className="hidden md:inline-block text-sm font-semibold text-white leading-none">
              {user?.name} {user?.lastName || ''}
            </span>
          </button>
        </Dropdown>
      </div>
    </AntHeader>
  );
}
