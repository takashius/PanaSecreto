import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Input, Button, message } from 'antd';
import { NumberOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useRecoveryTwo } from '@api/auth';
import { getErrorMessage } from '@utils/GetMessage';
import AppLogo from '@components/AppLogo';
import AuthFooter from '@components/AuthFooter';

export default function RecoveryStep2() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const recoveryMutation = useRecoveryTwo();
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = (values: { code: string; newPass: string; confirmPass: string }) => {
    if (values.newPass !== values.confirmPass) {
      void messageApi.error('Las contraseñas no coinciden.');
      return;
    }

    recoveryMutation.mutate(
      {
        email: emailParam,
        code: parseInt(values.code, 10),
        newPass: values.newPass,
      },
      {
        onSuccess() {
          void messageApi.success('Contraseña actualizada con éxito. Ya puedes iniciar sesión.');
          setTimeout(() => {
            void navigate('/login');
          }, 1500);
        },
        onError(error) {
          void messageApi.error(getErrorMessage(error) || 'Código incorrecto o expirado.');
        },
      }
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      {contextHolder}
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-gray-100 dark:border-gray-800 dark:bg-gray-800">
        <div className="mb-6 flex justify-center">
          <AppLogo className="h-16 w-auto" />
        </div>
        <h2 className="mb-2 text-center text-2xl font-bold font-heading text-gray-800 dark:text-gray-100">
          {t('recovery.step2Title')}
        </h2>
        <p className="mb-6 text-center text-xs text-gray-500">
          Para: <span className="font-semibold text-gray-700 dark:text-gray-300">{emailParam}</span>
        </p>

        <Form name="recover_step2" onFinish={onFinish} layout="vertical">
          <Form.Item
            name="code"
            rules={[{ required: true, message: 'Ingresa el código numérico' }]}
          >
            <Input
              size="large"
              prefix={<NumberOutlined className="text-gray-400" />}
              placeholder="123456"
            />
          </Form.Item>
          <Form.Item
            name="newPass"
            rules={[
              { required: true, message: 'Ingresa tu nueva contraseña' },
              { min: 6, message: 'Mínimo 6 caracteres' },
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Nueva contraseña"
            />
          </Form.Item>
          <Form.Item
            name="confirmPass"
            rules={[{ required: true, message: 'Confirma tu contraseña' }]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Confirmar nueva contraseña"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="w-full font-semibold shadow-md"
              loading={recoveryMutation.isPending}
            >
              {t('recovery.submit')}
            </Button>
          </Form.Item>
          <div className="text-center mt-4">
            <Link to="/login" className="text-sm font-medium text-accent hover:underline">
              {t('recovery.backToLogin')}
            </Link>
          </div>
        </Form>
        <AuthFooter />
      </div>
    </div>
  );
}
