import isotipo from '../../../../../assets/iconos/isotipo-app.png';
import { useTranslation } from 'react-i18next';

/** Cómo se verá el aviso en la pantalla de bloqueo de un teléfono Android */
export default function PushPreview({ title, body }: { title: string; body: string }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-[28px] bg-gradient-to-b from-primary to-primary-light p-4 pt-6 shadow-inner" aria-label={t('push.previewAria')}>
      <p className="text-center text-white/90 text-4xl font-light tabular-nums mb-1">9:41</p>
      <p className="text-center text-white/70 text-xs mb-5">{t('push.previewDate')}</p>
      <div className="rounded-2xl bg-white/95 dark:bg-gray-900/95 px-3.5 py-3 shadow-md">
        <div className="flex items-center gap-2 mb-1.5">
          <img src={isotipo} alt="" className="w-5 h-5 rounded-md object-contain" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">EntrePanas</span>
          <span className="text-xs text-gray-400">· {t('push.now')}</span>
        </div>
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-snug break-words">
          {title || <span className="text-gray-400 font-normal">{t('push.titlePlaceholder')}</span>}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug mt-0.5 whitespace-pre-line break-words line-clamp-4">
          {body || <span className="text-gray-400">{t('push.bodyPlaceholder')}</span>}
        </p>
      </div>
    </div>
  );
}
