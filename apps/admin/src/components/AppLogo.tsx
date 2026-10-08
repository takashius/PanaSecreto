import { Sparkles } from 'lucide-react';
import { colors } from '@panasecreto/ui-tokens';

export default function AppLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
        style={{ backgroundColor: colors.primary }}
      >
        <Sparkles className="w-5 h-5 text-secondary" style={{ color: colors.secondary }} />
      </div>
      <div className="flex flex-col">
        <span className="font-heading text-xl font-bold tracking-tight text-primary">
          Pana<span style={{ color: colors.secondary }}>Secreto</span>
        </span>
        <span className="text-[10px] text-muted font-medium tracking-wide">PANEL DE CONTROL</span>
      </div>
    </div>
  );
}
