/**
 * Taille du pot au rempotage.
 *
 * Règle : Clemson HGIC « Indoor Plants – Transplanting & Repotting » : un pot de 1 ou 2 in plus large
 * que l'actuel. On prend +1 in pour les petits pots (≤ 6 in) et pour les plantes qui aiment être à
 * l'étroit (succulentes, épiphytes, fiche `prefersSnug`), +1 à 2 in au-delà, +2 in à partir de 10 in.
 * UF/IFAS Gardening Solutions : une plante qui n'est pas à l'étroit peut être rempotée dans le même
 * pot avec du terreau neuf.
 */
import { potVolumeCubicIn, ML_PER_CUBIC_IN } from './watering';
import type { Plant } from '../plant-schema';

export type RootType = Plant['repotting']['rootType'];

export interface PotInput { currentIn: number; rootType: RootType; prefersSnug: boolean; rootbound: boolean }
export interface PotResult {
  /** Diamètres conseillés (in). Égal au diamètre actuel quand la plante n'est pas à l'étroit. */
  newIn: [number, number];
  sameSize: boolean;
  /** Terreau à ajouter, en quarts US, pour la fourchette de pots. */
  addQuarts: [number, number];
  volumeIncreasePct: [number, number];
  reason: string;
}

const QUART_ML = 946.353;

export function nextPot(i: PotInput): PotResult {
  const cur = Math.min(Math.max(Math.round(i.currentIn * 2) / 2, 2), 24);
  if (!i.rootbound) {
    return { newIn: [cur, cur], sameSize: true, addQuarts: [0, 0], volumeIncreasePct: [0, 0], reason: 'Roots are not crowded: refresh the mix in the same pot rather than going bigger.' };
  }
  const snug = i.prefersSnug || i.rootType === 'succulent' || i.rootType === 'epiphytic';
  let step: [number, number];
  let reason: string;
  if (snug) { step = [1, 1]; reason = 'This plant prefers a snug pot: go up 1 in only, so the mix dries between waterings.'; }
  else if (cur <= 6) { step = [1, 2]; reason = 'Small pot: 1 to 2 in wider, the Clemson HGIC rule.'; }
  else if (cur < 10) { step = [1, 2]; reason = 'Go 1 to 2 in wider; a much bigger pot holds wet mix the roots cannot reach.'; }
  else { step = [2, 2]; reason = 'Large pot: 2 in wider keeps the jump in soil volume reasonable.'; }
  const newIn: [number, number] = [cur + step[0], cur + step[1]];
  const v0 = potVolumeCubicIn(cur);
  const add = (d: number) => ((potVolumeCubicIn(d) - v0) * ML_PER_CUBIC_IN) / QUART_ML;
  const pct = (d: number) => Math.round((potVolumeCubicIn(d) / v0 - 1) * 100);
  return { newIn, sameSize: false, addQuarts: [add(newIn[0]), add(newIn[1])], volumeIncreasePct: [pct(newIn[0]), pct(newIn[1])], reason };
}
