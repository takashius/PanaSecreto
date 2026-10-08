import React, { createElement, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMenuItemsForRole } from './menuItems';
import { useAuth } from '@context/useAuth';
import AppLogo from './AppLogo';

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuth();
  const menuItems = getMenuItemsForRole(user?.role);

  return (
    <aside
      className={`fixed left-0 top-0 z-30 h-screen transition-all duration-300 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center px-4 border-b border-gray-200 dark:border-gray-800">
        {collapsed ? (
          <div className="mx-auto">
            <AppLogo className="[&>div:last-child]:hidden" />
          </div>
        ) : (
          <AppLogo />
        )}
      </div>

      {/* Nav Menu */}
      <nav className="p-3 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive =
            item.match === 'startsWith'
              ? location.pathname.startsWith(item.path)
              : location.pathname === item.path;

          return (
            <Link
              key={item.key}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? t(item.labelKey) : undefined}
            >
              {item.icon && (
                <span className="text-base flex items-center justify-center">
                  {createElement(item.icon)}
                </span>
              )}
              {!collapsed && <span>{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
