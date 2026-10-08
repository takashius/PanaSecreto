import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Modal, Input, message, Spin, Switch } from 'antd';
import { ArrowLeftOutlined, KeyOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useUser, useSetUserPassword, useSetUserForcePasswordChange } from '@api/users';
import PageHeader from '@components/PageHeader';
import { getErrorMessage } from '@utils/GetMessage';

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const { data: user, isPending, refetch } = useUser(id || '');

  const [passwordModal, setPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const setPasswordMutation = useSetUserPassword();
  const forcePasswordMutation = useSetUserForcePasswordChange();

  const handleSavePassword = () => {
    if (!id || newPassword.length < 6) {
      void messageApi.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setPasswordMutation.mutate(
      { id, password: newPassword },
      {
        onSuccess: () => {
          void messageApi.success('Contraseña restablecida con éxito.');
          setPasswordModal(false);
          setNewPassword('');
        },
        onError: (e) => void messageApi.error(getErrorMessage(e)),
      }
    );
  };

  if (isPending) {
    return (
      <div className="flex justify-center p-12">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-4">Usuario no encontrado</p>
        <Link to="/users-management">
          <Button icon={<ArrowLeftOutlined />}>Volver al Listado</Button>
        </Link>
      </div>
    );
  }

  const roleText = Array.isArray(user.role) ? user.role.join(', ') : user.role;

  return (
    <div>
      {contextHolder}
      <div className="mb-4">
        <Link to="/users-management" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary">
          <ArrowLeftOutlined /> Volver a usuarios
        </Link>
      </div>

      <PageHeader
        title={`${user.name} ${user.lastName || ''}`}
        description={`Detalle del perfil y opciones de cuenta (${user.email})`}
        onRefresh={() => void refetch()}
        extra={
          <Button
            icon={<KeyOutlined />}
            onClick={() => setPasswordModal(true)}
          >
            {t('usersManagement.resetPassword')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border border-gray-200/80 shadow-xs md:col-span-2">
          <Descriptions title="Información General" bordered column={1}>
            <Descriptions.Item label="ID de Usuario">
              <span className="font-mono text-xs">{user._id}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Nombre Completo">
              {user.name} {user.lastName || ''}
            </Descriptions.Item>
            <Descriptions.Item label="Correo Electrónico">
              {user.email}
            </Descriptions.Item>
            <Descriptions.Item label="Teléfono">
              {user.phone || 'No registrado'}
            </Descriptions.Item>
            <Descriptions.Item label="Rol">
              <Tag color="purple">{roleText}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Estado de Cuenta">
              {user.active ? (
                <Tag color="green">Activo</Tag>
              ) : (
                <Tag color="red">Inactivo</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Fecha de Registro">
              {user.date ? new Date(user.date).toLocaleString('es-ES') : 'N/A'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card className="rounded-2xl border border-gray-200/80 shadow-xs h-fit" title="Seguridad de Acceso">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">Forzar cambio de clave</p>
                <p className="text-xs text-gray-500">Exigir nueva contraseña en el próximo login</p>
              </div>
              <Switch
                checked={Boolean(user.forcePasswordChangeOnNextLogin)}
                onChange={(checked) => {
                  forcePasswordMutation.mutate(
                    { id: user._id, forcePasswordChangeOnNextLogin: checked },
                    {
                      onSuccess: () => void messageApi.success('Preferencia actualizada.'),
                      onError: (e) => void messageApi.error(getErrorMessage(e)),
                    }
                  );
                }}
              />
            </div>
          </div>
        </Card>
      </div>

      <Modal
        open={passwordModal}
        title="Restablecer Contraseña del Usuario"
        okText="Actualizar Contraseña"
        cancelText={t('global.cancel')}
        onCancel={() => setPasswordModal(false)}
        onOk={handleSavePassword}
        confirmLoading={setPasswordMutation.isPending}
      >
        <div className="mt-4">
          <p className="text-xs text-gray-500 mb-2">
            Ingresa la nueva contraseña temporal para <strong>{user.email}</strong>:
          </p>
          <Input.Password
            placeholder="Nueva contraseña (mínimo 6 caracteres)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
