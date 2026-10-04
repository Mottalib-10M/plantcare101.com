/**
 * Diagnostic : un symptôme → les causes probables, classées, tirées des tableaux « problèmes » des
 * fiches plantes (symptôme → cause → remède, chacun sourcé dans sa fiche). Aucun savoir caché : un
 * symptôme qu'aucune fiche ne documente ne sort aucune cause.
 *
 * Score d'une cause = nombre de fiches qui l'associent à ce symptôme, ×3 pour la plante choisie,
 * corrigé par l'état du terreau que l'utilisateur constate (terreau détrempé : les causes liées à
 * l'excès d'eau ×2, la sécheresse ×0,3 ; terreau sec : l'inverse).
 */
import type { Plant } from '../plant-schema';

type Problem = Plant['problems'][number];
export type Soil = 'wet' | 'dry' | 'unknown';

const WET_CAUSES = new Set(['overwatering', 'poor-drainage', 'disease']);
const DRY_CAUSES = new Set(['underwatering', 'low-humidity', 'heat']);

export interface Diagnosis {
  causeKey: Problem['causeKey'];
  cause: string;
  remedy: string;
  score: number;
  share: number;
  plants: string[];
}

export function diagnose(plants: Plant[], symptomKey: Problem['symptomKey'], opts: { plant?: string; soil?: Soil } = {}): Diagnosis[] {
  const by = new Map<string, { score: number; entries: Array<{ p: Plant; pr: Problem }> }>();
  for (const p of plants) for (const pr of p.problems) {
    if (pr.symptomKey !== symptomKey) continue;
    const e = by.get(pr.causeKey) ?? { score: 0, entries: [] };
    e.score += p.slug === opts.plant ? 3 : 1;
    e.entries.push({ p, pr });
    by.set(pr.causeKey, e);
  }
  const soil = opts.soil ?? 'unknown';
  const out: Diagnosis[] = [];
  for (const [causeKey, e] of by) {
    let s = e.score;
    if (soil === 'wet') s *= WET_CAUSES.has(causeKey) ? 2 : DRY_CAUSES.has(causeKey) ? 0.3 : 1;
    if (soil === 'dry') s *= DRY_CAUSES.has(causeKey) ? 2 : WET_CAUSES.has(causeKey) ? 0.3 : 1;
    const own = e.entries.find((x) => x.p.slug === opts.plant) ?? e.entries[0];
    out.push({ causeKey: causeKey as Problem['causeKey'], cause: own.pr.cause, remedy: own.pr.remedy, score: s, share: 0, plants: [...new Set(e.entries.map((x) => x.p.slug))] });
  }
  const total = out.reduce((a, d) => a + d.score, 0) || 1;
  for (const d of out) d.share = d.score / total;
  return out.sort((a, b) => b.score - a.score || a.causeKey.localeCompare(b.causeKey));
}

/** Symptômes réellement documentés par au moins une fiche (alimente la liste de l'outil). */
export function documentedSymptoms(plants: Plant[]): Array<{ key: Problem['symptomKey']; count: number }> {
  const c = new Map<Problem['symptomKey'], number>();
  for (const p of plants) for (const pr of new Set(p.problems.map((x) => x.symptomKey))) c.set(pr, (c.get(pr) ?? 0) + 1);
  return [...c].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}
