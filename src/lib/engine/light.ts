/**
 * Lumière disponible à un endroit de la pièce, estimée en foot-candles.
 *
 * Points d'ancrage : Illinois Extension « Lighting » — lumière faible 75 fc (fenêtre nord à quelques
 * pieds, est/ouest à 3–10 ft, sud à 15–20 ft), moyenne 150 fc (devant une fenêtre nord, à quelques
 * pieds d'une fenêtre est/ouest, à 3–10 ft d'une fenêtre sud), forte 300 fc (devant une fenêtre
 * est/ouest, jusqu'à 5 ft d'une fenêtre sud), directe 1 500 fc (devant une fenêtre sud).
 * Entre deux ancrages : interpolation logarithmique. Au-delà du dernier ancrage, prolongement du
 * modèle (présenté comme tel). Voilage et ombre extérieure (arbre, auvent, immeuble) : ×0,5 chacun,
 * ordre de grandeur, Clemson HGIC citant rideaux et ombrage des arbres parmi ce qui change la lumière.
 * Hémisphère nord. Un luxmètre (application de téléphone) remplace avantageusement l'estimation.
 */
import { LIGHT_LEVEL_FC, LUX_PER_FC, type Plant } from '../plant-schema';

export type Window = 'north' | 'east' | 'west' | 'south';
export type Obstruction = 'none' | 'sheer' | 'shade' | 'both';
export type Level = 'too-dark' | 'low' | 'medium' | 'high' | 'direct';

export const ANCHORS: Record<Window, Array<[number, number]>> = {
  north: [[0, 150], [3, 75], [10, 35]],
  east: [[0, 300], [3, 150], [8, 75], [16, 40]],
  west: [[0, 300], [3, 150], [8, 75], [16, 40]],
  south: [[0, 1500], [2, 600], [5, 300], [10, 150], [18, 75], [25, 45]],
};
export const OBSTRUCTION: Record<Obstruction, number> = { none: 1, sheer: 0.5, shade: 0.5, both: 0.25 };

function interp(points: Array<[number, number]>, d: number): number {
  if (d <= points[0][0]) return points[0][1];
  for (let k = 1; k < points.length; k++) {
    const [x0, y0] = points[k - 1], [x1, y1] = points[k];
    if (d <= x1) {
      const t = (d - x0) / (x1 - x0);
      return Math.exp(Math.log(y0) + t * (Math.log(y1) - Math.log(y0)));
    }
  }
  // prolongement : même pente logarithmique que le dernier segment
  const [x0, y0] = points[points.length - 2], [x1, y1] = points[points.length - 1];
  const slope = (Math.log(y1) - Math.log(y0)) / (x1 - x0);
  return Math.max(10, Math.exp(Math.log(y1) + slope * (d - x1)));
}

export function levelOf(fc: number): Level {
  if (fc < 60) return 'too-dark';
  if (fc < 112) return 'low';
  if (fc < 225) return 'medium';
  if (fc < 900) return 'high';
  return 'direct';
}

export interface LightResult { fc: number; fcRange: [number, number]; lux: number; level: Level; extrapolated: boolean }

export function lightAt(window: Window, distanceFt: number, obstruction: Obstruction): LightResult {
  const d = Math.min(Math.max(distanceFt, 0), 40);
  const pts = ANCHORS[window];
  const fc = Math.round(interp(pts, d) * OBSTRUCTION[obstruction]);
  return { fc, fcRange: [Math.round(fc * 0.7), Math.round(fc * 1.3)], lux: Math.round(fc * LUX_PER_FC), level: levelOf(fc), extrapolated: d > pts[pts.length - 1][0] };
}

export type Fit = 'too-dark' | 'survives' | 'good' | 'too-bright';

/** Compare la lumière estimée aux besoins de la plante (fiche : fc, idealLevel, directSun). */
export function lightFit(fc: number, p: Pick<Plant, 'light'>): Fit {
  const l = p.light;
  if (fc < l.fc[0] * 0.8) return 'too-dark';
  if (fc > l.fc[1] * 1.25 || (l.directSun === 'avoid' && fc >= 900)) return 'too-bright';
  if (fc >= LIGHT_LEVEL_FC[l.idealLevel] * 0.75) return 'good';
  return 'survives';
}
