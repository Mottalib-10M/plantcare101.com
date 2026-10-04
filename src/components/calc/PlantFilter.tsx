/** Liste filtrable des plantes (index et hubs) : lumière disponible, animaux, arrosage, type. Les
 *  données viennent des fiches (props réduites) ; premier rendu = réglages par défaut, donc la liste
 *  complète du hub est dans le HTML servi. */
import { useMemo, useState } from 'react';
import SelectField from '../ui/SelectField';

export interface FilterPlant { slug: string; name: string; botanical: string; minLevel: string; idealLevel: string; maxLevel: string; rule: string; cats: string; dogs: string; kind: string; humidity: string; answer: string; flowers: boolean }
interface Props { plants: FilterPlant[]; defaultLight?: string; defaultPets?: string; defaultCare?: string; idPrefix?: string }

const LEVELS = ['low', 'medium', 'high', 'direct'];
const LEVEL_TXT: Record<string, string> = { low: 'Low light', medium: 'Medium light', high: 'Bright light', direct: 'Direct sun' };
const RULE_TXT: Record<string, string> = { 'evenly-moist': 'Keep moist', 'top-inch': 'Top inch dry', 'top-2-inches': 'Top 2 in dry', 'half-dry': 'Half dry', 'fully-dry': 'Dry out fully', 'bark-dry': 'Bark nearly dry' };
const forgiving = new Set(['fully-dry', 'half-dry', 'top-2-inches']);
const status = (s: string) => (s === 'toxic' ? 'toxic' : s === 'non-toxic' ? 'non-toxic' : s === 'unknown' ? 'not rated' : 'varies');

export default function PlantFilter({ plants, defaultLight = 'any', defaultPets = 'any', defaultCare = 'any', idPrefix = 'pf' }: Props) {
  const [light, setLight] = useState(defaultLight);
  const [pets, setPets] = useState(defaultPets);
  const [care, setCare] = useState(defaultCare);
  const shown = useMemo(() => plants.filter((p) =>
    (light === 'any' || (LEVELS.indexOf(p.minLevel) <= LEVELS.indexOf(light) && LEVELS.indexOf(p.maxLevel) >= LEVELS.indexOf(light))) &&
    (pets === 'any' || (pets === 'cats' ? p.cats === 'non-toxic' : pets === 'dogs' ? p.dogs === 'non-toxic' : p.cats === 'non-toxic' && p.dogs === 'non-toxic')) &&
    (care === 'any' || (care === 'forgiving' ? forgiving.has(p.rule) : care === 'humid' ? p.humidity === 'high' : care === 'flowering' ? p.flowers : ['succulent', 'cactus'].includes(p.kind)))
  ), [plants, light, pets, care]);
  return (
    <div className="rechner">
      <form onSubmit={(e) => e.preventDefault()} className="grid content-start grid-cols-1 gap-x-4 gap-y-4 rounded-xl border border-navy-200 bg-white p-4 sm:grid-cols-3 sm:p-5">
        <SelectField id={`${idPrefix}-light`} label="Light where it will live" value={light} onChange={setLight} options={[{ value: 'any', label: 'Any light' }, ...LEVELS.map((l) => ({ value: l, label: LEVEL_TXT[l] }))]} />
        <SelectField id={`${idPrefix}-pets`} label="Pets at home" value={pets} onChange={setPets} options={[{ value: 'any', label: 'No filter' }, { value: 'both', label: 'Cats and dogs' }, { value: 'cats', label: 'Cats' }, { value: 'dogs', label: 'Dogs' }]} />
        <SelectField id={`${idPrefix}-care`} label="What suits you" value={care} onChange={setCare} options={[{ value: 'any', label: 'Show all' }, { value: 'forgiving', label: 'Forgives missed waterings' }, { value: 'humid', label: 'Likes humid rooms' }, { value: 'flowering', label: 'Flowering plants' }, { value: 'succulent', label: 'Succulents and cacti' }]} />
      </form>
      <p aria-live="polite" className="mt-3 text-sm text-navy-700">{shown.length} of {plants.length} plants match.</p>
      <ul data-sommaire className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <li key={p.slug} className="rounded-lg border border-navy-200 p-4 hover:border-accent-300">
            <a href={`/plants/${p.slug}/`} className="font-serif text-lg font-semibold text-navy-900 hover:text-accent-700">{p.name}</a>
            <span className="block text-xs italic text-navy-600">{p.botanical}</span>
            <span className="mt-2 block text-sm text-navy-800">{LEVEL_TXT[p.minLevel]}{p.minLevel !== p.maxLevel ? ` to ${LEVEL_TXT[p.maxLevel].toLowerCase()}` : ''} · {RULE_TXT[p.rule]}</span>
            <span className="mt-1 block text-xs text-navy-700">Cats: {status(p.cats)} · Dogs: {status(p.dogs)}</span>
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="mt-3 rounded-lg bg-navy-50 p-4 text-sm text-navy-800">No plant on this site matches all three filters yet. Loosen one of them.</p>}
    </div>
  );
}
