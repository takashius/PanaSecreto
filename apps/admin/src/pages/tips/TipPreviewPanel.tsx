import { useState } from 'react';
import { Button, Card, Empty, Select, Spin } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import TipBubble from '@components/catalogs/TipBubble';
import { useTipPreview } from '@api/catalogs';
import { TIP_SCREENS, type TipScreen } from '@app-types/catalogs';

/** Muestra lo que verá la app en una pantalla: un tip al azar de los activos (más los generales) */
export default function TipPreviewPanel() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<TipScreen>('sobre.lista');
  const [index, setIndex] = useState(0);
  const { data, isPending, isFetching, refetch } = useTipPreview(screen);
  const results = data?.results ?? [];
  const current = results.length > 0 ? results[index % results.length] : null;

  return (
    <Card className="rounded-2xl shadow-xs h-fit" title={t('tips.previewTitle')}>
      <p className="text-sm text-gray-500 mb-3">{t('tips.previewHelp')}</p>
      <Select
        value={screen}
        onChange={(v) => {
          setScreen(v);
          setIndex(0);
        }}
        className="w-full mb-4"
        options={TIP_SCREENS.map((s) => ({ value: s, label: t(`tips.screen.${s}`) }))}
        aria-label={t('tips.screens')}
      />
      {isPending ? (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      ) : current ? (
        <>
          <TipBubble text={current.text} compact />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500">{t('tips.previewCount', { count: results.length })}</span>
            <Button
              size="small"
              icon={<ReloadOutlined spin={isFetching} />}
              onClick={() => {
                if (index + 1 >= results.length) {
                  setIndex(0);
                  void refetch();
                } else setIndex(index + 1);
              }}
            >
              {t('tips.another')}
            </Button>
          </div>
        </>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('tips.previewEmpty')} />
      )}
    </Card>
  );
}
