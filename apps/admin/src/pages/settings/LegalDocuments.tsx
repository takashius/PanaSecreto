import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, Row, Spin, Tabs, Typography, message } from 'antd';
import { FileTextOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/PageHeader';
import MarkdownBody from '@components/legal/MarkdownBody';
import { useAdminLegal, usePublishLegal, type LegalDocKey } from '@api/legal';
import { getErrorMessage } from '@utils/GetMessage';

const { Text } = Typography;

type LegalForm = {
  es: string;
  en: string;
};

function LegalEditor({ docKey }: { docKey: LegalDocKey }) {
  const { t, i18n } = useTranslation();
  const [form] = Form.useForm<LegalForm>();
  const [messageApi, contextHolder] = message.useMessage();
  const { data, isPending, isError, refetch, isFetching } = useAdminLegal(docKey);
  const publishMutation = usePublishLegal(docKey);
  const es = Form.useWatch('es', form) || '';
  const en = Form.useWatch('en', form) || '';
  const previewLang = i18n.language.startsWith('en') ? 'en' : 'es';
  const previewSource = previewLang === 'en' ? en : es;

  useEffect(() => {
    if (data) form.setFieldsValue({ es: data.body.es, en: data.body.en });
  }, [data, form]);

  const onPublish = (values: LegalForm) => {
    publishMutation.mutate(
      { es: values.es, en: values.en },
      {
        onSuccess: (result) =>
          void messageApi.success(t('legalEditor.publishSuccess', { version: result.version })),
        onError: (error) => void messageApi.error(getErrorMessage(error) || t('legalEditor.publishError')),
      }
    );
  };

  if (isPending) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert
        type="error"
        message={t('legalEditor.loadError')}
        action={
          <Button loading={isFetching} onClick={() => void refetch()}>
            {t('error.retry')}
          </Button>
        }
      />
    );
  }

  return (
    <div>
      {contextHolder}
      <Form<LegalForm> form={form} layout="vertical" onFinish={onPublish}>
        <Alert className="mb-4" type="info" showIcon message={t('legalEditor.hint')} />
        <Text type="secondary" className="mb-4 block">
          {t('legalEditor.version', { version: data.version })}
          {data.updatedAt ? ` · ${new Date(data.updatedAt).toLocaleString()}` : ''}
        </Text>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title={t('legalEditor.spanish')}>
              <Form.Item name="es" rules={[{ required: true, whitespace: true }]}>
                <Input.TextArea rows={16} />
              </Form.Item>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={t('legalEditor.english')}>
              <Form.Item name="en" rules={[{ required: true, whitespace: true }]}>
                <Input.TextArea rows={16} />
              </Form.Item>
            </Card>
          </Col>
          <Col span={24}>
            <Card title={t('legalEditor.preview')}>
              <div className="prose max-w-none text-gray-700 dark:text-gray-300">
                <MarkdownBody text={previewSource} />
              </div>
            </Card>
          </Col>
        </Row>

        <div className="mt-4 flex justify-end">
          <Button type="primary" htmlType="submit" loading={publishMutation.isPending}>
            {t('legalEditor.publish')}
          </Button>
        </div>
      </Form>
    </div>
  );
}

export default function LegalDocuments() {
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState<LegalDocKey>('terms');

  return (
    <div>
      <PageHeader
        breadcrumbItems={[{ title: t('menu.settings') }, { title: t('menu.legal') }]}
        title={t('legalEditor.pageTitle')}
        titleIcon={<FileTextOutlined />}
        description={t('legalEditor.pageDescription')}
      />

      <Tabs
        activeKey={activeKey}
        onChange={(key) => setActiveKey(key as LegalDocKey)}
        items={[
          {
            key: 'terms',
            label: (
              <span>
                <FileTextOutlined /> {t('legal.terms')}
              </span>
            ),
            children: <LegalEditor docKey="terms" />,
          },
          {
            key: 'privacy',
            label: (
              <span>
                <SafetyCertificateOutlined /> {t('legal.privacy')}
              </span>
            ),
            children: <LegalEditor docKey="privacy" />,
          },
        ]}
      />

      <Alert
        className="mt-6"
        type="warning"
        showIcon
        message={t('legalEditor.publicUrlsTitle')}
        description={
          <ul className="mt-2 list-disc pl-5 text-sm">
            <li>
              <a href="/terminos" target="_blank" rel="noreferrer" className="text-amber-700 underline">
                /terminos
              </a>
            </li>
            <li>
              <a href="/privacidad" target="_blank" rel="noreferrer" className="text-amber-700 underline">
                /privacidad
              </a>
            </li>
            <li>
              <a href="/baja-servicio" target="_blank" rel="noreferrer" className="text-amber-700 underline">
                /baja-servicio
              </a>
            </li>
          </ul>
        }
      />
    </div>
  );
}
