import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Card, Checkbox, Form, Input, Result, Select, message } from 'antd';
import { Link } from 'react-router-dom';
import { CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { submitServiceCancellation } from '@api/legal';
import { getErrorMessage } from '@utils/GetMessage';

type CancellationFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string;
  reason: string;
  additionalInfo?: string;
  confirmed: boolean;
};

const ServiceCancellationPage = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm<CancellationFormValues>();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleFinish = async (values: CancellationFormValues) => {
    setSubmitting(true);
    try {
      await submitServiceCancellation({ ...values, confirmed: true });
      setSubmitted(true);
    } catch (error) {
      void messageApi.error(getErrorMessage(error) || t('legal.cancellationSubmitError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        {contextHolder}
        <Result
          status="success"
          icon={<CheckCircleOutlined className="text-green-500" />}
          title={t('legal.cancellationSuccessTitle')}
          subTitle={t('legal.cancellationSuccessMessage')}
          extra={[
            <Link to="/login" key="login">
              <Button type="primary">{t('legal.backToLogin')}</Button>
            </Link>,
            <Link to="/terminos" key="terms">
              <Button>{t('legal.terms')}</Button>
            </Link>,
          ]}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {contextHolder}
      <div className="mb-10 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-red-50 p-4 dark:bg-red-950/40">
            <DeleteOutlined className="text-2xl text-red-600" />
          </div>
        </div>
        <h1 className="mb-3 text-3xl font-bold text-gray-800 dark:text-gray-100 md:text-4xl">
          {t('legal.cancellationTitle')}
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">{t('legal.cancellationSubtitle')}</p>
      </div>

      <Form form={form} layout="vertical" onFinish={(values) => void handleFinish(values)}>
        <Card title={t('legal.cancellationPersonal')} className="mb-6">
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Form.Item
              name="firstName"
              label={t('legal.firstName')}
              rules={[{ required: true, message: t('legal.fieldRequired') }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="lastName"
              label={t('legal.lastName')}
              rules={[{ required: true, message: t('legal.fieldRequired') }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="email"
              label={t('legal.email')}
              rules={[
                { required: true, message: t('legal.fieldRequired') },
                { type: 'email', message: t('legal.emailInvalid') },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="phone"
              label={t('legal.phone')}
              rules={[{ required: true, message: t('legal.fieldRequired') }]}
            >
              <Input />
            </Form.Item>
          </div>
          <Form.Item
            name="nationalId"
            label={t('legal.nationalId')}
            rules={[{ required: true, message: t('legal.fieldRequired') }]}
          >
            <Input />
          </Form.Item>
        </Card>

        <Card title={t('legal.cancellationDetails')} className="mb-6">
          <Form.Item
            name="reason"
            label={t('legal.reason')}
            rules={[{ required: true, message: t('legal.fieldRequired') }]}
          >
            <Select
              placeholder={t('legal.reasonPlaceholder')}
              options={[
                { value: 'noLongerUse', label: t('legal.reasonNoLongerUse') },
                { value: 'privacy', label: t('legal.reasonPrivacy') },
                { value: 'security', label: t('legal.reasonSecurity') },
                { value: 'other', label: t('legal.reasonOther') },
              ]}
            />
          </Form.Item>
          <Form.Item name="additionalInfo" label={t('legal.additionalInfo')}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Card>

        <Card title={t('legal.cancellationConfirm')} className="mb-6">
          <Alert type="warning" showIcon className="mb-4" message={t('legal.cancellationWarning')} />
          <Form.Item
            name="confirmed"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value: boolean) =>
                  value ? Promise.resolve() : Promise.reject(new Error(t('legal.fieldRequired'))),
              },
            ]}
          >
            <Checkbox>{t('legal.cancellationCheckbox')}</Checkbox>
          </Form.Item>
        </Card>

        <div className="flex justify-center pb-8">
          <Button type="primary" htmlType="submit" size="large" loading={submitting} danger>
            {t('legal.cancellationSubmit')}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ServiceCancellationPage;
