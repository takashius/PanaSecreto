import { useEffect } from 'react';
import { Form, Input, Modal, Segmented, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import { ALIAS_GENDERS, ALIAS_MAX_LENGTH, ALIAS_MIN_LENGTH, type AliasGender, type AliasInput, type AliasSuggestion } from '@app-types/catalogs';

interface Props {
  open: boolean;
  alias?: AliasSuggestion | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (values: AliasInput) => void;
}

export default function AliasFormModal({ open, alias, saving, onCancel, onSave }: Props) {
  const { t } = useTranslation();
  const [form] = Form.useForm<AliasInput>();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(alias ? { text: alias.text, gender: alias.gender, emoji: alias.emoji, active: alias.active } : { text: '', gender: 'N', emoji: '', active: true });
  }, [open, alias, form]);

  return (
    <Modal
      open={open}
      title={alias ? t('aliases.editTitle') : t('aliases.newTitle')}
      okText={t('global.save')}
      cancelText={t('global.cancel')}
      onCancel={onCancel}
      confirmLoading={saving}
      onOk={() => void form.validateFields().then((v) => onSave({ ...v, text: v.text.trim(), emoji: v.emoji?.trim() || undefined }))}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4" requiredMark={false}>
        <div className="grid grid-cols-[1fr_96px] gap-3">
          <Form.Item
            name="text"
            label={t('aliases.text')}
            rules={[
              { required: true, whitespace: true, message: t('aliases.textRequired') },
              { min: ALIAS_MIN_LENGTH, max: ALIAS_MAX_LENGTH, message: t('aliases.textLength', { min: ALIAS_MIN_LENGTH, max: ALIAS_MAX_LENGTH }) },
            ]}
          >
            <Input placeholder="Pana Arepero" maxLength={ALIAS_MAX_LENGTH} showCount />
          </Form.Item>
          <Form.Item name="emoji" label={t('aliases.emoji')} rules={[{ max: 16 }]}>
            <Input placeholder="🫓" className="text-center text-lg" />
          </Form.Item>
        </div>
        <Form.Item name="gender" label={t('aliases.genderLabel')} extra={t('aliases.genderHelp')}>
          <Segmented<AliasGender> block options={ALIAS_GENDERS.map((g) => ({ value: g, label: t(`aliases.gender.${g}`) }))} />
        </Form.Item>
        <Form.Item name="active" label={t('aliases.activeLabel')} valuePropName="checked" extra={t('aliases.activeHelp')}>
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
