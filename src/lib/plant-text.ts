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
export const petStatus = (s: string) => (s === 'toxic' ? 'Toxic' : s === 'non-toxic' ? 'Non-toxic' : 'Varies by species');
export const humanStatus = { toxic: 'Toxic', 'mildly-toxic': 'Mildly toxic', 'non-toxic': 'Non-toxic', unknown: 'Not established' } as const;
export const heightTxt = (p: Plant) => {
  if (!p.size.heightIn) return p.size.note ?? '';
  const [a, b] = p.size.heightIn;
  const ft = (x: number) => (x >= 24 ? `${fmtUS(x / 12, 1)} ft` : `${fmtUS(x)} in`);
  return a === b ? ft(a) : `${ft(a)} to ${ft(b)}`;
};
export const isPetSafe = (p: Plant) => p.toxicity.cats === 'non-toxic' && p.toxicity.dogs === 'non-toxic';
export const idealFc = (p: Plant) => LIGHT_LEVEL_FC[p.light.idealLevel];
export const weeksTxt = ([a, b]: [number, number]) => (a === b ? `every ${fmtUS(a)} weeks` : `every ${fmtUS(a)} to ${fmtUS(b)} weeks`);
export const sizeShort = (p: Plant) => (p.size.heightIn ? heightTxt(p) : p.kind === 'bonsai' ? 'Set by pruning' : 'Trailing vine');
