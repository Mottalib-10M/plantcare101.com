import { route, type Locale } from './routes';
import { PLANTS, plantPath } from '../lib/plants';
import { GUIDES, guidePath } from '../lib/guides';
export interface NavLink { href: string; label: string } export interface NavCategory { label: string; links: NavLink[] }
const L: Record<string, string> = {
  home: 'Home', plants: 'All plants', guides: 'All problem guides', tools: 'All tools',
  watering: 'Watering calculator', petsafe: 'Pet-safe plant checker', diagnosis: 'Plant problem diagnosis',
  lightfinder: 'Which plant for my light', fertilizer: 'Fertilizer dilution calculator', pot: 'Pot size calculator',
  best: 'Best indoor plants', lowlight: 'Low light indoor plants', petfriendly: 'Plants safe for cats and dogs',
  method: 'How we calculate', about: 'About', contact: 'Contact', editorial: 'Editorial policy', widget: 'Embed the calculator',
  privacy: 'Privacy', terms: 'Terms of use', cookies: 'Cookies',
};
export const label = (id: string, _l?: Locale) => L[id] ?? id;
const link = (id: string, lang: Locale): NavLink => ({ href: route(id, lang), label: label(id) });
const plantLinks = (): NavLink[] => PLANTS.map((p) => ({ href: plantPath(p.slug), label: p.commonName }));
const guideLinks = (): NavLink[] => GUIDES.map((g) => ({ href: guidePath(g.slug), label: g.nav }));
export const TOOL_IDS = ['watering', 'petsafe', 'diagnosis', 'lightfinder', 'fertilizer', 'pot'];
export function navCategories(lang: Locale): NavCategory[] {
  return [
    { label: 'Plants', links: [link('plants', lang), ...plantLinks()] },
    { label: 'Problems', links: [link('guides', lang), ...guideLinks()] },
    { label: 'Tools', links: [link('tools', lang), ...TOOL_IDS.map((i) => link(i, lang))] },
    { label: 'Lists', links: ['best', 'lowlight', 'petfriendly'].map((i) => link(i, lang)) },
  ];
}
export const navDirect = (lang: Locale): NavLink[] => [link('method', lang)];
export const footerColumns = (lang: Locale): NavCategory[] => [
  { label: 'Plants', links: [link('plants', lang), ...plantLinks()] },
  { label: 'Problems', links: [link('guides', lang), ...guideLinks()] },
  { label: 'Tools and lists', links: [link('tools', lang), ...TOOL_IDS.map((i) => link(i, lang)), ...['best', 'lowlight', 'petfriendly'].map((i) => link(i, lang))] },
  { label: 'The site', links: ['about', 'contact', 'editorial', 'method', 'widget', 'privacy', 'terms', 'cookies'].map((i) => link(i, lang)) },
];
export const popularLinks = (_lang: Locale): NavLink[] => [];
