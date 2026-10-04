/**
 * Moteurs des guides de problèmes. Chaque règle reprend une cause nommée par une source :
 *  - Clemson HGIC « Houseplant Diseases & Disorders » : pointes brunes = air chaud et sec, arrosage
 *    inadapté, piqûres d'insectes, accumulation de sels (croûte blanche) ; certaines plantes sont
 *    sensibles au fluor et au chlore de l'eau du robinet ; jaunissement surtout par excès d'eau ;
 *    racines majoritairement noires et molles : mieux vaut jeter la plante ; quelques racines
 *    atteintes : les couper et rempoter en terreau sain.
 *  - Clemson HGIC « Common Houseplant Insects & Related Pests » : isoler, coton imbibé d'alcool
 *    (cochenilles farineuses), jets d'eau et savon insecticide une fois par semaine pendant plusieurs
 *    semaines (acariens), laisser sécher le terreau et vider les soucoupes (mouches des terreaux),
 *    quarantaine de six semaines pour une plante neuve.
 *  - UF/IFAS Gardening Solutions : l'eau adoucie apporte des sels ; drainer à fond périodiquement.
 * Les poids des scores sont des choix du site (ordre de priorité), pas des mesures : l'outil classe
 * des causes plausibles, il ne pose pas de diagnostic certain.
 */

/* ---------- Pointes brunes ---------- */
export interface BrownTipsInput {
  air: 'dry' | 'average' | 'humid';
  water: 'tap' | 'softened' | 'filtered';
  monthsSinceFlush: number;
  feedEveryWeeks: number; // 0 = jamais
  habit: 'bone-dry' | 'regular' | 'soggy';
  whiteCrust: boolean;
  fluorideSensitive: boolean;
}
export type BrownCause = 'salts' | 'low-humidity' | 'water-quality' | 'underwatering' | 'overwatering';
export function brownTips(i: BrownTipsInput): Array<{ cause: BrownCause; score: number }> {
  const s: Record<BrownCause, number> = { salts: 0, 'low-humidity': 0, 'water-quality': 0, underwatering: 0, overwatering: 0 };
  if (i.whiteCrust) s.salts += 4;
  if (i.monthsSinceFlush >= 6) s.salts += 2; else if (i.monthsSinceFlush >= 4) s.salts += 1;
  if (i.feedEveryWeeks > 0 && i.feedEveryWeeks < 4) s.salts += 2;
  if (i.water === 'softened') { s.salts += 2; s['water-quality'] += 2; }
  if (i.water === 'tap' && i.fluorideSensitive) s['water-quality'] += 3;
  if (i.air === 'dry') s['low-humidity'] += 3; else if (i.air === 'average') s['low-humidity'] += 1;
  if (i.habit === 'bone-dry') s.underwatering += 3;
  if (i.habit === 'soggy') s.overwatering += 3;
  return (Object.entries(s) as Array<[BrownCause, number]>).filter(([, v]) => v > 0)
    .map(([cause, score]) => ({ cause, score })).sort((a, b) => b.score - a.score || a.cause.localeCompare(b.cause));
}

/* ---------- Trop ou pas assez d'eau ---------- */
export interface OverUnderInput {
  soil: 'wet' | 'damp' | 'dry';
  leaves: 'soft-limp' | 'crispy' | 'normal';
  lowerYellow: boolean;
  smell: boolean;
  potWeight: 'heavy' | 'light' | 'unsure';
}
export interface OverUnderResult { verdict: 'overwatered' | 'underwatered' | 'unclear'; over: number; under: number; confidence: 'high' | 'medium' | 'low' }
export function overUnder(i: OverUnderInput): OverUnderResult {
  let over = 0, under = 0;
  if (i.soil === 'wet') over += 3; else if (i.soil === 'dry') under += 3; else over += 1;
  if (i.leaves === 'soft-limp') over += 2; else if (i.leaves === 'crispy') under += 2;
  if (i.lowerYellow) over += 1;
  if (i.smell) over += 3;
  if (i.potWeight === 'heavy') over += 2; else if (i.potWeight === 'light') under += 2;
  const gap = Math.abs(over - under);
  const verdict = gap < 2 ? 'unclear' : over > under ? 'overwatered' : 'underwatered';
  return { verdict, over, under, confidence: gap >= 6 ? 'high' : gap >= 3 ? 'medium' : 'low' };
}

