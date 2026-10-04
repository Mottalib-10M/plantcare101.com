/**
 * Modèle d'une fiche plante : un fichier `src/data/plants/<slug>.json` par plante.
 *
 * Le schéma refuse un fichier incomplet. Le build échoue (lib/plants.ts appelle `parsePlant` sur
 * chaque fichier), et `npx vitest run` aussi (tests/plants.test.ts). Une étape suivante ajoute une
 * plante en déposant un JSON : pages, maillage, sitemap, index, hubs et outils la prennent seuls.
 *
 * Règles de contenu (CONTRIBUTING-PLANTS.md) : chaque chiffre de soins vient d'une source lue,
 * citée dans `sources`, et chaque bloc de soins dit lesquelles par `src` (index dans `sources`).
 * Un chiffre incertain ne se publie pas : les champs numériques facultatifs restent absents.
 */
import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date ISO AAAA-MM-JJ');
const range = z.tuple([z.number(), z.number()]).refine(([a, b]) => a <= b, 'fourchette inversée');
const srcRefs = z.array(z.number().int().nonnegative()).min(1, 'au moins une source (index dans sources)');
const para = z.string().min(60, 'paragraphe trop court');
const words = (s: string) => s.trim().split(/\s+/).length;

/** Niveaux de lumière, définis par l'Illinois Extension (foot-candles). */
export const LIGHT_LEVELS = ['low', 'medium', 'high', 'direct'] as const;
export const LIGHT_LEVEL_FC: Record<(typeof LIGHT_LEVELS)[number], number> = { low: 75, medium: 150, high: 300, direct: 1500 };
export const LUX_PER_FC = 10.764;

/** Règles de séchage entre deux arrosages. */
export const DRY_RULES = ['evenly-moist', 'top-inch', 'top-2-inches', 'half-dry', 'fully-dry', 'bark-dry'] as const;

export const SYMPTOMS = [
  'yellow-leaves', 'brown-tips', 'brown-spots', 'crispy-edges', 'drooping', 'leaf-drop', 'mushy-stem',
  'curling-leaves', 'pale-leaves', 'leggy-growth', 'no-flowers', 'bud-drop', 'webbing', 'white-cotton',
  'sticky-leaves', 'small-flies', 'wrinkled-leaves', 'white-crust', 'root-rot', 'slow-growth',
] as const;
export const CAUSES = [
  'overwatering', 'underwatering', 'low-light', 'too-much-sun', 'low-humidity', 'cold', 'heat',
  'fertilizer-salts', 'water-quality', 'pests', 'root-bound', 'natural-aging', 'poor-drainage',
  'disease', 'repotting-shock', 'dormancy', 'nutrient-deficiency', 'drafts',
] as const;
export const ROOT_TYPES = ['fibrous', 'thick-fleshy', 'rhizome', 'succulent', 'epiphytic', 'woody'] as const;
const tox = z.enum(['toxic', 'non-toxic']);

const source = z.object({
  title: z.string().min(5),
  publisher: z.string().min(3),
  url: z.string().url().startsWith('https://'),
  accessed: isoDate,
});

const faq = z.object({
  q: z.string().min(15).refine((q) => q.trim().endsWith('?'), 'une question finit par « ? »'),
  a: z.string().refine((a) => words(a) >= 40 && words(a) <= 90, 'réponse de FAQ : 40 à 90 mots (RECETTE §7)'),
});

