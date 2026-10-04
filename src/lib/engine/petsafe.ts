/**
 * Vérificateur « plante sans danger pour chats et chiens » : recherche dans les listes ASPCA
 * (src/data/aspca-plants.json, produit par scripts/build-aspca.py). Le statut affiché est celui de
 * l'ASPCA, mot pour mot ; une plante absente des listes est dite absente, jamais « sûre ».
 */
export interface AspcaRow { s: string; n: string; a: string; sci: string; f: string; c: 'toxic' | 'non-toxic' | null; d: 'toxic' | 'non-toxic' | null }

export const ASPCA_BASE = 'https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/';
export const aspcaUrl = (slug: string) => `${ASPCA_BASE}${slug}`;

export function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

export interface Match { row: AspcaRow; score: number; matched: 'name' | 'other name' | 'scientific name' }

/** Classe les entrées : nom exact > nom commençant par la requête > mot du nom > autre nom > nom scientifique. */
export function searchAspca(rows: AspcaRow[], query: string, limit = 12): Match[] {
  const q = norm(query);
  if (q.length < 2) return [];
  const words = q.split(' ');
  const has = (hay: string) => words.every((w) => hay.split(' ').some((h) => h.startsWith(w)));
  const out: Match[] = [];
  for (const row of rows) {
    const n = norm(row.n), a = norm(row.a), sci = norm(row.sci);
    let score = 0; let matched: Match['matched'] = 'name';
    if (n === q) score = 100;
    else if (n.startsWith(q)) score = 80;
    else if (has(n)) score = 60;
    else if (has(a)) { score = 40; matched = 'other name'; }
    else if (has(sci) || sci.startsWith(q)) { score = 30; matched = 'scientific name'; }
    if (score) out.push({ row, score: score - n.length / 100, matched });
  }
  return out.sort((x, y) => y.score - x.score || x.row.n.localeCompare(y.row.n)).slice(0, limit);
}

export type Verdict = 'safe-both' | 'toxic-both' | 'toxic-cats' | 'toxic-dogs' | 'partial';
export function verdict(row: AspcaRow): Verdict {
  if (row.c === 'non-toxic' && row.d === 'non-toxic') return 'safe-both';
  if (row.c === 'toxic' && row.d === 'toxic') return 'toxic-both';
  if (row.c === 'toxic' && row.d === 'non-toxic') return 'toxic-cats';
  if (row.d === 'toxic' && row.c === 'non-toxic') return 'toxic-dogs';
  return 'partial';
}
