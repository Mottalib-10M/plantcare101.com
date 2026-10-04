/**
 * Calendrier d'arrosage : une FOURCHETTE de jours, jamais une date.
 *
 * Méthode (publiée sur /methodology/) :
 *  1. On part de la règle de séchage de la fiche plante (`water.rule`), qui fixe un intervalle de
 *     référence pour un pot de 6 in en plastique percé, terreau standard, lumière vive indirecte,
 *     été, air à 30–50 % d'humidité. Ces intervalles de référence sont NOTRE modèle, présenté comme
 *     tel ; les sources (Clemson HGIC, Illinois Extension) refusent de donner un calendrier et disent
 *     d'arroser au toucher : la sortie donne donc toujours le test du doigt et celui du poids.
 *  2. On applique des multiplicateurs, un par facteur que Clemson HGIC (« Indoor Plants – Watering »)
 *     et l'Illinois Extension (« Watering ») nomment : taille du pot, matière (l'argile poreuse sèche
 *     plus vite), lumière, saison (repos hivernal), humidité de l'air, type de substrat (un mélange
 *     riche en tourbe retient plus d'eau qu'un mélange d'écorce, de sable et de perlite), drainage.
 *  Les valeurs des multiplicateurs sont des estimations d'ordre de grandeur, pas des mesures : on les
 *  écrit ici et sur la page Méthode, et le résultat se présente comme une fourchette à vérifier.
 */
import type { Plant } from '../plant-schema';

export type DryRule = Plant['water']['rule'];
export type PotMaterial = 'terracotta' | 'plastic' | 'glazed';
export type LightExposure = 'low' | 'medium' | 'bright-indirect' | 'direct-sun';
export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type AirHumidity = 'dry' | 'average' | 'humid';
export type Substrate = 'standard' | 'chunky' | 'gritty' | 'bark' | 'moisture-retentive';

export interface WateringInput {
  rule: DryRule;
  potDiameterIn: number;
  material: PotMaterial;
  drainage: boolean;
  light: LightExposure;
  season: Season;
  humidity: AirHumidity;
  substrate: Substrate;
}

/** Intervalle de référence (jours) par règle de séchage — modèle du site, voir l'en-tête. */
export const BASE_DAYS: Record<DryRule, [number, number]> = {
  'evenly-moist': [3, 5],
  'top-inch': [5, 8],
  'top-2-inches': [7, 11],
  'half-dry': [9, 14],
  'fully-dry': [14, 21],
  'bark-dry': [6, 9],
};

/** Profondeur à tester au doigt, en pouces (0 = surface ; null = tout le pot). */
export const FINGER_DEPTH_IN: Record<DryRule, number | null> = {
  'evenly-moist': 0.5, 'top-inch': 1, 'top-2-inches': 2, 'half-dry': null, 'fully-dry': null, 'bark-dry': null,
};

/** Part de l'eau retenue après arrosage qu'on laisse partir avant d'arroser de nouveau. */
export const WEIGHT_LOSS_SHARE: Record<DryRule, number> = {
  'evenly-moist': 0.3, 'top-inch': 0.45, 'top-2-inches': 0.55, 'half-dry': 0.6, 'fully-dry': 0.85, 'bark-dry': 0.7,
};

export const MULT = {
  material: { terracotta: 0.75, plastic: 1, glazed: 1 } as Record<PotMaterial, number>,
  light: { low: 1.45, medium: 1.2, 'bright-indirect': 1, 'direct-sun': 0.8 } as Record<LightExposure, number>,
  season: { summer: 1, spring: 1.1, fall: 1.25, winter: 1.6 } as Record<Season, number>,
  humidity: { dry: 0.85, average: 1, humid: 1.15 } as Record<AirHumidity, number>,
  substrate: { standard: 1, chunky: 0.85, gritty: 0.75, bark: 0.7, 'moisture-retentive': 1.25 } as Record<Substrate, number>,
  noDrainage: 1.4,
};

/** Pot de référence : 6 in. Un pot plus grand garde l'eau plus longtemps, sans proportionnalité. */
export function potFactor(diameterIn: number): number {
  const d = Math.min(Math.max(diameterIn, 2), 24);
  return Math.min(1.6, Math.max(0.65, Math.sqrt(d / 6)));
}

/** Volume de terreau d'un pot standard évasé, hauteur ≈ diamètre (coefficient 0,65 pour l'évasement). */
export function potVolumeCubicIn(diameterIn: number): number {
  const d = Math.min(Math.max(diameterIn, 2), 24);
  return 0.65 * Math.PI / 4 * d * d * d;
}

export const ML_PER_CUBIC_IN = 16.387;
export const ML_PER_CUP = 236.588;
export const ML_PER_FL_OZ = 29.5735;
export const G_PER_OZ = 28.3495;

export interface WateringResult {
  days: [number, number];
  /** Premier jour où vérifier le pot (début de fourchette moins un jour). */
  checkFromDay: number;
  factors: Array<{ label: string; mult: number }>;
  totalMult: number;
  /** Volume indicatif d'un arrosage, en mL. */
  volumeMl: [number, number];
  volumeCups: [number, number];
  fingerDepthIn: number | null;
  /** Eau retenue par le pot juste après arrosage (estimation) et perte de poids à attendre. */
  heldWaterOz: number;
  weightLossOz: number;
  warnings: string[];
}

