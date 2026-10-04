/** Libellés et mises en forme des données de fiche (US d'abord : °F, pouces). */
import { LIGHT_LEVEL_FC, type Plant } from './plant-schema';

export const LEVEL_LABEL: Record<Plant['light']['idealLevel'], string> = { low: 'Low light', medium: 'Medium light', high: 'Bright light', direct: 'Direct sun' };
export const RULE_TEXT: Record<Plant['water']['rule'], string> = {
  'evenly-moist': 'Keep evenly moist', 'top-inch': 'When the top inch is dry', 'top-2-inches': 'When the top 2 inches are dry',
  'half-dry': 'When the top half of the pot is dry', 'fully-dry': 'When the mix is dry all the way down', 'bark-dry': 'When the bark is nearly dry',
};
export const HUMIDITY_LABEL = { low: 'Dry air is fine', average: 'Average room humidity', high: 'Likes humid air' } as const;
export const SUN_LABEL = { avoid: 'No direct sun', 'morning-only': 'Morning sun only', tolerates: 'Tolerates direct sun', needs: 'Needs some direct sun' } as const;
export const STRENGTH_LABEL = { full: 'label rate', half: 'half strength', quarter: 'quarter strength' } as const;

export const fmtUS = (n: number, d = 0) => new Intl.NumberFormat('en-US', { maximumFractionDigits: d }).format(n);
export const temp = (f: number, c: number) => `${fmtUS(f)}°F (${fmtUS(c)}°C)`;
export const rangeTxt = ([a, b]: [number, number], unit = '') => (a === b ? `${fmtUS(a, 1)}${unit}` : `${fmtUS(a, 1)} to ${fmtUS(b, 1)}${unit}`);
export const lightSpan = (p: Plant) => (p.light.minLevel === p.light.maxLevel ? LEVEL_LABEL[p.light.minLevel] : `${LEVEL_LABEL[p.light.minLevel]} to ${LEVEL_LABEL[p.light.maxLevel].toLowerCase()}`);
export const windowsTxt = (w: string[]) => w.map((x) => x[0].toUpperCase() + x.slice(1)).join(', ');
export const petStatus = (s: string) => (s === 'toxic' ? 'Toxic' : s === 'non-toxic' ? 'Non-toxic' : s === 'unknown' ? 'Not rated' : 'Varies by species');
export const humanStatus = { toxic: 'Toxic', 'mildly-toxic': 'Mildly toxic', 'non-toxic': 'Non-toxic', unknown: 'Not established' } as const;
export const heightTxt = (p: Plant) => {
  if (!p.size.heightIn) return p.size.note ?? '';
  const [a, b] = p.size.heightIn;
  const ft = (x: number) => (x >= 24 ? `${fmtUS(x / 12, 1)} ft` : `${fmtUS(x)} in`);
  return a === b ? ft(a) : `${ft(a)} to ${ft(b)}`;
};
export const isPetSafe = (p: Plant) => p.toxicity.cats === 'non-toxic' && p.toxicity.dogs === 'non-toxic';
export const idealFc = (p: Plant) => LIGHT_LEVEL_FC[p.light.idealLevel];
/** everyWeeks [0, 0] : la plante ne se fertilise pas (dionée : les sources l'interdisent). */
export const noFeeding = (w: [number, number]) => w[1] === 0;
export const weeksTxt = ([a, b]: [number, number]) => (b === 0 ? 'no fertilizer' : a === b ? `every ${fmtUS(a)} weeks` : `every ${fmtUS(a)} to ${fmtUS(b)} weeks`);
export const sizeShort = (p: Plant) => (p.size.heightIn ? heightTxt(p) : p.kind === 'bonsai' ? 'Set by pruning' : 'Trailing vine');

/** Nom commun au fil d'une phrase : minuscules, sauf les noms propres et les sigles
 *  (« Boston fern », « Norfolk Island pine », « ZZ plant », « pilea (Chinese money plant) »). */
const PROPER = new Set(['African', 'Boston', 'Norfolk', 'Island', 'Chinese', 'English', 'Christmas', 'Venus', 'Meyer', 'Audrey', 'Swiss', 'Adanson', 'Persian', 'Easter', 'Thanksgiving', 'Japanese', 'Hawaiian', 'Mexican', 'Moses', 'Rex', 'Birkin']);
export function nameInText(name: string): string {
  return name.split(/(\s+|[()/-])/).map((w) => (PROPER.has(w) || (w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w)) ? w : w.toLowerCase())).join('');
}

/** Liste courte au fil d'une phrase : les n premiers noms puis « and N more ». Les réponses de
 *  FAQ restent entre 40 et 90 mots quand le nombre de fiches grandit (RECETTE §7). */
export function listSome(names: string[], n = 8): string {
  if (names.length <= n) return names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names.join('');
  return names.slice(0, n).join(', ') + ` and ${names.length - n} more`;
}
