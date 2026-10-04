import { makeRouter, type RouteDef } from './routes-core';
/** Site en anglais seul, sans pays : pas de préfixe de langue, la racine est l'accueil. */
export const LOCALES = ['en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** Pages fixes. Les fiches plantes (/plants/<slug>/) et les guides (/guides/<slug>/) sont générés
 *  depuis src/data/plants/*.json et src/data/guides/*.json : voir lib/plants.ts et lib/guides.ts. */
export const ROUTES: RouteDef<Locale>[] = [
  { id: 'home', paths: { en: '/' } },
  { id: 'plants', paths: { en: '/plants/' } },
  { id: 'guides', paths: { en: '/guides/' } },
  { id: 'tools', paths: { en: '/tools/' } },
  { id: 'watering', paths: { en: '/tools/watering-calculator/' } },
  { id: 'petsafe', paths: { en: '/tools/pet-safe-plant-checker/' } },
  { id: 'diagnosis', paths: { en: '/tools/plant-problem-diagnosis/' } },
  { id: 'lightfinder', paths: { en: '/tools/plant-light-finder/' } },
  { id: 'fertilizer', paths: { en: '/tools/fertilizer-dilution-calculator/' } },
  { id: 'pot', paths: { en: '/tools/pot-size-calculator/' } },
  { id: 'best', paths: { en: '/best-indoor-plants/' } },
  { id: 'lowlight', paths: { en: '/low-light-indoor-plants/' } },
  { id: 'petfriendly', paths: { en: '/plants-safe-for-cats-and-dogs/' } },
  { id: 'method', paths: { en: '/methodology/' } },
  { id: 'about', paths: { en: '/about/' } },
  { id: 'contact', paths: { en: '/contact/' } },
  { id: 'editorial', paths: { en: '/editorial-policy/' } },
  { id: 'widget', paths: { en: '/widget/' }, noindex: true },
  { id: 'privacy', paths: { en: '/privacy/' }, noindex: true },
  { id: 'terms', paths: { en: '/terms/' }, noindex: true },
  { id: 'cookies', paths: { en: '/cookies/' }, noindex: true },
];
export const { NOINDEX_PATHS, route, hasRoute, altPaths } = makeRouter(LOCALES, ROUTES);
