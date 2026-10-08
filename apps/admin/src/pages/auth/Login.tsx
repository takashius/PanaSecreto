import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@context/useAuth';
import { useLogin } from '@api/auth';
import { getErrorMessage } from '@utils/GetMessage';
import { wasErrorToastShown } from '@utils/apiAuthError';
import { canAccessWeb } from '../../constants/roles';
import AppLogo from '@components/AppLogo';
import AuthFooter from '@components/AuthFooter';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const loginMutation = useLogin();
  const [messageApi, contextHolder] = message.useMessage();
  const [initialUsername, setInitialUsername] = useState<string | undefined>(undefined);

  useEffect(() => {
    const storedEmail = localStorage.getItem('email');
    if (storedEmail) setInitialUsername(storedEmail);
  }, []);

  useEffect(() => {
    const state = location.state as { webAccessDenied?: boolean } | null;
    if (state?.webAccessDenied) {
      void messageApi.open({
        type: 'warning',
        content: t('login.webAccessDenied'),
      });
      void navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, messageApi, navigate, t]);

  const onFinish = (values: { username: string; password: string; remember: boolean }) => {
    loginMutation.mutate(
      { email: values.username, password: values.password, client: 'web' },
      {
        onSuccess(data) {
          if (!data?.token) {
            void messageApi.open({
              type: 'error',
              content: t('login.invalidResponse'),
            });
            return;
          }
          if (!canAccessWeb(data.role)) {
            void messageApi.open({
              type: 'warning',
              content: t('login.webAccessDenied'),
            });
            return;
          }
          login(data);
          if (data.forcePasswordChangeOnNextLogin) {
            void navigate('/force-password-change');
            return;
          }
          void navigate('/');
        },
        onError(error) {
          if (wasErrorToastShown(error)) return;
          void messageApi.open({
            type: 'error',
            content: getErrorMessage(error) || t('login.invalidCredentials'),
          });
        },
      }
    );

    if (values.remember) {
      localStorage.setItem('email', values.username);
    } else {
      localStorage.removeItem('email');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      {contextHolder}
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-gray-100 dark:border-gray-800 dark:bg-gray-800">
        <div className="mb-6 flex justify-center">
          <AppLogo className="h-16 w-auto" />
        </div>
        <h2 className="mb-6 text-center text-2xl font-bold font-heading text-gray-800 dark:text-gray-100">
          {t('login.title')}
        </h2>
        <Form
          name="login"
          key={initialUsername ?? 'login'}
          initialValues={{ remember: true, username: initialUsername }}
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: t('login.usernameRequired') }]}
          >
            <Input
              size="large"
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder={t('login.email_placeholder')}
              autoComplete="username"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: t('login.passwordRequired') }]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder={t('login.password')}
              autoComplete="current-password"
            />
          </Form.Item>
          <div className="flex items-center justify-between mb-4">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>{t('login.rememberMe')}</Checkbox>
            </Form.Item>
            <Link to="/recover-password" className="text-sm font-medium text-accent hover:underline">
              {t('login.forgotPassword')}
            </Link>
          </div>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="w-full font-semibold shadow-md"
              loading={loginMutation.isPending}
            >
              {t('login.login')}
            </Button>
          </Form.Item>
        </Form>
        <AuthFooter />
      </div>
    </div>
  );
}
