/**
 * Dilution d'engrais : la dose de l'étiquette ramenée au volume d'eau et à la force voulus.
 *
 * Sources : Clemson HGIC « Indoor Plants – Cleaning, Fertilizing, Containers & Light » (dose de
 * l'étiquette tous les deux ou trois mois, ou environ un dixième de la dose à chaque arrosage en
 * saison de croissance ; 20-20-20 pour le feuillage, 15-30-15 pour les plantes à fleurs ; les chiffres
 * N-P-K sont des pourcentages en poids) ; Illinois Extension « Care » (pas plus d'une fois tous les un à
 * trois mois, de mars à septembre ; ratio 1:2:1 ou équilibré ; jamais plus fort que l'étiquette).
 */
export type DoseUnit = 'tsp' | 'tbsp' | 'ml' | 'g';
export type VolumeUnit = 'cup' | 'quart' | 'gallon' | 'liter';
export type Strength = 'full' | 'half' | 'quarter' | 'tenth';

export const ML: Record<'tsp' | 'tbsp' | 'ml', number> = { tsp: 4.92892, tbsp: 14.7868, ml: 1 };
export const VOLUME_ML: Record<VolumeUnit, number> = { cup: 236.588, quart: 946.353, gallon: 3785.41, liter: 1000 };
export const STRENGTH: Record<Strength, number> = { full: 1, half: 0.5, quarter: 0.25, tenth: 0.1 };

export interface FertInput {
  labelAmount: number; labelUnit: DoseUnit; labelPer: VolumeUnit;
  waterAmount: number; waterUnit: VolumeUnit;
  strength: Strength;
  npk: [number, number, number];
  everyWeeks: number;
  /** Durée de la saison de croissance en semaines (mars à septembre ≈ 30). */
  seasonWeeks?: number;
}

export interface FertResult {
  /** Quantité de produit à mettre dans le volume d'eau, dans l'unité de l'étiquette. */
  amount: number;
  unit: DoseUnit;
  /** Même quantité en mL pour un produit dosé en volume, null pour un produit dosé en grammes. */
  amountMl: number | null;
  /** Concentration finale relative à l'étiquette (1 = dose pleine). */
  ratio: number;
  feedingsPerSeason: number;
  /** Azote apporté (mg par litre de solution) — seulement si la dose est en grammes. */
  nitrogenPpm: number | null;
  npkProfile: 'balanced' | 'high-nitrogen' | 'high-phosphorus' | 'high-potassium' | 'one-two-one' | 'unknown';
  warnings: string[];
}

export function npkProfile([n, p, k]: [number, number, number]): FertResult['npkProfile'] {
  if (n <= 0 && p <= 0 && k <= 0) return 'unknown';
  const max = Math.max(n, p, k), min = Math.min(n, p, k);
  if (min > 0 && max / min <= 1.25) return 'balanced';
  if (p > 0 && Math.abs(p / 2 - n) <= n * 0.2 && Math.abs(k - n) <= n * 0.25) return 'one-two-one';
  if (n === max) return 'high-nitrogen';
  if (p === max) return 'high-phosphorus';
  return 'high-potassium';
}

export function dilute(i: FertInput): FertResult {
  const water = Math.max(0, i.waterAmount) * VOLUME_ML[i.waterUnit];
  const per = VOLUME_ML[i.labelPer];
  const ratio = STRENGTH[i.strength];
  const amount = per > 0 ? Math.max(0, i.labelAmount) * (water / per) * ratio : 0;
  const amountMl = i.labelUnit === 'g' ? null : amount * ML[i.labelUnit];
  const nitrogenPpm = i.labelUnit === 'g' && water > 0 ? (amount / (water / 1000)) * (i.npk[0] / 100) * 1000 : null;
  const weeks = i.seasonWeeks ?? 30;
  const feedingsPerSeason = i.everyWeeks > 0 ? Math.floor(weeks / i.everyWeeks) + 1 : 0;
  const warnings: string[] = [];
  if (i.strength === 'tenth' && i.everyWeeks > 2) warnings.push('One-tenth strength is meant for every watering. At this interval, use half or full label strength instead.');
  if (i.strength === 'full' && i.everyWeeks < 4) warnings.push('Full label strength more than once a month is more than most houseplants use; salts build up as a white crust and brown leaf tips.');
  return { amount, unit: i.labelUnit, amountMl, ratio, feedingsPerSeason, nitrogenPpm, npkProfile: npkProfile(i.npk), warnings };
}
