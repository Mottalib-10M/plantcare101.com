/**
 * Guides de problèmes : un fichier src/data/guides/<slug>.json par guide, page /guides/<slug>/.
 * Même logique que les fiches plantes : le build refuse un fichier incomplet, et le guide apparaît
 * seul dans les index, le menu, le pied de page et le sitemap.
 */
import { z } from 'zod';

const words = (s: string) => s.trim().split(/\s+/).length;
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const GUIDE_TOOLS = ['diagnosis', 'brown-tips', 'over-under', 'root-rot', 'pests', 'light', 'pot', 'watering'] as const;

export const guideSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  nav: z.string().min(4).max(40),
  seo: z.object({
    title: z.string().refine((t) => t.length >= 50 && t.length <= 60, 'titre : 50 à 60 caractères'),
    description: z.string().refine((d) => d.length >= 150 && d.length <= 160, 'description : 150 à 160 caractères'),
    h1: z.string().min(10),
  }),
  answer: z.string().refine((a) => words(a) >= 30 && words(a) <= 60, 'réponse de tête : 30 à 60 mots'),
  intro: z.string().refine((a) => words(a) >= 125, 'chapeau citable : 125 mots ou plus'),
  tool: z.object({
    kind: z.enum(GUIDE_TOOLS),
    title: z.string().min(10),
    /** Réglage initial de l'outil (symptôme pour le diagnostic, règle pour l'arrosage…). */
    preset: z.string().optional(),
  }),
  sections: z.array(z.object({
    h2: z.string().min(5),
    paras: z.array(z.string().min(40)).min(1),
    list: z.array(z.string().min(5)).optional(),
    table: z.object({ caption: z.string(), head: z.array(z.string()).min(2), rows: z.array(z.array(z.string())).min(2) }).optional(),
  })).min(4),
  faq: z.array(z.object({
    q: z.string().refine((q) => q.trim().endsWith('?')),
    a: z.string().refine((a) => words(a) >= 40 && words(a) <= 90, 'réponse de FAQ : 40 à 90 mots'),
  })).min(4).max(8),
  sources: z.array(z.object({ title: z.string(), publisher: z.string(), url: z.string().url().startsWith('https://'), accessed: isoDate })).min(2),
  relatedPlants: z.array(z.string()).default([]),
  relatedGuides: z.array(z.string()).default([]),
  verified: isoDate,
}).superRefine((g, ctx) => {
  const prose = [g.intro, ...g.sections.flatMap((s) => [...s.paras, ...(s.list ?? [])])].join(' ');
  if (words(prose) < 1050) ctx.addIssue({ code: 'custom', path: ['sections'], message: `prose : ${words(prose)} mots, 1 050 au minimum` });
});

export type Guide = z.infer<typeof guideSchema>;
export function parseGuide(data: unknown, file = '?'): Guide {
  const r = guideSchema.safeParse(data);
  if (!r.success) throw new Error(`Guide invalide ${file} :\n${r.error.issues.map((i) => `  - ${i.path.join('.')} : ${i.message}`).join('\n')}`);
  return r.data;
}
