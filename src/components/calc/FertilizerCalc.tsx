/** Dilution d'engrais : dose de l'étiquette → quantité pour votre volume d'eau et la force voulue. */
import { useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import { dilute, type DoseUnit, type VolumeUnit, type Strength } from '../../lib/engine/fertilizer';
import { ResultCard, Rows, fmt, fraction } from './parts';

const PROFILE: Record<string, string> = { balanced: 'Balanced: suits foliage plants', 'high-nitrogen': 'Nitrogen-rich: leafy growth', 'high-phosphorus': 'Phosphorus-rich: sold for flowering plants', 'high-potassium': 'Potassium-rich', 'one-two-one': '1:2:1 ratio, as the Illinois Extension suggests', unknown: 'Enter the three label numbers' };
const UNIT: Record<DoseUnit, string> = { tsp: 'tsp', tbsp: 'tbsp', ml: 'mL', g: 'g' };
interface Props { idPrefix?: string; defaultStrength?: Strength; defaultEvery?: number }

export default function FertilizerCalc({ idPrefix = 'fz', defaultStrength = 'half', defaultEvery = 4 }: Props) {
  const [amt, setAmt] = useState(1);
  const [unit, setUnit] = useState<DoseUnit>('tsp');
  const [per, setPer] = useState<VolumeUnit>('gallon');
  const [water, setWater] = useState(1);
  const [wUnit, setWUnit] = useState<VolumeUnit>('quart');
  const [strength, setStrength] = useState<Strength>(defaultStrength);
  const [n, setN] = useState(10); const [p, setP] = useState(10); const [k, setK] = useState(10);
  const [every, setEvery] = useState(defaultEvery);
  const r = useMemo(() => dilute({ labelAmount: amt, labelUnit: unit, labelPer: per, waterAmount: water, waterUnit: wUnit, strength, npk: [n, p, k], everyWeeks: every }), [amt, unit, per, water, wUnit, strength, n, p, k, every]);
  const id = (x: string) => `${idPrefix}-${x}`;
  const vol = [{ value: 'cup', label: 'cup' }, { value: 'quart', label: 'quart' }, { value: 'gallon', label: 'gallon' }, { value: 'liter', label: 'liter' }];
  const value = unit === 'g' || unit === 'ml' ? `${fmt(r.amount, r.amount < 1 ? 2 : 1)} ${UNIT[unit]}` : `${fraction(r.amount)} ${UNIT[unit]}`;
  return (
    <div className="rechner rounded-xl border border-navy-200 bg-white p-4 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form onSubmit={(e) => e.preventDefault()} className="grid content-start grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <NumberField id={id('amt')} label="Label dose" value={amt} onChange={setAmt} max={100} decimals={2} help="The amount printed on the bottle or box" />
          <SelectField id={id('unit')} label="Dose unit" value={unit} onChange={(v) => setUnit(v as DoseUnit)} options={[{ value: 'tsp', label: 'teaspoons' }, { value: 'tbsp', label: 'tablespoons' }, { value: 'ml', label: 'milliliters' }, { value: 'g', label: 'grams' }]} />
          <SelectField id={id('per')} label="Per this much water" value={per} onChange={(v) => setPer(v as VolumeUnit)} options={vol} />
          <SelectField id={id('str')} label="Strength" value={strength} onChange={(v) => setStrength(v as Strength)} options={[{ value: 'full', label: 'Full label rate' }, { value: 'half', label: 'Half strength' }, { value: 'quarter', label: 'Quarter strength' }, { value: 'tenth', label: 'One-tenth, every watering' }]} />
          <NumberField id={id('water')} label="Water you will mix" value={water} onChange={setWater} max={50} decimals={2} />
          <SelectField id={id('wunit')} label="Water unit" value={wUnit} onChange={(v) => setWUnit(v as VolumeUnit)} options={vol} />
          <div className="grid grid-cols-3 gap-2 sm:col-span-2">
            <NumberField id={id('n')} label="N" value={n} onChange={setN} max={60} unit="%" />
            <NumberField id={id('p')} label="P" value={p} onChange={setP} max={60} unit="%" />
            <NumberField id={id('k')} label="K" value={k} onChange={setK} max={60} unit="%" />
          </div>
          <NumberField id={id('every')} label="Feed every" value={every} onChange={setEvery} unit="weeks" max={26} />
        </form>
        <div>
          <ResultCard label={`Mix into ${fmt(water, 2)} ${wUnit}${water === 1 ? '' : 's'} of water`} value={value} sub={r.amountMl !== null && unit !== 'ml' ? <>about {fmt(r.amountMl, r.amountMl < 1 ? 2 : 1)} mL</> : undefined}>
            <Rows rows={[
              ['Strength', `${fmt(r.ratio * 100)}% of the label rate`],
              ['Feedings, March to September', `${r.feedingsPerSeason} at every ${every} weeks`],
              ['N-P-K', PROFILE[r.npkProfile]],
              ['Nitrogen in the solution', r.nitrogenPpm === null ? 'needs a dose in grams' : `${fmt(r.nitrogenPpm)} ppm`],
            ]} />
          </ResultCard>
          {r.warnings.map((w) => <p key={w} className="mt-3 border-l-4 border-amber-600 bg-amber-50 px-3 py-2 text-sm text-amber-900">{w}</p>)}
          <p className="mt-2 text-xs text-navy-600">Never mix stronger than the label. Feed only while the plant is growing, and water the mix first if it is bone dry.</p>
        </div>
      </div>
    </div>
  );
}
