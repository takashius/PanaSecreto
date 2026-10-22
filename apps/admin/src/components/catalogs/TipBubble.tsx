import isotipo from '../../../../../assets/iconos/isotipo-app.png';

/**
 * Vista previa de un tip tal como lo muestra la app: mascota + globo crema con "¡Tip del pana!".
 */
export default function TipBubble({ text, compact = false }: { text: string; compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
      <img
        src={isotipo}
        alt=""
        className={`${compact ? 'w-10 h-10' : 'w-14 h-14'} shrink-0 rounded-xl object-contain`}
      />
      <p
        className={`flex-1 rounded-2xl bg-background dark:bg-gray-800 px-4 py-3 text-textDark dark:text-gray-100 leading-snug ${
          compact ? 'text-sm' : 'text-[15px]'
        }`}
      >
        <strong className="text-primary dark:text-secondary">¡Tip del pana! </strong>
        {text || <span className="text-gray-400">Escribe el tip para verlo aquí…</span>}
      </p>
    </div>
  );
}
