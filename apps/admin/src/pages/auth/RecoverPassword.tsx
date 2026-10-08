import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Input, Button, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useRecoveryOne } from '@api/auth';
import { getErrorMessage } from '@utils/GetMessage';
import AppLogo from '@components/AppLogo';
import AuthFooter from '@components/AuthFooter';

export default function RecoverPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const recoveryMutation = useRecoveryOne();
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = (values: { email: string }) => {
    recoveryMutation.mutate(values.email, {
      onSuccess() {
        void messageApi.success('Si el correo existe, recibirás un código de recuperación.');
        setTimeout(() => {
          void navigate(`/recover-password/step2?email=${encodeURIComponent(values.email)}`);
        }, 1200);
      },
      onError(error) {
        void messageApi.error(getErrorMessage(error) || 'Error al procesar solicitud');
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      {contextHolder}
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-gray-100 dark:border-gray-800 dark:bg-gray-800">
        <div className="mb-6 flex justify-center">
          <AppLogo className="h-16 w-auto" />
        </div>
        <h2 className="mb-2 text-center text-2xl font-bold font-heading text-gray-800 dark:text-gray-100">
          {t('recovery.title')}
        </h2>
        <p className="mb-6 text-center text-sm text-gray-500">
          {t('recovery.description')}
        </p>

        <Form name="recover_step1" onFinish={onFinish} layout="vertical">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Por favor ingresa tu correo' },
              { type: 'email', message: 'Ingresa un correo electrónico válido' },
            ]}
          >
            <Input
              size="large"
              prefix={<MailOutlined className="text-gray-400" />}
              placeholder="correo@ejemplo.com"
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
              {t('recovery.sendCode')}
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
