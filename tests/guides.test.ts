import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseGuide, guideSchema } from '../src/lib/guide-schema';

const dir = join(__dirname, '..', 'src', 'data', 'guides');
const pdir = join(__dirname, '..', 'src', 'data', 'plants');
// GUIDE_FILES=a.json,b.json : ne valider que ces guides (rédaction en parallèle).
const only = process.env.GUIDE_FILES?.split(',').map((x) => x.trim());
const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json') && (!only || only.includes(f))) : [];
const guides = files.map((f) => ({ f, g: parseGuide(JSON.parse(readFileSync(join(dir, f), 'utf8')), f) }));
const plantSlugs = readdirSync(pdir).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));

describe('guides', () => {
  for (const { f, g } of guides) {
    it(`${f} : slug, plantes liées existantes`, () => {
      expect(`${g.slug}.json`).toBe(f);
      for (const s of g.relatedPlants) expect(plantSlugs, `plante liée inconnue ${s}`).toContain(s);
    });
  }
  it('titres, descriptions et questions uniques, y compris face aux fiches plantes', () => {
    const seen = new Map<string, string>();
    for (const f of readdirSync(pdir).filter((x) => x.endsWith('.json'))) {
      const p = JSON.parse(readFileSync(join(pdir, f), 'utf8'));
      for (const k of [p.seo?.title, p.seo?.description, ...(p.content?.faq ?? []).map((x: { q: string }) => x.q.toLowerCase())]) if (k) seen.set(k, f);
    }
    for (const { f, g } of guides) for (const k of [g.seo.title, g.seo.description, ...g.faq.map((x) => x.q.toLowerCase())]) {
      expect(seen.get(k), `« ${k} » répété dans ${f} et ${seen.get(k)}`).toBeUndefined(); seen.set(k, f);
    }
  });
  it('un guide incomplet est refusé', () => {
    expect(guideSchema.safeParse({ slug: 'x' }).success).toBe(false);
    expect(() => parseGuide({}, 'x.json')).toThrow(/Guide invalide/);
  });
});
