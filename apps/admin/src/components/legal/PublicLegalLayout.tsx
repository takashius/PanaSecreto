import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppLogo from '@components/AppLogo';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm transition-colors ${
    isActive
      ? 'font-semibold text-amber-600 dark:text-amber-400'
      : 'text-gray-600 hover:text-amber-700 dark:text-gray-300 dark:hover:text-amber-400'
  }`;

const PublicLegalLayout = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 dark:bg-gray-900">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-700 dark:bg-gray-800/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/login" className="flex items-center gap-3">
            <AppLogo variant="light" className="h-10 w-auto" />
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
            <NavLink to="/terminos" className={navLinkClass}>
              {t('legal.terms')}
            </NavLink>
            <NavLink to="/privacidad" className={navLinkClass}>
              {t('legal.privacy')}
            </NavLink>
            <NavLink to="/baja-servicio" className={navLinkClass}>
              {t('legal.cancellation')}
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>
            © {new Date().getFullYear()} EntrePanas. {t('legal.copyright')}
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link to="/login" className="hover:text-amber-700 dark:hover:text-amber-400">
              {t('legal.backToLogin')}
            </Link>
            <Link to="/terminos" className="hover:text-amber-700 dark:hover:text-amber-400">
              {t('legal.terms')}
            </Link>
            <Link to="/baja-servicio" className="hover:text-amber-700 dark:hover:text-amber-400">
              {t('legal.cancellation')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLegalLayout;