const LABELS = {
  material: { terracotta: 'Unglazed terracotta (porous)', plastic: 'Plastic', glazed: 'Glazed ceramic' },
  light: { low: 'Low light', medium: 'Medium light', 'bright-indirect': 'Bright indirect light', 'direct-sun': 'Some direct sun' },
  season: { spring: 'Spring', summer: 'Summer', fall: 'Fall', winter: 'Winter rest' },
  humidity: { dry: 'Dry air (under 30%)', average: 'Average air (30 to 50%)', humid: 'Humid air (over 50%)' },
  substrate: { standard: 'Standard potting mix', chunky: 'Chunky aroid mix', gritty: 'Gritty cactus mix', bark: 'Orchid bark', 'moisture-retentive': 'Peat or coir-heavy mix' },
} as const;

export function wateringSchedule(i: WateringInput): WateringResult {
  const factors: Array<{ label: string; mult: number }> = [
    { label: `Pot ${Math.round(i.potDiameterIn)} in`, mult: potFactor(i.potDiameterIn) },
    { label: LABELS.material[i.material], mult: MULT.material[i.material] },
    { label: LABELS.light[i.light], mult: MULT.light[i.light] },
    { label: LABELS.season[i.season], mult: MULT.season[i.season] },
    { label: LABELS.humidity[i.humidity], mult: MULT.humidity[i.humidity] },
    { label: LABELS.substrate[i.substrate], mult: MULT.substrate[i.substrate] },
  ];
  if (!i.drainage) factors.push({ label: 'No drainage hole', mult: MULT.noDrainage });
  const totalMult = factors.reduce((a, f) => a * f.mult, 1);
  const [b0, b1] = BASE_DAYS[i.rule];
  const lo = Math.max(1, Math.round(b0 * totalMult));
  const hi = Math.max(lo + 1, Math.round(b1 * totalMult));

  const vol = potVolumeCubicIn(i.potDiameterIn) * ML_PER_CUBIC_IN;
  // Avec drainage : verser jusqu'à ce que l'eau ressorte, soit environ 20 à 30 % du volume du pot
  // (Clemson : arroser jusqu'à l'écoulement). Sans drainage : 10 à 15 %, et jamais d'eau stagnante.
  const share: [number, number] = i.drainage ? [0.2, 0.3] : [0.1, 0.15];
  const volumeMl: [number, number] = [Math.round(vol * share[0]), Math.round(vol * share[1])];
  // Un terreau ressuyé retient environ 40 % de son volume en eau (substrat sableux ou écorce : moins).
  const holdShare = i.substrate === 'gritty' || i.substrate === 'bark' ? 0.25 : i.substrate === 'chunky' ? 0.32 : i.substrate === 'moisture-retentive' ? 0.5 : 0.4;
  const heldWaterOz = (vol * holdShare) / G_PER_OZ; // 1 mL d'eau ≈ 1 g
  const warnings: string[] = [];
  if (!i.drainage) warnings.push('Without a drainage hole, water collects at the bottom where you cannot see it. Pour sparingly and tip out any excess, or use a plastic nursery pot inside the decorative one.');
  if (i.season === 'winter' && (i.rule === 'fully-dry')) warnings.push('In winter rest, desert plants can go much longer than this range. When in doubt, wait a week.');
  if (i.light === 'direct-sun' && i.rule === 'evenly-moist') warnings.push('A moisture-loving plant in direct sun can dry out in a day or two in summer. Check daily during hot spells.');
  return {
    days: [lo, hi], checkFromDay: Math.max(1, lo - 1), factors, totalMult,
    volumeMl, volumeCups: [volumeMl[0] / ML_PER_CUP, volumeMl[1] / ML_PER_CUP],
    fingerDepthIn: FINGER_DEPTH_IN[i.rule], heldWaterOz, weightLossOz: heldWaterOz * WEIGHT_LOSS_SHARE[i.rule], warnings,
  };
}

/** Texte du test au doigt adapté à la règle et au pot. */
export function fingerTest(rule: DryRule, potDiameterIn: number): string {
  const d = FINGER_DEPTH_IN[rule];
  if (rule === 'bark-dry') return 'Water when the bark feels nearly dry and the roots look silvery rather than green.';
  if (d === null) return rule === 'half-dry'
    ? `Water when the top half of the pot, about ${Math.max(1, Math.round(potDiameterIn / 2))} in, is dry. Use a wooden skewer: it comes out clean when dry.`
    : 'Water only when the mix is dry all the way to the bottom. A wooden skewer pushed to the base should come out clean and dry.';
  if (d < 1) return 'Water when the surface just starts to feel dry; do not let the pot dry out completely.';
  return `Push a finger ${d === 1 ? 'to the first knuckle, about 1 in' : 'to the second knuckle, about 2 in'}: water when it feels dry at that depth.`;
}
