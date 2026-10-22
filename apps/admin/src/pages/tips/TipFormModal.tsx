import { useEffect } from 'react';
import { Checkbox, Form, Input, Modal, Slider, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import TipBubble from '@components/catalogs/TipBubble';
import { TIP_MAX_LENGTH, TIP_SCREENS, type Tip, type TipInput } from '@app-types/catalogs';

interface Props {
  open: boolean;
  tip?: Tip | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (values: TipInput) => void;
}

export default function TipFormModal({ open, tip, saving, onCancel, onSave }: Props) {
  const { t } = useTranslation();
  const [form] = Form.useForm<TipInput>();
  const text = Form.useWatch('text', form) ?? '';

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(
      tip
        ? { text: tip.text, screens: tip.screens, weight: tip.weight, active: tip.active }
        : { text: '', screens: ['general'], weight: 1, active: true }
    );
  }, [open, tip, form]);

  return (
    <Modal
      open={open}
      title={tip ? t('tips.editTitle') : t('tips.newTitle')}
      okText={t('global.save')}
      cancelText={t('global.cancel')}
      onCancel={onCancel}
      confirmLoading={saving}
      onOk={() => void form.validateFields().then((v) => onSave({ ...v, text: v.text.trim() }))}
      width={680}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4" requiredMark={false}>
        <Form.Item
          name="text"
          label={t('tips.text')}
          rules={[
            { required: true, whitespace: true, message: t('tips.textRequired') },
            { min: 5, message: t('tips.textShort') },
          ]}
        >
          <Input.TextArea rows={3} maxLength={TIP_MAX_LENGTH} showCount placeholder={t('tips.textPlaceholder')} />
        </Form.Item>

        <div className="mb-5">
          <p className="text-sm text-gray-500 mb-2">{t('tips.preview')}</p>
          <TipBubble text={text} />
        </div>

        <Form.Item
          name="screens"
          label={t('tips.screens')}
          extra={t('tips.screensHelp')}
          rules={[{ required: true, type: 'array', min: 1, message: t('tips.screensRequired') }]}
        >
          <Checkbox.Group className="grid grid-cols-1 sm:grid-cols-2 gap-y-2">
            {TIP_SCREENS.map((s) => (
              <Checkbox key={s} value={s}>
                <span className={s === 'general' ? 'font-semibold' : undefined}>{t(`tips.screen.${s}`)}</span>
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Form.Item>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6">
          <Form.Item name="weight" label={t('tips.weight')} extra={t('tips.weightHelp')}>
            <Slider min={1} max={5} marks={{ 1: '1', 3: '3', 5: '5' }} />
          </Form.Item>
          <Form.Item name="active" label={t('tips.activeLabel')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
