/** Mínimo de caracteres para contraseñas nuevas (el backend acepta desde 6; la app pide 8 y un número) */
export const MIN_PASSWORD = 8;

export interface PasswordStrength {
  /** 0 = vacía, 1 = débil, 2 = media, 3 = fuerte */
  level: 0 | 1 | 2 | 3;
  label: string;
  hint: string;
}

/** Fuerza de la contraseña con mensajes en tono EntrePanas */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return { level: 0, label: '', hint: `Usa al menos ${MIN_PASSWORD} caracteres.` };
  if (password.length < MIN_PASSWORD) {
    return { level: 1, label: 'Débil', hint: `Te faltan ${MIN_PASSWORD - password.length} caracteres como mínimo.` };
  }
  const variety = [/\d/, /[A-Z]/, /[a-z]/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  if (password.length >= 8 && variety >= 3) {
    return { level: 3, label: '¡Pila y fuerte! ✨', hint: '¡Chévere! Tiene buen largo, números y símbolos.' };
  }
  return { level: 2, label: 'Media', hint: 'Súmale números, mayúsculas o símbolos para hacerla más fuerte.' };
}
