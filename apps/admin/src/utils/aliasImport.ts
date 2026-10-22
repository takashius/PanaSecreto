import { ALIAS_MAX_LENGTH, ALIAS_MIN_LENGTH, type AliasGender, type AliasInput } from '@app-types/catalogs';

/** Una línea por alias: "Texto" o "Texto|emoji" */
export function parseAliasLines(raw: string, gender: AliasGender) {
  const valid: AliasInput[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [text = '', emoji = ''] = trimmed.split('|').map((x) => x.trim());
    const key = text.toLowerCase();
    if (text.length < ALIAS_MIN_LENGTH || text.length > ALIAS_MAX_LENGTH || seen.has(key)) {
      invalid.push(trimmed);
      continue;
    }
    seen.add(key);
    valid.push({ text, gender, emoji: emoji || undefined, active: true });
  }
  return { valid, invalid };
}
