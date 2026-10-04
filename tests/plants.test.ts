import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parsePlant, plantSchema } from '../src/lib/plant-schema';

const dir = join(__dirname, '..', 'src', 'data', 'plants');
// PLANT_FILES=a.json,b.json : ne valider que ces fiches (rédaction en parallèle).
const only = process.env.PLANT_FILES?.split(',').map((x) => x.trim());
const files = readdirSync(dir).filter((f) => f.endsWith('.json') && (!only || only.includes(f)));
const plants = files.map((f) => ({ f, p: parsePlant(JSON.parse(readFileSync(join(dir, f), 'utf8')), f) }));

describe('fiches plantes', () => {
  it('au moins une fiche', () => expect(files.length).toBeGreaterThan(0));
  for (const { f, p } of plants) it(`${f} : slug = nom de fichier`, () => expect(`${p.slug}.json`).toBe(f));
  it('titres, descriptions et questions de FAQ uniques', () => {
    const seen = new Map<string, string>();
    for (const { f, p } of plants) for (const k of [p.seo.title, p.seo.description, ...p.content.faq.map((x) => x.q.toLowerCase())]) {
      expect(seen.get(k), `${k} répété dans ${f} et ${seen.get(k)}`).toBeUndefined(); seen.set(k, f);
    }
  });
  it('un fichier incomplet est refusé', () => {
    const base = JSON.parse(readFileSync(join(dir, files[0]), 'utf8'));
    const sans = { ...base }; delete sans.toxicity;
    expect(plantSchema.safeParse(sans).success).toBe(false);
    const sansAspca = { ...base, toxicity: { ...base.toxicity, aspcaListed: true, aspca: [] } };
    expect(plantSchema.safeParse(sansAspca).success).toBe(false);
    const titreCourt = { ...base, seo: { ...base.seo, title: 'Too short' } };
    expect(plantSchema.safeParse(titreCourt).success).toBe(false);
    const sourceFantome = { ...base, light: { ...base.light, src: [99] } };
    expect(plantSchema.safeParse(sourceFantome).success).toBe(false);
    expect(() => parsePlant({ slug: 'x' }, 'x.json')).toThrow(/Fiche plante invalide/);
  });
});
