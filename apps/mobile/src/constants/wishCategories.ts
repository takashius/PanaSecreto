import { Shirt, Smartphone, Coffee, BookOpen, Cookie, Gift, type LucideIcon } from 'lucide-react-native';
import { theme } from '../styles';
import type { WishCategory } from '../types/session';

/** Ícono, colores y textos por categoría de deseo (el ícono se usa cuando el deseo no tiene foto) */
export const WISH_CATEGORIES: Record<
  WishCategory,
  { label: string; formLabel: string; emoji: string; icon: LucideIcon; color: string; bg: string }
> = {
  ropa: { label: 'Ropa', formLabel: 'Ropa & Moda', emoji: '👕', icon: Shirt, color: theme.colors.coral, bg: theme.colors.coralContainer },
  tecnologia: { label: 'Tecnología', formLabel: 'Tecnología', emoji: '🎧', icon: Smartphone, color: theme.colors.accentDark, bg: theme.colors.accentContainer },
  hogar: { label: 'Hogar', formLabel: 'Hogar & Café', emoji: '☕', icon: Coffee, color: theme.colors.primary, bg: theme.colors.surfaceContainer },
  dulces: { label: 'Dulces', formLabel: 'Dulces & Antojos', emoji: '🍫', icon: Cookie, color: theme.colors.secondaryDark, bg: theme.colors.secondaryFixed },
  libros: { label: 'Libros', formLabel: 'Libros', emoji: '📚', icon: BookOpen, color: theme.colors.primaryLight, bg: theme.colors.surfaceContainerHigh },
  otro: { label: 'Otro', formLabel: 'Otro capricho', emoji: '✨', icon: Gift, color: theme.colors.primary, bg: theme.colors.secondarySoft },
};

export const WISH_CATEGORY_ORDER: WishCategory[] = ['ropa', 'tecnologia', 'hogar', 'dulces', 'libros', 'otro'];
