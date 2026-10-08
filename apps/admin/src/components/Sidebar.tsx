import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { getMenuItemsForRole, type MenuItem } from './menuItems';
import { useAuth } from '@context/useAuth';
import { useTheme } from '@context/useTheme';
import { useConfigContext } from '@context/ConfigContext';
import AppLogo from './AppLogo';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { t } = useTranslation();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const { config } = useConfigContext();
  const menuItems = getMenuItemsForRole(user?.role);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = useCallback(
    (item: MenuItem): boolean => {
      if (item.match === 'startsWith') {
        return location.pathname.startsWith(item.path);
      }
      return location.pathname === item.path;
    },
    [location.pathname]
  );

  const sidebarBg = isDarkMode ? '#140C26' : config.primaryColor;
  const sidebarBorder = isDarkMode ? '#262436' : 'rgba(255, 255, 255, 0.1)';

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        type="button"
        className="fixed left-4 top-3.5 z-40 rounded-xl p-2 text-white shadow-md sm:hidden"
        style={{ backgroundColor: sidebarBg }}
        onClick={() => setIsMobileOpen((prev) => !prev)}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
      </button>

      {/* Sidebar Aside */}
      <aside
        ref={sidebarRef}
        style={{
          backgroundColor: sidebarBg,
          borderColor: sidebarBorder,
        }}
        className={`fixed inset-y-0 left-0 z-30 flex flex-col text-white transition-all duration-300 shadow-xl border-r ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } sm:translate-x-0 ${collapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Brand Logo & Collapse Header */}
        <div
          className="flex h-16 items-center justify-between border-b px-4 transition-colors duration-300"
          style={{ borderColor: sidebarBorder }}
        >
          <Link
            to="/"
            onClick={() => setIsMobileOpen(false)}
            className={`flex min-w-0 flex-1 items-center gap-2 ${collapsed ? 'justify-center' : ''}`}
          >
            <AppLogo
              variant="dark"
              className={collapsed ? '[&>div:last-child]:hidden' : ''}
            />
          </Link>
          <button
            type="button"
            className="hidden rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white sm:inline-flex transition-colors"
            onClick={onToggleCollapse}
            aria-label="Colapsar menú lateral"
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {menuItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'text-white font-semibold shadow-xs border-l-4'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                style={
                  active
                    ? {
                        borderLeftColor: config.secondaryColor,
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
                      }
                    : undefined
                }
                title={collapsed ? t(item.labelKey) : undefined}
              >
                {Icon && (
                  <span className="text-lg flex items-center justify-center shrink-0">
                    <Icon />
                  </span>
                )}
                {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
