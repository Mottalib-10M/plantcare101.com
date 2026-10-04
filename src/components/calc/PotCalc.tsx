/** Taille du pot au rempotage (règle Clemson HGIC : 1 ou 2 in de plus). */
import { useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import { nextPot, type RootType } from '../../lib/engine/pot';
import { ResultCard, Rows, fmt } from './parts';

export interface PotPlant { slug: string; name: string; rootType: RootType; prefersSnug: boolean }
interface Props { plants?: PotPlant[]; fixedPlant?: PotPlant; idPrefix?: string }
const ROOTS: Record<RootType, string> = { fibrous: 'Fine, fibrous roots', 'thick-fleshy': 'Thick, fleshy roots', rhizome: 'Rhizomes', succulent: 'Succulent or cactus', epiphytic: 'Epiphyte (orchid, bromeliad)', woody: 'Woody (tree, shrub)' };

export default function PotCalc({ plants = [], fixedPlant, idPrefix = 'pt' }: Props) {
  const [slug, setSlug] = useState(fixedPlant?.slug ?? 'custom');
  const [root, setRoot] = useState<RootType>(fixedPlant?.rootType ?? 'fibrous');
  const [cur, setCur] = useState(6);
  const [bound, setBound] = useState('yes');
  const plant = fixedPlant ?? plants.find((p) => p.slug === slug);
  const rootType = plant ? plant.rootType : root;
  const r = useMemo(() => nextPot({ currentIn: cur || 6, rootType, prefersSnug: plant?.prefersSnug ?? false, rootbound: bound === 'yes' }), [cur, rootType, plant, bound]);
  const id = (x: string) => `${idPrefix}-${x}`;
  return (
    <div className="rechner rounded-xl border border-navy-200 bg-white p-4 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form onSubmit={(e) => e.preventDefault()} className="grid content-start grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          {!fixedPlant && <SelectField id={id('plant')} label="Plant" value={slug} onChange={setSlug} options={[{ value: 'custom', label: 'Another plant' }, ...plants.map((p) => ({ value: p.slug, label: p.name }))]} />}
          {!fixedPlant && slug === 'custom' && <SelectField id={id('root')} label="Root type" value={root} onChange={(v) => setRoot(v as RootType)} options={Object.entries(ROOTS).map(([value, label]) => ({ value, label }))} />}
          <NumberField id={id('cur')} label="Current pot diameter" value={cur} onChange={setCur} unit="in" min={2} max={24} help="Measured across the top rim" />
          <SelectField id={id('bound')} label="Roots circling or poking out?" value={bound} onChange={setBound} options={[{ value: 'yes', label: 'Yes, root-bound' }, { value: 'no', label: 'No, just tired soil' }]} />
        </form>
        <ResultCard label={r.sameSize ? 'Keep the same pot' : 'New pot diameter'} value={r.newIn[0] === r.newIn[1] ? `${fmt(r.newIn[0], 1)} in` : `${fmt(r.newIn[0], 1)} to ${fmt(r.newIn[1], 1)} in`} sub={r.reason}>
          <Rows rows={r.sameSize ? [['Fresh mix needed', 'enough to replace the old mix']] : [
            ['Extra potting mix', `${fmt(r.addQuarts[0], 1)}${r.addQuarts[1] !== r.addQuarts[0] ? ` to ${fmt(r.addQuarts[1], 1)}` : ''} quarts`],
            ['Soil volume increase', `${r.volumeIncreasePct[0]}%${r.volumeIncreasePct[1] !== r.volumeIncreasePct[0] ? ` to ${r.volumeIncreasePct[1]}%` : ''}`],
            ['Drainage hole', 'required'],
          ]} />
        </ResultCard>
      </div>
    </div>
  );
}