export const plantSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  commonName: z.string().min(3),
  otherNames: z.array(z.string()),
  botanicalName: z.string().min(3),
  formerNames: z.array(z.string()).default([]),
  family: z.string().min(3),
  kind: z.enum(['foliage', 'succulent', 'cactus', 'flowering', 'bonsai', 'shrub']),
  /** Fiche de groupe (succulentes, bonsaï) : plusieurs genres sous une même page. */
  isGroup: z.boolean().default(false),

  light: z.object({
    minLevel: z.enum(LIGHT_LEVELS),
    idealLevel: z.enum(LIGHT_LEVELS),
    maxLevel: z.enum(LIGHT_LEVELS),
    fc: range,
    lux: range,
    windows: z.array(z.enum(['north', 'east', 'south', 'west'])).min(1),
    directSun: z.enum(['avoid', 'morning-only', 'tolerates', 'needs']),
    src: srcRefs,
  }).superRefine((l, ctx) => {
    const i = (x: string) => LIGHT_LEVELS.indexOf(x as never);
    if (!(i(l.minLevel) <= i(l.idealLevel) && i(l.idealLevel) <= i(l.maxLevel))) ctx.addIssue({ code: 'custom', message: 'minLevel ≤ idealLevel ≤ maxLevel' });
    for (const k of [0, 1] as const) if (Math.abs(l.lux[k] - l.fc[k] * LUX_PER_FC) > l.fc[k] * LUX_PER_FC * 0.03) ctx.addIssue({ code: 'custom', message: `lux[${k}] doit valoir fc × 10,764 (± 3 %)` });
  }),

  water: z.object({
    rule: z.enum(DRY_RULES),
    ruleText: z.string().min(10),
    winter: z.string().min(10),
    factors: z.array(z.string().min(10)).min(1),
    src: srcRefs,
  }),

  soil: z.object({
    mix: z.string().min(10),
    components: z.array(z.string()).min(1),
    ph: range.optional(),
    src: srcRefs,
  }),

  humidity: z.object({
    level: z.enum(['low', 'average', 'high']),
    idealPct: range.optional(),
    note: z.string().min(10),
    src: srcRefs,
  }),

  temperature: z.object({
    idealF: range.optional(),
    idealC: range.optional(),
    minF: z.number(),
    minC: z.number(),
    maxF: z.number().optional(),
    maxC: z.number().optional(),
    src: srcRefs,
  }).superRefine((t, ctx) => {
    const c = (f: number) => (f - 32) * 5 / 9;
    const near = (f: number, cv: number) => Math.abs(c(f) - cv) <= 1;
    if (!near(t.minF, t.minC)) ctx.addIssue({ code: 'custom', message: 'minC ≠ minF converti' });
    if ((t.maxF === undefined) !== (t.maxC === undefined) || (t.maxF !== undefined && !near(t.maxF, t.maxC!))) ctx.addIssue({ code: 'custom', message: 'maxF/maxC incohérents' });
    if ((t.idealF === undefined) !== (t.idealC === undefined) || (t.idealF && !(near(t.idealF[0], t.idealC![0]) && near(t.idealF[1], t.idealC![1])))) ctx.addIssue({ code: 'custom', message: 'idealF/idealC incohérents' });
  }),

  fertilizer: z.object({
    season: z.string().min(5),
    everyWeeks: range,
    strength: z.enum(['full', 'half', 'quarter']),
    type: z.string().min(5),
    winter: z.enum(['none', 'reduced']),
    src: srcRefs,
  }),

  repotting: z.object({
    /** Facultatif : seulement si une source donne une fréquence pour cette plante. */
    everyYears: range.optional(),
    signs: z.array(z.string().min(5)).min(2),
    season: z.string().min(4),
    rootType: z.enum(ROOT_TYPES),
    prefersSnug: z.boolean(),
    src: srcRefs,
  }),

  toxicity: z.object({
    /** `unknown` : ni fiche ASPCA ni source qui classe la plante ; jamais compté comme sûr pour les animaux. */
    cats: z.enum(['toxic', 'non-toxic', 'varies', 'unknown']),
    dogs: z.enum(['toxic', 'non-toxic', 'varies', 'unknown']),
    humans: z.enum(['toxic', 'mildly-toxic', 'non-toxic', 'unknown']),
    humanNote: z.string().min(10),
    /** false seulement quand la plante n'a pas de fiche ASPCA (vérifié dans les listes chats et
     *  chiens) : la toxicité vient alors d'une autre source citée, et la page le dit. */
    aspcaListed: z.boolean(),
    /** Une entrée par fiche ASPCA lue (plusieurs pour une fiche de groupe). */
    aspca: z.array(z.object({
      name: z.string().min(3),
      cats: tox,
      dogs: tox,
      url: z.string().url().startsWith('https://www.aspca.org/'),
      toxicPrinciples: z.string().optional(),
      clinicalSigns: z.string().optional(),
    })),
    src: srcRefs,
  }).refine((t) => !t.aspcaListed || t.aspca.length > 0, 'aspcaListed : au moins une fiche ASPCA'),

  problems: z.array(z.object({
    symptomKey: z.enum(SYMPTOMS),
    symptom: z.string().min(8),
    causeKey: z.enum(CAUSES),
    cause: z.string().min(8),
    remedy: z.string().min(15),
  })).min(4),

  propagation: z.object({ methods: z.array(z.string()).min(1), season: z.string().min(4) }),
  /** heightIn absent quand la hauteur n'a pas de sens ou de source (liane retombante, bonsaï taillé) :
   *  `note` dit alors ce qu'il faut savoir sur la taille, avec sa source. */
  size: z.object({ heightIn: range.optional(), widthIn: range.optional(), growth: z.enum(['slow', 'moderate', 'fast']).optional(), note: z.string().min(10).optional(), src: srcRefs })
    .refine((x) => x.heightIn || x.note, 'size : heightIn ou note'),
  varieties: z.array(z.object({ name: z.string().min(2), note: z.string().min(8) })).default([]),
  sources: z.array(source).min(2),
  verified: isoDate,
  related: z.array(z.string()).optional(),

  seo: z.object({
    title: z.string().refine((t) => t.length >= 50 && t.length <= 60, 'titre : 50 à 60 caractères (RECETTE §11)'),
    description: z.string().refine((d) => d.length >= 150 && d.length <= 160, 'description : 150 à 160 caractères (RECETTE §11)'),
    h1: z.string().min(10),
  }),
  content: z.object({
    answer: z.string().refine((a) => words(a) >= 30 && words(a) <= 55, 'réponse de tête : environ 40 mots (30 à 55)'),
    intro: z.string().refine((a) => words(a) >= 125, 'chapeau citable : 125 mots ou plus, un seul paragraphe (RECETTE §21)'),
    light: z.array(para).min(1),
    water: z.array(para).min(2),
    soil: z.array(para).min(1),
    humidity: z.array(para).min(1),
    temperature: z.array(para).min(1),
    fertilizer: z.array(para).min(1),
    repotting: z.array(para).min(1),
    propagation: z.array(para).min(1),
    problems: z.array(para).min(1),
    petSafety: z.array(para).min(1),
    faq: z.array(faq).min(4).max(6),
  }),
}).superRefine((p, ctx) => {
  const n = p.sources.length;
  for (const k of ['light', 'water', 'soil', 'humidity', 'temperature', 'fertilizer', 'repotting', 'toxicity', 'size'] as const)
    for (const i of p[k].src) if (i >= n) ctx.addIssue({ code: 'custom', path: [k, 'src'], message: `source ${i} inexistante` });
  if (!p.sources.some((s) => s.url.startsWith('https://www.aspca.org/'))) ctx.addIssue({ code: 'custom', path: ['sources'], message: 'la fiche ASPCA doit figurer dans sources' });
  const prose = Object.entries(p.content).filter(([k]) => k !== 'faq' && k !== 'answer')
    .flatMap(([, v]) => (Array.isArray(v) ? v : [v])).join(' ');
  if (words(prose) < 950) ctx.addIssue({ code: 'custom', path: ['content'], message: `prose propre à la plante : ${words(prose)} mots, 950 au minimum` });
});

export type Plant = z.infer<typeof plantSchema>;

export function parsePlant(data: unknown, file = '?'): Plant {
  const r = plantSchema.safeParse(data);
  if (!r.success) {
    const msg = r.error.issues.map((i) => `  - ${i.path.join('.') || '(racine)'} : ${i.message}`).join('\n');
    throw new Error(`Fiche plante invalide ${file} :\n${msg}`);
  }
  return r.data;
}
