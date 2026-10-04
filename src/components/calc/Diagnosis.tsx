/** Diagnostic par symptôme, à partir des tableaux de problèmes des fiches (données réduites en props). */
import { useMemo, useState } from 'react';
import SelectField from '../ui/SelectField';
import { diagnose, type Soil } from '../../lib/engine/diagnose';
import type { Plant } from '../../lib/plant-schema';
import { fmt } from './parts';

export interface DiagPlant { slug: string; name: string; problems: Array<{ symptomKey: string; causeKey: string; cause: string; remedy: string }> }
interface Props { plants: DiagPlant[]; symptoms: Array<{ key: string; label: string }>; defaultSymptom?: string; defaultPlant?: string; idPrefix?: string }

export const CAUSE_LABEL: Record<string, string> = {
  overwatering: 'Overwatering', underwatering: 'Underwatering', 'low-light': 'Too little light', 'too-much-sun': 'Too much direct sun',
  'low-humidity': 'Dry air', cold: 'Cold or chill', heat: 'Heat', 'fertilizer-salts': 'Fertilizer or salt buildup', 'water-quality': 'Tap water chemicals',
  pests: 'Pests', 'root-bound': 'Root-bound pot', 'natural-aging': 'Normal aging of old leaves', 'poor-drainage': 'Poor drainage', disease: 'Fungal or bacterial disease',
  'repotting-shock': 'Repotting or moving shock', dormancy: 'Seasonal rest', 'nutrient-deficiency': 'Hungry plant (nutrients)', drafts: 'Drafts',
};

export default function Diagnosis({ plants, symptoms, defaultSymptom, defaultPlant = 'any', idPrefix = 'dx' }: Props) {
  const [symptom, setSymptom] = useState(defaultSymptom ?? symptoms[0]?.key);
  const [plant, setPlant] = useState(defaultPlant);
  const [soil, setSoil] = useState<Soil>('unknown');
  const results = useMemo(() => diagnose(plants as unknown as Plant[], symptom as Plant['problems'][number]['symptomKey'], { plant: plant === 'any' ? undefined : plant, soil }).slice(0, 4), [plants, symptom, plant, soil]);
  const name = (s: string) => plants.find((p) => p.slug === s)?.name ?? s;
  return (
    <div className="rechner rounded-xl border border-navy-200 bg-white p-4 sm:p-6">
      <form onSubmit={(e) => e.preventDefault()} className="grid content-start grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-3">
        <SelectField id={`${idPrefix}-sym`} label="What you see" value={symptom} onChange={setSymptom} options={symptoms.map((s) => ({ value: s.key, label: s.label }))} />
        <SelectField id={`${idPrefix}-plant`} label="Plant" value={plant} onChange={setPlant} options={[{ value: 'any', label: 'Any houseplant' }, ...plants.map((p) => ({ value: p.slug, label: p.name }))]} />
        <SelectField id={`${idPrefix}-soil`} label="Potting mix right now" value={soil} onChange={(v) => setSoil(v as Soil)} options={[{ value: 'unknown', label: 'Not sure' }, { value: 'wet', label: 'Wet or soggy' }, { value: 'dry', label: 'Bone dry' }]} />
      </form>
      <div aria-live="polite" className="mt-5">
        {results.length === 0 ? <p className="rounded-lg bg-navy-50 p-4 text-sm text-navy-800">None of our plant guides documents this symptom for this plant yet. Try “Any houseplant”.</p> : (
          <ol className="space-y-3">
            {results.map((d, k) => (
              <li key={d.causeKey} className={k === 0 ? 'rounded-lg border border-accent-200 bg-accent-50 p-4' : 'rounded-lg border border-navy-200 p-4'}>
                <p className="flex items-baseline justify-between gap-3"><span className={k === 0 ? 'font-serif text-2xl font-bold text-accent-800' : 'font-semibold text-navy-900'}>{CAUSE_LABEL[d.causeKey] ?? d.causeKey}</span><span className="tabular-nums text-sm text-navy-700">{fmt(d.share * 100)}% of matches</span></p>
                <p className="mt-1 text-sm text-navy-800"><strong>Likely why:</strong> {d.cause}</p>
                <p className="mt-1 text-sm text-navy-800"><strong>What to do:</strong> {d.remedy}</p>
                <p className="mt-1 text-xs text-navy-600">Documented on: {d.plants.slice(0, 6).map((s, i) => <span key={s}>{i > 0 && ', '}<a href={`/plants/${s}/`} className="underline">{name(s)}</a></span>)}{d.plants.length > 6 && ` and ${d.plants.length - 6} more`}</p>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-3 text-xs text-navy-600">Ranked from the problem tables of our plant guides, each sourced on its page. A ranking of likely causes, not a certainty.</p>
      </div>
    </div>
  );
}
