/** Tous les guides, validés au build. Déposer src/data/guides/<slug>.json suffit. */
import { parseGuide, type Guide } from './guide-schema';

const files = import.meta.glob('../data/guides/*.json', { eager: true, import: 'default' });
export const GUIDE_ORDER = ['yellow-leaves', 'brown-leaf-tips', 'overwatering-vs-underwatering', 'root-rot', 'houseplant-pests', 'leggy-plants', 'how-to-repot-a-plant', 'how-often-to-water-plants'];
export const GUIDES: Guide[] = Object.entries(files)
  .map(([file, data]) => {
    const g = parseGuide(data, file.split('/').pop());
    if (`${g.slug}.json` !== file.split('/').pop()) throw new Error(`${file} : slug ≠ nom de fichier`);
    return g;
  })
  .sort((a, b) => (GUIDE_ORDER.indexOf(a.slug) + 1 || 99) - (GUIDE_ORDER.indexOf(b.slug) + 1 || 99) || a.slug.localeCompare(b.slug));
export const guidePath = (slug: string) => `/guides/${slug}/`;
export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);
