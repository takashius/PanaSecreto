import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  Upload,
  Avatar,
  Tag,
  message,
  Row,
  Col,
  Typography,
  Spin,
} from 'antd';
import {
  UserOutlined,
  CameraOutlined,
  LockOutlined,
  PhoneOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@context/useAuth';
import { useConfigContext } from '@context/ConfigContext';
import {
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
  useChangePassword,
} from '@api/profile';
import PageHeader from '@components/PageHeader';
import { getErrorMessage } from '@utils/GetMessage';

const { Text, Title, Paragraph } = Typography;

export default function Profile() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { config } = useConfigContext();
  const [messageApi, contextHolder] = message.useMessage();

  const [infoForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const { data: profileData, isLoading, refetch, isRefetching } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const changePasswordMutation = useChangePassword();

  const currentUser = profileData || user;

  useEffect(() => {
    if (currentUser) {
      infoForm.setFieldsValue({
        name: currentUser.name || '',
        lastName: currentUser.lastName || '',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
      });
    }
  }, [currentUser, infoForm]);

  const handleAvatarFile = (file: File) => {
    const isImage =
      file.type === 'image/jpeg' ||
      file.type === 'image/png' ||
      file.type === 'image/webp' ||
      file.type === 'image/gif';

    if (!isImage) {
      void messageApi.error('Solo puedes subir archivos de imagen (JPG, PNG, WebP o GIF).');
      return false;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      void messageApi.error('La imagen no puede pesar más de 5MB.');
      return false;
    }

    const formData = new FormData();
    formData.append('photo', file);

    uploadAvatarMutation.mutate(formData, {
      onSuccess: (updated) => {
        updateUser({ photo: updated.photo });
        void messageApi.success(t('profile.avatarSuccess'));
        void refetch();
      },
      onError: (err) => {
        void messageApi.error(getErrorMessage(err));
      },
    });

    return false;
  };

  const handleUpdateInfo = (values: { name: string; lastName?: string; phone?: string }) => {
    updateProfileMutation.mutate(values, {
      onSuccess: (updated) => {
        updateUser({
          name: updated.name,
          lastName: updated.lastName,
          phone: updated.phone,
        });
        void messageApi.success(t('global.updateSuccess'));
        void refetch();
      },
      onError: (err) => {
        void messageApi.error(getErrorMessage(err));
      },
    });
  };

  const handleChangePassword = (values: { currentPassword: string; newPassword: string }) => {
    changePasswordMutation.mutate(
      {
        oldPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          void messageApi.success(t('profile.passwordSuccess'));
          passwordForm.resetFields();
        },
        onError: (err) => {
          void messageApi.error(getErrorMessage(err));
        },
      }
    );
  };

  if (isLoading && !currentUser) {
    return (
      <div className="flex justify-center items-center p-20">
        <Spin size="large" />
      </div>
    );
  }

  const roleText = Array.isArray(currentUser?.role)
    ? currentUser.role.join(', ')
    : currentUser?.role || 'USER';

  return (
    <div>
      {contextHolder}

      <PageHeader
        breadcrumbItems={[
          { title: <Link to="/">{t('menu.dashboard')}</Link> },
          { title: t('profile.title') },
        ]}
        title={t('profile.title')}
        description={t('profile.description')}
        onRefresh={() => void refetch()}
        loading={isRefetching || uploadAvatarMutation.isPending}
      />

      <Row gutter={[24, 24]}>
        {/* Left Column: Avatar Card & Identity Preview */}
        <Col xs={24} lg={8}>
          <Card className="rounded-2xl shadow-xs overflow-hidden border border-gray-100 dark:border-gray-800">
            {/* Header banner */}
            <div
              className="h-28 -mx-6 -mt-6 p-4 flex items-end justify-end transition-colors"
              style={{
                background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.secondaryColor} 100%)`,
              }}
            >
              <Tag
                className="m-0 font-semibold uppercase tracking-wider text-[11px] px-2.5 py-0.5 rounded-full border-none shadow-sm"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: config.primaryColor,
                }}
              >
                {roleText}
              </Tag>
            </div>

            {/* Profile Avatar with upload trigger */}
            <div className="flex flex-col items-center -mt-14 mb-4">
              <div className="relative group">
                <Avatar
                  size={110}
                  src={currentUser?.photo || undefined}
                  icon={!currentUser?.photo && <UserOutlined />}
                  className="border-4 border-white dark:border-gray-900 shadow-md font-bold text-2xl flex items-center justify-center transition-transform group-hover:scale-102"
                  style={{
                    backgroundColor: config.secondaryColor,
                    color: '#1E1338',
                  }}
                />

                <Upload
                  showUploadList={false}
                  beforeUpload={handleAvatarFile}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  disabled={uploadAvatarMutation.isPending}
                >
                  <button
                    type="button"
                    disabled={uploadAvatarMutation.isPending}
                    title={t('profile.avatarUploadBtn')}
                    className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-2 border-white dark:border-gray-900 shadow-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all hover:scale-110 focus:outline-none"
                  >
                    {uploadAvatarMutation.isPending ? (
                      <LoadingOutlined className="text-sm" />
                    ) : (
                      <CameraOutlined className="text-sm" />
                    )}
                  </button>
                </Upload>
              </div>

              <Title level={4} className="mt-3 mb-0 text-center font-heading">
                {currentUser?.name} {currentUser?.lastName || ''}
              </Title>
              <Text type="secondary" className="text-xs">
                {currentUser?.email}
              </Text>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <Text type="secondary">ID de Usuario</Text>
                <span className="font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                  {currentUser?._id?.slice(-8) || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <Text type="secondary">{t('usersManagement.phone')}</Text>
                <Text strong>{currentUser?.phone || 'No registrado'}</Text>
              </div>
              <div className="flex items-center justify-between text-xs">
                <Text type="secondary">{t('usersManagement.role')}</Text>
                <Text strong>{roleText}</Text>
              </div>
            </div>

            <div className="mt-6">
              <Upload
                showUploadList={false}
                beforeUpload={handleAvatarFile}
                accept="image/png,image/jpeg,image/webp,image/gif"
                disabled={uploadAvatarMutation.isPending}
                className="w-full"
              >
                <Button
                  block
                  icon={
                    uploadAvatarMutation.isPending ? (
                      <LoadingOutlined />
                    ) : (
                      <CameraOutlined />
                    )
                  }
                  loading={uploadAvatarMutation.isPending}
                  className="rounded-xl h-10 font-medium"
                >
                  {uploadAvatarMutation.isPending
                    ? t('profile.avatarUploading')
                    : t('profile.avatarUploadBtn')}
                </Button>
              </Upload>
              <Paragraph className="text-[11px] text-gray-400 text-center mt-2 mb-0">
                {t('profile.avatarHelp')}
              </Paragraph>
            </div>
          </Card>
        </Col>

        {/* Right Column: Edit Profile & Password Cards */}
        <Col xs={24} lg={16} className="space-y-6">
          {/* Card 1: Información Personal */}
          <Card
            title={
              <span className="flex items-center gap-2 font-heading font-semibold text-base">
                <UserOutlined style={{ color: config.secondaryColor }} />
                {t('profile.personalInfo')}
              </span>
            }
            className="rounded-2xl shadow-xs border border-gray-100 dark:border-gray-800"
          >
            <Paragraph type="secondary" className="text-xs mb-6">
              {t('profile.personalInfoHelp')}
            </Paragraph>

            <Form
              form={infoForm}
              layout="vertical"
              onFinish={handleUpdateInfo}
              requiredMark={false}
            >
              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="name"
                    label={t('profile.name')}
                    rules={[{ required: true, message: t('profile.nameRequired') }]}
                  >
                    <Input
                      size="large"
                      prefix={<UserOutlined className="text-gray-400" />}
                      className="rounded-xl"
                      placeholder={t('profile.name')}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item name="lastName" label={t('profile.lastName')}>
                    <Input
                      size="large"
                      prefix={<UserOutlined className="text-gray-400" />}
                      className="rounded-xl"
                      placeholder={t('profile.lastName')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="email"
                    label={t('profile.email')}
                    extra={t('profile.emailReadOnly')}
                  >
                    <Input
                      size="large"
                      disabled
                      prefix={<MailOutlined className="text-gray-400" />}
                      className="rounded-xl bg-gray-50 dark:bg-gray-800/60"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item name="phone" label={t('profile.phone')}>
                    <Input
                      size="large"
                      prefix={<PhoneOutlined className="text-gray-400" />}
                      className="rounded-xl"
                      placeholder={t('profile.phonePlaceholder')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div className="flex justify-end pt-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SaveOutlined />}
                  loading={updateProfileMutation.isPending}
                  className="rounded-xl px-6 font-medium shadow-sm"
                  style={{
                    backgroundColor: config.primaryColor,
                    borderColor: config.primaryColor,
                  }}
                >
                  {t('profile.saveProfile')}
                </Button>
              </div>
            </Form>
          </Card>

          {/* Card 2: Cambio de Contraseña */}
          <Card
            title={
              <span className="flex items-center gap-2 font-heading font-semibold text-base">
                <SafetyCertificateOutlined style={{ color: config.secondaryColor }} />
                {t('profile.securityTitle')}
              </span>
            }
            className="rounded-2xl shadow-xs border border-gray-100 dark:border-gray-800"
          >
            <Paragraph type="secondary" className="text-xs mb-6">
              {t('profile.securityHelp')}
            </Paragraph>

            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
              requiredMark={false}
            >
              <Row gutter={[16, 0]}>
                <Col xs={24}>
                  <Form.Item
                    name="currentPassword"
                    label={t('profile.currentPassword')}
                    rules={[
                      { required: true, message: t('profile.currentPasswordRequired') },
                    ]}
                  >
                    <Input.Password
                      size="large"
                      prefix={<LockOutlined className="text-gray-400" />}
                      className="rounded-xl"
                      placeholder="••••••••"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="newPassword"
                    label={t('profile.newPassword')}
                    rules={[
                      { required: true, message: t('profile.newPasswordRequired') },
                      { min: 6, message: t('profile.newPasswordMin') },
                    ]}
                  >
                    <Input.Password
                      size="large"
                      prefix={<LockOutlined className="text-gray-400" />}
                      className="rounded-xl"
                      placeholder="••••••••"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="confirmPassword"
                    label={t('profile.confirmPassword')}
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: t('profile.confirmPasswordRequired') },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error(t('profile.passwordsDoNotMatch'))
                          );
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      size="large"
                      prefix={<LockOutlined className="text-gray-400" />}
                      className="rounded-xl"
                      placeholder="••••••••"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div className="flex justify-end pt-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<LockOutlined />}
                  loading={changePasswordMutation.isPending}
                  className="rounded-xl px-6 font-medium shadow-sm"
                  style={{
                    backgroundColor: config.primaryColor,
                    borderColor: config.primaryColor,
                  }}
                >
                  {t('profile.updatePassword')}
                </Button>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