/* ---------- Pourriture des racines ---------- */
export interface RootRotInput { rottenPct: number; healthyStems: boolean; potIn: number }
export interface RootRotPlan { action: 'trim-repot' | 'trim-repot-smaller' | 'propagate' | 'discard'; newPotIn: number; steps: string[] }
export function rootRotPlan(i: RootRotInput): RootRotPlan {
  const pct = Math.min(Math.max(i.rottenPct, 0), 100);
  const pot = Math.min(Math.max(Math.round(i.potIn), 2), 24);
  if (pct <= 25) return { action: 'trim-repot', newPotIn: pot, steps: [
    'Cut every brown, soft root back to firm white tissue with clean shears.',
    'Wash the old pot and soak it in one part bleach to nine parts water, or use a new pot.',
    'Repot in fresh, sterile potting mix; do not reuse the old mix.',
    'Water once lightly, then wait until the mix dries to the plant\'s usual depth.'] };
  if (pct <= 75) return { action: 'trim-repot-smaller', newPotIn: Math.max(2, pot - 2), steps: [
    'Cut away all rotten roots; what remains needs a pot that matches it, so go 1 to 2 in smaller.',
    'Trim some foliage so the reduced roots can supply the leaves that are left.',
    'Take two or three stem cuttings as insurance in case the parent fails.',
    'Repot in fresh sterile mix and keep the plant in bright indirect light, not direct sun, while it recovers.'] };
  return i.healthyStems
    ? { action: 'propagate', newPotIn: 4, steps: [
      'With most roots dead, the plant is unlikely to recover; Clemson HGIC advises discarding it.',
      'Before you do, cut healthy, firm stem or leaf pieces well above any dark tissue.',
      'Root them in water or barely damp mix in a small 3 to 4 in pot.',
      'Throw away the old mix and disinfect the pot before reusing it.'] }
    : { action: 'discard', newPotIn: 0, steps: [
      'When most roots are dark, soft and dead and no firm stem remains, the plant will not come back.',
      'Discard the plant and its mix, and disinfect the pot with one part bleach to nine parts water.',
      'Next time, water only when the mix has dried to the plant\'s depth and empty the saucer.'] };
}

/* ---------- Ravageurs ---------- */
export type Pest = 'spider-mites' | 'fungus-gnats' | 'mealybugs';
export interface PestStep { week: number; action: string }
export function pestPlan(pest: Pest, severity: 'light' | 'heavy'): PestStep[] {
  const weeks = severity === 'heavy' ? 4 : 3;
  const out: PestStep[] = [{ week: 0, action: 'Move the plant away from your other plants and keep it isolated until no pests are seen for two weeks.' }];
  for (let w = 1; w <= weeks; w++) {
    if (pest === 'spider-mites') out.push({ week: w, action: w === 1 ? 'Spray the whole plant forcefully with lukewarm water, undersides first, then apply insecticidal soap until it drips.' : 'Repeat the water spray and insecticidal soap; check leaf undersides with a magnifier.' });
    if (pest === 'mealybugs') out.push({ week: w, action: w === 1 ? 'Wipe every cottony cluster with a cotton swab dipped in rubbing alcohol, including leaf axils, then spray insecticidal soap.' : 'Inspect leaf axils and undersides; swab any new cluster and repeat the soap spray.' });
    if (pest === 'fungus-gnats') out.push({ week: w, action: w === 1 ? 'Let the top of the mix dry out between waterings and empty saucers: dry soil kills the larvae.' : 'Keep the surface dry; a Bacillus thuringiensis israelensis (BTI) product watered in also controls larvae.' });
  }
  if (severity === 'heavy' && pest === 'mealybugs') out.push({ week: weeks + 1, action: 'If clusters keep returning, Clemson HGIC notes a heavy infestation may mean discarding the plant.' });
  return out;
}
