/**
 * Filtro básico de palabras ofensivas para textos que ven otros (alias propios).
 * Normaliza acentos, mayúsculas, separadores y "leet" (4→a, 3→e, 1→i, 0→o, 5→s, @→a, $→s).
 * No pretende ser perfecto: los alias propios también se pueden moderar desde el panel.
 */
const BLOCKED = [
  // Venezuela / español general
  'mamaguevo', 'mamagueva', 'mamahuevo', 'guevon', 'huevon', 'webon', 'gueva', 'guebo', 'huevo',
  'coño', 'cono', 'conchetumadre', 'conchatumadre', 'mardito', 'maldito', 'carajo', 'verga', 'vergacion',
  'pajuo', 'pajua', 'pendejo', 'pendeja', 'marico', 'marica', 'maricon', 'mariquito', 'cabron', 'cabrona',
  'puta', 'puto', 'putica', 'prostituta', 'zorra', 'perra', 'malparido', 'malparida', 'hijueputa', 'hdp',
  'culo', 'culito', 'cuca', 'cuquita', 'pipi', 'chocha', 'nalga', 'teta', 'tetona', 'pene', 'vagina',
  'mierda', 'cagada', 'cagon', 'joder', 'jodido', 'follar', 'coger', 'cogelon', 'polla', 'chupa',
  'mamar', 'mamada', 'singar', 'singao', 'bolsa', 'becerro', 'imbecil', 'idiota', 'estupido', 'estupida',
  'retrasado', 'retrasada', 'mongolico', 'subnormal', 'gonorrea', 'sapo', 'rata', 'nazi', 'hitler',
  'violador', 'violar', 'pedofilo', 'negro de mierda', 'indio de mierda', 'veneco',
  // inglés frecuente
  'fuck', 'shit', 'bitch', 'dick', 'pussy', 'cock', 'asshole', 'whore', 'slut', 'nigger', 'nigga', 'cunt',
];

/** Palabras que solo se bloquean como palabra completa (para no afectar "cucaracha", "bolsillo", etc.) */
const WHOLE_WORD_ONLY = new Set([
  'cuca', 'culo', 'cono', 'pipi', 'teta', 'bolsa', 'huevo', 'sapo', 'rata', 'coger', 'chupa',
  'mamar', 'hdp', 'perra', 'zorra', 'gueva', 'nalga', 'pene', 'dick', 'cock', 'puto', 'puta', 'maldito', 'becerro',
]);

const LEET: Record<string, string> = { '4': 'a', '@': 'a', '3': 'e', '1': 'i', '!': 'i', '0': 'o', '5': 's', $: 's', '7': 't' };

export function normalizeForFilter(value: string): string {
  return value
    .toLowerCase()
    .replace(/ñ/g, '__enie__')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/__enie__/g, 'ñ')
    .replace(/[4@3105$7!]/g, (c) => LEET[c] ?? c)
    .replace(/(.)\1{2,}/g, '$1$1'); // "puuuuta" → "puuta"
}

const collapse = (s: string) => s.replace(/(.)\1+/g, '$1');

export function containsBadWords(value: string): boolean {
  const text = normalizeForFilter(value);
  const words = text.split(/[^a-zñ]+/).filter(Boolean);
  const joined = words.join('');
  const wordSet = new Set([...words, ...words.map(collapse)]);
  return BLOCKED.some((raw) => {
    const bad = normalizeForFilter(raw).replace(/\s+/g, '');
    if (WHOLE_WORD_ONLY.has(raw)) return wordSet.has(bad);
    if (joined.includes(bad)) return true;
    // Letras repetidas ("veeerga"): solo para palabras largas, para no tumbar "Polarcito" por "polla"
    const short = collapse(bad);
    return short.length >= 5 && collapse(joined).includes(short);
  });
}
