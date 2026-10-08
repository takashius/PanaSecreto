import { useTranslation } from 'react-i18next';
import { Card, Button, Tag } from 'antd';
import { UserOutlined, ArrowRightOutlined, SafetyCertificateOutlined, CloudServerOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '@context/useAuth';
import PageHeader from '@components/PageHeader';
import { colors } from '@panasecreto/ui-tokens';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        breadcrumbItems={[{ title: t('menu.dashboard') }]}
        title={t('menu.dashboard')}
        description={`Bienvenido de nuevo, ${user?.name || 'Administrador'}. Panel central de administración.`}
      />

      {/* Hero Welcome Card */}
      <div
        className="rounded-2xl p-6 md:p-8 text-white mb-8 shadow-md relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, #301B5E 100%)`,
        }}
      >
        <div className="relative z-10 max-w-2xl">
          <Tag color="#F7A800" className="text-black font-bold uppercase tracking-wider mb-3">
            PanaSecreto Monorepo v2.0
          </Tag>
          <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-white mb-2">
            Base de Usuarios y Autenticación Activa
          </h2>
          <p className="text-gray-200 text-sm md:text-base mb-6 leading-relaxed">
            Estructura arquitectónica replicada exitosamente desde UniSan. Módulos de autenticación por tokens JWT, control de roles granular y panel web con Ant Design y Tailwind CSS.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/users-management">
              <Button
                type="primary"
                size="large"
                icon={<UserOutlined />}
                style={{ backgroundColor: colors.secondary, color: colors.primary, fontWeight: 700 }}
              >
                Gestionar Usuarios
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold text-gray-400">Sesión Actual</p>
              <h3 className="text-xl font-bold font-heading mt-1 text-gray-800 dark:text-gray-100">
                {user?.name} {user?.lastName || ''}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-primary dark:bg-purple-900/30">
              <UserOutlined className="text-xl" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold text-gray-400">Rol Activo</p>
              <h3 className="text-xl font-bold font-heading mt-1 text-gray-800 dark:text-gray-100">
                {String(user?.role || 'ADMIN')}
              </h3>
              <Tag color="purple" className="mt-1">Acceso Web Permitido</Tag>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-secondary dark:bg-amber-900/30">
              <SafetyCertificateOutlined className="text-xl text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold text-gray-400">Infraestructura</p>
              <h3 className="text-xl font-bold font-heading mt-1 text-gray-800 dark:text-gray-100">
                Docker & Coolify
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Despliegue independiente
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-accent dark:bg-sky-900/30">
              <CloudServerOutlined className="text-xl text-sky-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Action Links */}
      <Card className="rounded-2xl shadow-xs">
        <h3 className="text-lg font-heading font-bold mb-4 text-gray-800 dark:text-gray-200">
          Módulos Base Configurados
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/users-management"
            className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary/40 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all group"
          >
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Módulo de Usuarios</h4>
              <p className="text-xs text-gray-500 mt-0.5">Listado paginado, búsqueda, creación y asignación de roles.</p>
            </div>
            <ArrowRightOutlined className="text-gray-400 group-hover:text-primary transition-colors" />
          </Link>

          <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
            <div>
              <h4 className="font-semibold text-gray-500">Módulos de Negocio</h4>
              <p className="text-xs text-gray-400 mt-0.5">Listos para ser desarrollados (Grupos, Sorteo, Regalos, Chat).</p>
            </div>
            <Tag color="default">Pendiente</Tag>
          </div>
        </div>
      </Card>
    </div>
  );
}
