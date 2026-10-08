import { Layout as AntLayout } from 'antd';
import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useTheme } from '@context/useTheme';

const { Content } = AntLayout;

export default function Layout() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const handleToggleCollapse = () => {
    setSidebarCollapsed((prev: boolean) => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', JSON.stringify(next));
      window.dispatchEvent(new Event('sidebarCollapseChange'));
      return next;
    });
  };

  useEffect(() => {
    const handleCollapseChange = () => {
      const saved = localStorage.getItem('sidebarCollapsed');
      setSidebarCollapsed(saved ? JSON.parse(saved) : false);
    };
    window.addEventListener('sidebarCollapseChange', handleCollapseChange);
    return () => window.removeEventListener('sidebarCollapseChange', handleCollapseChange);
  }, []);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <AntLayout className="min-h-screen">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
        <AntLayout>
          <Header
            darkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            sidebarCollapsed={sidebarCollapsed}
            onToggleCollapse={handleToggleCollapse}
          />
          <Content
            className={`px-4 pb-6 pt-20 transition-all duration-300 sm:px-6 lg:px-8 ${
              sidebarCollapsed ? 'sm:ml-20' : 'sm:ml-64'
            }`}
          >
            <Outlet />
          </Content>
        </AntLayout>
      </AntLayout>
    </div>
  );
}
