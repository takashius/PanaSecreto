import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, ColorPicker, Upload, message, Space, Row, Col, Typography, Divider } from 'antd';
import { UploadOutlined, SaveOutlined, PictureOutlined, BgColorsOutlined, EyeOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import PageHeader from '@components/PageHeader';
import { useConfigContext } from '@context/ConfigContext';
import { useUpdateSystemConfig } from '../../api/config';
import { getErrorMessage } from '@utils/GetMessage';

const { Text } = Typography;

export default function Configuration() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const { config, isLoading, refetch } = useConfigContext();
  const updateMutation = useUpdateSystemConfig();

  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [faviconFileList, setFaviconFileList] = useState<UploadFile[]>([]);

  // Watch form fields for live preview
  const appNameValue = Form.useWatch('appName', form) || config.appName;
  const primaryColorValue = Form.useWatch('primaryColor', form) || config.primaryColor;
  const secondaryColorValue = Form.useWatch('secondaryColor', form) || config.secondaryColor;
  const accentColorValue = Form.useWatch('accentColor', form) || config.accentColor;

  useEffect(() => {
    if (config) {
      form.setFieldsValue({
        appName: config.appName,
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        accentColor: config.accentColor,
      });
    }
  }, [config, form]);

  const handleSubmit = async (values: any) => {
    const formData = new FormData();

    formData.append('appName', values.appName || config.appName);

    // Normalizar colores a string hexadecimal
    const primaryHex = typeof values.primaryColor === 'string'
      ? values.primaryColor
      : values.primaryColor?.toHexString?.() || config.primaryColor;

    const secondaryHex = typeof values.secondaryColor === 'string'
      ? values.secondaryColor
      : values.secondaryColor?.toHexString?.() || config.secondaryColor;

    const accentHex = typeof values.accentColor === 'string'
      ? values.accentColor
      : values.accentColor?.toHexString?.() || config.accentColor;

    formData.append('primaryColor', primaryHex);
    formData.append('secondaryColor', secondaryHex);
    formData.append('accentColor', accentHex);

    if (logoFileList.length > 0 && logoFileList[0].originFileObj) {
      formData.append('logo', logoFileList[0].originFileObj);
    }

    if (faviconFileList.length > 0 && faviconFileList[0].originFileObj) {
      formData.append('favicon', faviconFileList[0].originFileObj);
    }

    updateMutation.mutate(formData, {
      onSuccess: () => {
        void messageApi.success(t('global.updateSuccess'));
        setLogoFileList([]);
        setFaviconFileList([]);
        refetch();
      },
      onError: (err) => {
        void messageApi.error(getErrorMessage(err));
      },
    });
  };

  const primaryHex = typeof primaryColorValue === 'string'
    ? primaryColorValue
    : primaryColorValue?.toHexString?.() || '#1E1338';

  const secondaryHex = typeof secondaryColorValue === 'string'
    ? secondaryColorValue
    : secondaryColorValue?.toHexString?.() || '#F7A800';

  const accentHex = typeof accentColorValue === 'string'
    ? accentColorValue
    : accentColorValue?.toHexString?.() || '#1D84B5';

  return (
    <div>
      {contextHolder}

      <PageHeader
        breadcrumbItems={[
          { title: <Link to="/">{t('menu.dashboard')}</Link> },
          { title: t('settings.title') },
        ]}
        title={t('settings.title')}
        description={t('settings.description')}
        onRefresh={() => void refetch()}
        loading={isLoading || updateMutation.isPending}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          appName: config.appName,
          primaryColor: config.primaryColor,
          secondaryColor: config.secondaryColor,
          accentColor: config.accentColor,
        }}
      >
        <Row gutter={[24, 24]}>
          {/* Columna Izquierda: Formulario de Configuración */}
          <Col xs={24} lg={15}>
            <Space direction="vertical" size="large" className="w-full">
              {/* Card 1: Identidad y Nombre */}
              <Card
                title={
                  <span className="flex items-center gap-2 font-heading font-semibold text-base">
                    <PictureOutlined /> Identidad y Marca
                  </span>
                }
                className="rounded-2xl shadow-xs"
              >
                <Form.Item
                  name="appName"
                  label={t('settings.appName')}
                  extra={t('settings.appNameHelp')}
                  rules={[{ required: true, message: 'El nombre es requerido' }]}
                >
                  <Input size="large" placeholder="PanaSecreto" />
                </Form.Item>
              </Card>

              {/* Card 2: Colores del Sistema */}
              <Card
                title={
                  <span className="flex items-center gap-2 font-heading font-semibold text-base">
                    <BgColorsOutlined /> {t('settings.colorsTitle')}
                  </span>
                }
                className="rounded-2xl shadow-xs"
              >
                <Row gutter={[16, 16]}>
                  {/* Color Principal */}
                  <Col xs={24} sm={8}>
                    <Form.Item
                      name="primaryColor"
                      label={t('settings.primaryColor')}
                      extra={t('settings.primaryColorHelp')}
                      rules={[{ required: true, message: 'Requerido' }]}
                    >
                      <ColorPicker
                        showText
                        format="hex"
                        size="large"
                        className="w-full justify-between"
                        presets={[
                          {
                            label: 'Recomendados',
                            colors: ['#1E1338', '#0F172A', '#0F766E', '#1E3A8A', '#312E81', '#18181B'],
                          },
                        ]}
                      />
                    </Form.Item>
                  </Col>

                  {/* Color Secundario */}
                  <Col xs={24} sm={8}>
                    <Form.Item
                      name="secondaryColor"
                      label={t('settings.secondaryColor')}
                      extra={t('settings.secondaryColorHelp')}
                      rules={[{ required: true, message: 'Requerido' }]}
                    >
                      <ColorPicker
                        showText
                        format="hex"
                        size="large"
                        className="w-full justify-between"
                        presets={[
                          {
                            label: 'Recomendados',
                            colors: ['#F7A800', '#F59E0B', '#EAB308', '#F97316', '#10B981', '#EC4899'],
                          },
                        ]}
                      />
                    </Form.Item>
                  </Col>

                  {/* Color de Acento */}
                  <Col xs={24} sm={8}>
                    <Form.Item
                      name="accentColor"
                      label={t('settings.accentColor')}
                      extra={t('settings.accentColorHelp')}
                      rules={[{ required: true, message: 'Requerido' }]}
                    >
                      <ColorPicker
                        showText
                        format="hex"
                        size="large"
                        className="w-full justify-between"
                        presets={[
                          {
                            label: 'Recomendados',
                            colors: ['#1D84B5', '#0284C7', '#06B6D4', '#6366F1', '#8B5CF6', '#14B8A6'],
                          },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* Card 3: Logotipo y Favicon en Cloudinary */}
              <Card
                title={
                  <span className="flex items-center gap-2 font-heading font-semibold text-base">
                    <PictureOutlined /> {t('settings.brandingTitle')}
                  </span>
                }
                className="rounded-2xl shadow-xs"
              >
                <Row gutter={[24, 24]}>
                  {/* Logotipo */}
                  <Col xs={24} sm={12}>
                    <div className="space-y-3">
                      <div>
                        <Text strong>{t('settings.logo')}</Text>
                        <p className="text-xs text-gray-500 mt-0.5">{t('settings.logoHelp')}</p>
                      </div>

                      {config.logoUrl && (
                        <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center">
                          <p className="text-[11px] text-gray-400 mb-2">{t('settings.currentImage')}</p>
                          <img
                            src={config.logoUrl}
                            alt="Logo actual"
                            className="max-h-16 max-w-full object-contain rounded"
                          />
                        </div>
                      )}

                      <Upload
                        fileList={logoFileList}
                        beforeUpload={() => false}
                        onChange={({ fileList }) => setLogoFileList(fileList.slice(-1))}
                        maxCount={1}
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      >
                        <Button icon={<UploadOutlined />}>{t('settings.uploadButton')}</Button>
                      </Upload>
                    </div>
                  </Col>

                  {/* Favicon */}
                  <Col xs={24} sm={12}>
                    <div className="space-y-3">
                      <div>
                        <Text strong>{t('settings.favicon')}</Text>
                        <p className="text-xs text-gray-500 mt-0.5">{t('settings.faviconHelp')}</p>
                      </div>

                      {config.faviconUrl && (
                        <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center">
                          <p className="text-[11px] text-gray-400 mb-2">{t('settings.currentImage')}</p>
                          <img
                            src={config.faviconUrl}
                            alt="Favicon actual"
                            className="w-8 h-8 object-contain rounded"
                          />
                        </div>
                      )}

                      <Upload
                        fileList={faviconFileList}
                        beforeUpload={() => false}
                        onChange={({ fileList }) => setFaviconFileList(fileList.slice(-1))}
                        maxCount={1}
                        accept="image/png,image/x-icon,image/svg+xml,image/jpeg"
                      >
                        <Button icon={<UploadOutlined />}>{t('settings.uploadButton')}</Button>
                      </Upload>
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* Botón de Guardado */}
              <div className="pt-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SaveOutlined />}
                  loading={updateMutation.isPending}
                  className="shadow-md"
                >
                  {t('settings.saveChanges')}
                </Button>
              </div>
            </Space>
          </Col>

          {/* Columna Derecha: Previsualización en Vivo */}
          <Col xs={24} lg={9}>
            <div className="sticky top-24">
              <Card
                title={
                  <span className="flex items-center gap-2 font-heading font-semibold text-base">
                    <EyeOutlined /> {t('settings.previewTitle')}
                  </span>
                }
                className="rounded-2xl shadow-xs overflow-hidden"
              >
                <p className="text-xs text-gray-500 mb-4">{t('settings.previewSubtitle')}</p>

                {/* Mock Header Preview */}
                <div
                  className="h-14 px-4 rounded-xl flex items-center justify-between text-white shadow-sm mb-3 transition-colors duration-300"
                  style={{ backgroundColor: primaryHex }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs" style={{ color: secondaryHex }}>
                      ★
                    </div>
                    <span className="font-heading font-bold text-sm tracking-tight">
                      {appNameValue}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10" style={{ color: secondaryHex }}>
                      Online
                    </span>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-purple-950" style={{ backgroundColor: secondaryHex }}>
                      A
                    </div>
                  </div>
                </div>

                {/* Mock Sidebar Preview */}
                <div
                  className="p-3.5 rounded-xl text-white space-y-2 mb-4 transition-colors duration-300"
                  style={{ backgroundColor: primaryHex }}
                >
                  <div
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold shadow-xs"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderLeft: `4px solid ${secondaryHex}`,
                    }}
                  >
                    <span>👥</span>
                    <span>Usuarios (Activo)</span>
                  </div>

                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/80 hover:bg-white/10">
                    <span>⚙️</span>
                    <span>Configuración</span>
                  </div>
                </div>

                <Divider className="my-3" />

                {/* Mock UI Elements */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-gray-500">Botones con paleta de acentos:</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs"
                      style={{ backgroundColor: primaryHex }}
                    >
                      Botón Primario
                    </button>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-purple-950 shadow-xs"
                      style={{ backgroundColor: secondaryHex }}
                    >
                      Acento Secundario
                    </button>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs"
                      style={{ backgroundColor: accentHex }}
                    >
                      Acento Terciario
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
