import { Form, Input, Button, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useChangePasswordRequired } from '@api/auth';
import { useAuth } from '@context/useAuth';
import { getErrorMessage } from '@utils/GetMessage';
import AppLogo from '@components/AppLogo';
import AuthFooter from '@components/AuthFooter';

export default function ForcePasswordChange() {
  const navigate = useNavigate();
  const { user, login, token } = useAuth();
  const changeMutation = useChangePasswordRequired();
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = (values: { password: string; confirm: string }) => {
    if (values.password !== values.confirm) {
      void messageApi.error('Las contraseñas no coinciden.');
      return;
    }

    changeMutation.mutate(values.password, {
      onSuccess() {
        void messageApi.success('Contraseña actualizada con éxito.');
        if (user && token) {
          login({
            ...user,
            token,
            forcePasswordChangeOnNextLogin: false,
          });
        }
        setTimeout(() => {
          void navigate('/');
        }, 1000);
      },
      onError(error) {
        void messageApi.error(getErrorMessage(error) || 'Error al actualizar contraseña.');
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      {contextHolder}
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-gray-100 dark:border-gray-800 dark:bg-gray-800">
        <div className="mb-6 flex justify-center">
          <AppLogo className="h-16 w-auto" variant="light" />
        </div>
        <h2 className="mb-2 text-center text-2xl font-bold font-heading text-gray-800 dark:text-gray-100">
          Cambio Obligatorio de Contraseña
        </h2>
        <p className="mb-6 text-center text-sm text-gray-500">
          Por motivos de seguridad, debes actualizar tu contraseña temporal antes de continuar al panel.
        </p>

        <Form name="force_password" onFinish={onFinish} layout="vertical">
          <Form.Item
            name="password"
            label="Nueva Contraseña"
            rules={[
              { required: true, message: 'Ingresa tu nueva contraseña' },
              { min: 6, message: 'Mínimo 6 caracteres' },
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Nueva contraseña segura"
            />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="Confirmar Contraseña"
            rules={[{ required: true, message: 'Confirma tu nueva contraseña' }]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Confirmar contraseña"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="w-full font-semibold shadow-md"
              loading={changeMutation.isPending}
            >
              Guardar Contraseña y Continuar
            </Button>
          </Form.Item>
        </Form>
        <AuthFooter />
      </div>
    </div>
  );
}
