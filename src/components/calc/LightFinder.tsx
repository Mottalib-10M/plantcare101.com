/** Lumière d'un emplacement (fenêtre, distance, obstacles) et plantes qui y conviennent. */
import { useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import { lightAt, lightFit, type Window, type Obstruction, type Fit } from '../../lib/engine/light';
import type { Plant } from '../../lib/plant-schema';
import { ResultCard, Rows, fmt } from './parts';

export interface LightPlant { slug: string; name: string; light: Plant['light']; cats: string; dogs: string }
interface Props { plants: LightPlant[]; defaultWindow?: Window; defaultDistance?: number; focus?: string; idPrefix?: string; methodHref: string }

const LEVEL: Record<string, string> = { 'too-dark': 'Too dark for most plants', low: 'Low light', medium: 'Medium light', high: 'Bright light', direct: 'Direct sun' };
const FIT: Record<Fit, string> = { good: 'Thrives here', survives: 'Survives, grows slowly', 'too-dark': 'Too dark', 'too-bright': 'Too bright' };

export default function LightFinder({ plants, defaultWindow = 'east', defaultDistance = 4, focus, idPrefix = 'lf', methodHref }: Props) {
  const [win, setWin] = useState<Window>(defaultWindow);
  const [dist, setDist] = useState(defaultDistance);
  const [obs, setObs] = useState<Obstruction>('none');
  const [pets, setPets] = useState<'any' | 'safe'>('any');
  const r = useMemo(() => lightAt(win, dist, obs), [win, dist, obs]);
  const rated = plants
    .filter((p) => pets === 'any' || (p.cats === 'non-toxic' && p.dogs === 'non-toxic'))
    .map((p) => ({ p, fit: lightFit(r.fc, p) }))
    .sort((a, b) => ['good', 'survives', 'too-bright', 'too-dark'].indexOf(a.fit) - ['good', 'survives', 'too-bright', 'too-dark'].indexOf(b.fit) || a.p.name.localeCompare(b.p.name));
  const focused = focus ? rated.find((x) => x.p.slug === focus) : undefined;
  const good = rated.filter((x) => x.fit === 'good'), ok = rated.filter((x) => x.fit === 'survives');
  return (
    <div className="rechner rounded-xl border border-navy-200 bg-white p-4 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form onSubmit={(e) => e.preventDefault()} className="grid content-start grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <SelectField id={`${idPrefix}-win`} label="Nearest window faces" value={win} onChange={(v) => setWin(v as Window)} options={[{ value: 'east', label: 'East' }, { value: 'west', label: 'West' }, { value: 'south', label: 'South' }, { value: 'north', label: 'North' }]} />
          <NumberField id={`${idPrefix}-dist`} label="Distance from the glass" value={dist} onChange={setDist} unit="ft" max={40} help="0 means right on the sill" />
          <SelectField id={`${idPrefix}-obs`} label="In the way" value={obs} onChange={(v) => setObs(v as Obstruction)} options={[{ value: 'none', label: 'Nothing' }, { value: 'sheer', label: 'Sheer curtain' }, { value: 'shade', label: 'Tree, porch or building outside' }, { value: 'both', label: 'Curtain and outdoor shade' }]} />
          <SelectField id={`${idPrefix}-pets`} label="Plants to show" value={pets} onChange={(v) => setPets(v as typeof pets)} options={[{ value: 'any', label: 'All plants' }, { value: 'safe', label: 'Safe for cats and dogs' }]} />
        </form>
        <div>
          <ResultCard label="Estimated light at this spot" value={`${fmt(r.fc)} fc`} sub={<>{LEVEL[r.level]} · about {fmt(r.lux)} lux{r.extrapolated ? ' · beyond our reference distances, rough estimate' : ''}</>}>
            <Rows rows={[
              ...(focused ? [[focused.p.name, FIT[focused.fit]] as [string, string]] : []),
              ['Plants that thrive here', String(good.length)],
              ['Plants that only survive here', String(ok.length)],
            ]} />
          </ResultCard>
          <p className="mt-2 text-xs text-navy-600">Northern Hemisphere, daytime. A phone light-meter app reading beats any estimate. <a href={methodHref} className="underline">How we estimate light</a></p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div><p className="text-sm font-semibold text-navy-900">Thrives here</p><p className="mt-1 text-sm text-navy-800">{good.length ? good.map((x, i) => <span key={x.p.slug}>{i > 0 && ', '}<a href={`/plants/${x.p.slug}/`} className="text-accent-800 underline">{x.p.name}</a></span>) : 'None of our plants: move closer to the window.'}</p></div>
        <div><p className="text-sm font-semibold text-navy-900">Survives, grows slowly</p><p className="mt-1 text-sm text-navy-800">{ok.length ? ok.map((x, i) => <span key={x.p.slug}>{i > 0 && ', '}<a href={`/plants/${x.p.slug}/`} className="text-accent-800 underline">{x.p.name}</a></span>) : 'None.'}</p></div>
      </div>
    </div>
  );
}
