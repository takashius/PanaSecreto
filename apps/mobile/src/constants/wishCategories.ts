import { Shirt, Smartphone, Coffee, BookOpen, Cookie, Gift, type LucideIcon } from 'lucide-react-native';
import { theme } from '../styles';
import type { WishCategory } from '../types/session';

/** Ícono y colores por categoría de deseo (se usan cuando el deseo no tiene foto) */
export const WISH_CATEGORIES: Record<WishCategory, { label: string; icon: LucideIcon; color: string; bg: string }> = {
  ropa: { label: 'Ropa', icon: Shirt, color: theme.colors.coral, bg: theme.colors.coralContainer },
  tecnologia: { label: 'Tecnología', icon: Smartphone, color: theme.colors.accentDark, bg: theme.colors.accentContainer },
  hogar: { label: 'Hogar', icon: Coffee, color: theme.colors.primary, bg: theme.colors.surfaceContainer },
  libros: { label: 'Libros', icon: BookOpen, color: theme.colors.primaryLight, bg: theme.colors.surfaceContainerHigh },
  dulces: { label: 'Dulces', icon: Cookie, color: theme.colors.secondaryDark, bg: theme.colors.secondaryFixed },
  otro: { label: 'Otro', icon: Gift, color: theme.colors.primary, bg: theme.colors.secondarySoft },
};
