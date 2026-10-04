/**
 * Toutes les fiches plantes, lues et validées au build. Déposer un fichier src/data/plants/<slug>.json
 * suffit : la page /plants/<slug>/, les index, les hubs, les outils, le maillage et le sitemap le
 * prennent. Un fichier incomplet fait échouer le build (parsePlant lève une erreur détaillée).
 * Ne pas importer ce module dans un composant hydraté : il embarquerait toutes les fiches.
 */
import { parsePlant, LIGHT_LEVELS, type Plant } from './plant-schema';

const files = import.meta.glob('../data/plants/*.json', { eager: true, import: 'default' });

export const PLANTS: Plant[] = Object.entries(files)
  .map(([file, data]) => {
    const p = parsePlant(data, file.split('/').pop());
    if (`${p.slug}.json` !== file.split('/').pop()) throw new Error(`${file} : le slug « ${p.slug} » ne correspond pas au nom du fichier`);
    return p;
  })
  .sort((a, b) => a.commonName.localeCompare(b.commonName));

export const plantPath = (slug: string) => `/plants/${slug}/`;
export function getPlant(slug: string): Plant {
  const p = PLANTS.find((x) => x.slug === slug);
  if (!p) throw new Error(`Plante inconnue : ${slug}`);
  return p;
}

/** Plantes liées : celles que la fiche désigne, puis même famille, puis même besoin de lumière,
 *  puis même règle d'arrosage. Toujours `n` plantes quand le site en compte assez. */
export function relatedPlants(p: Plant, n = 4): Plant[] {
  const others = PLANTS.filter((x) => x.slug !== p.slug);
  const score = (x: Plant) =>
    (p.related?.includes(x.slug) ? 100 : 0) + (x.family === p.family ? 20 : 0) +
    (x.light.idealLevel === p.light.idealLevel ? 8 : 0) + (x.water.rule === p.water.rule ? 4 : 0) +
    (x.kind === p.kind ? 2 : 0) - Math.abs(LIGHT_LEVELS.indexOf(x.light.minLevel) - LIGHT_LEVELS.indexOf(p.light.minLevel));
  return [...others].sort((a, b) => score(b) - score(a) || a.commonName.localeCompare(b.commonName)).slice(0, n);
}

/** Raison affichée sous un lien de plante liée. */
export function relationReason(p: Plant, x: Plant): string {
  if (x.family === p.family) return `Same family (${x.family})`;
  if (x.light.idealLevel === p.light.idealLevel) return `Same light: ${x.light.idealLevel}`;
  if (x.water.rule === p.water.rule) return 'Same watering rule';
  return x.toxicity.cats === 'non-toxic' && x.toxicity.dogs === 'non-toxic' ? 'Pet-safe alternative' : 'Similar care';
}

/** Données réduites passées aux îlots (jamais les fiches entières). */
export const plantOptions = () => PLANTS.map((p) => ({ slug: p.slug, name: p.commonName, rule: p.water.rule }));

/** Props réduites des îlots outils. */
export const diagPlants = () => PLANTS.map((p) => ({ slug: p.slug, name: p.commonName, problems: p.problems.map((x) => ({ symptomKey: x.symptomKey, causeKey: x.causeKey, cause: x.cause, remedy: x.remedy })) }));
export const lightPlants = () => PLANTS.map((p) => ({ slug: p.slug, name: p.commonName, light: p.light, cats: p.toxicity.cats, dogs: p.toxicity.dogs }));
export const potPlants = () => PLANTS.map((p) => ({ slug: p.slug, name: p.commonName, rootType: p.repotting.rootType, prefersSnug: p.repotting.prefersSnug }));
export const SYMPTOM_LABEL: Record<string, string> = {
  'yellow-leaves': 'Yellow leaves', 'brown-tips': 'Brown leaf tips', 'brown-spots': 'Brown spots or patches', 'crispy-edges': 'Crispy, dry edges',
  drooping: 'Drooping or wilting', 'leaf-drop': 'Leaves falling off', 'mushy-stem': 'Soft, mushy stem or base', 'curling-leaves': 'Curling leaves',
  'pale-leaves': 'Pale or faded leaves', 'leggy-growth': 'Leggy, stretched growth', 'no-flowers': 'No flowers', 'bud-drop': 'Buds dropping',
  webbing: 'Fine webbing', 'white-cotton': 'White cottony spots', 'sticky-leaves': 'Sticky leaves', 'small-flies': 'Tiny flies around the pot',
  'wrinkled-leaves': 'Wrinkled or shriveled leaves', 'white-crust': 'White crust on soil or pot', 'root-rot': 'Brown, smelly roots', 'slow-growth': 'Slow or weak growth',
};
/** Symptômes documentés par au moins une fiche, du plus fréquent au plus rare. */
export function symptomOptions() {
  const count = new Map<string, number>();
  for (const p of PLANTS) for (const k of new Set(p.problems.map((x) => x.symptomKey))) count.set(k, (count.get(k) ?? 0) + 1);
  return [...count].sort((a, b) => b[1] - a[1]).map(([key]) => ({ key, label: SYMPTOM_LABEL[key] ?? key }));
}
export const filterPlants = () => PLANTS.map((p) => ({ slug: p.slug, name: p.commonName, botanical: p.botanicalName, minLevel: p.light.minLevel, idealLevel: p.light.idealLevel, maxLevel: p.light.maxLevel, rule: p.water.rule, cats: p.toxicity.cats, dogs: p.toxicity.dogs, kind: p.kind, humidity: p.humidity.level, answer: '', flowers: ['flowering', 'shrub'].includes(p.kind) || p.problems.some((x) => x.symptomKey === 'no-flowers' || x.symptomKey === 'bud-drop') }));
