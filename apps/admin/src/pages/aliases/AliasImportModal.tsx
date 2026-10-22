import { useState } from 'react';
import { Alert, Input, Modal, Segmented, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { ALIAS_GENDERS, type AliasGender, type AliasInput } from '@app-types/catalogs';
import { parseAliasLines } from '@utils/aliasImport';

interface Props {
  open: boolean;
  onCancel: () => void;
  /** Crea los alias uno a uno; devuelve cuántos se crearon y cuáles fallaron */
  onImport: (items: AliasInput[]) => Promise<{ created: number; failed: string[] }>;
}

export default function AliasImportModal({ open, onCancel, onImport }: Props) {
  const { t } = useTranslation();
  const [gender, setGender] = useState<AliasGender>('N');
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ created: number; failed: string[] } | null>(null);
  const { valid, invalid } = parseAliasLines(raw, gender);

  const close = () => {
    setRaw('');
    setResult(null);
    onCancel();
  };

  return (
    <Modal
      open={open}
      title={t('aliases.importTitle')}
      okText={result ? t('global.close') : t('aliases.importOk', { count: valid.length })}
      cancelText={t('global.cancel')}
      cancelButtonProps={{ style: result ? { display: 'none' } : undefined }}
      okButtonProps={{ disabled: !result && valid.length === 0 }}
      confirmLoading={busy}
      onCancel={close}
      onOk={() => {
        if (result) return close();
        setBusy(true);
        void onImport(valid)
          .then((r) => {
            setResult(r);
            setRaw('');
          })
          .finally(() => setBusy(false));
      }}
      width={560}
    >
      {result ? (
        <div className="space-y-3 mt-4">
          <Alert type="success" showIcon message={t('aliases.importDone', { count: result.created })} />
          {result.failed.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message={t('aliases.importFailed', { count: result.failed.length })}
              description={result.failed.join(', ')}
            />
          )}
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          <Typography.Paragraph type="secondary" className="!mb-0">
            {t('aliases.importHelp')}
          </Typography.Paragraph>
          <Segmented<AliasGender>
            block
            value={gender}
            onChange={setGender}
            options={ALIAS_GENDERS.map((g) => ({ value: g, label: t(`aliases.gender.${g}`) }))}
          />
          <Input.TextArea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={10}
            placeholder={'Pana Tostón|🍌\nChama Parrandera|🎉\nPana Sorpresa'}
            className="font-mono"
          />
          <p className="text-xs text-gray-500">
            {t('aliases.importCount', { valid: valid.length, invalid: invalid.length })}
          </p>
          {invalid.length > 0 && (
            <Alert type="info" showIcon message={t('aliases.importInvalid')} description={invalid.slice(0, 8).join(' · ')} />
          )}
        </div>
      )}
    </Modal>
  );
}
