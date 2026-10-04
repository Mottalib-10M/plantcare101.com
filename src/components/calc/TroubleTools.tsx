/** Mini-outils des guides de problèmes (RECETTE §9.3) : un sujet, un calcul, moteur lib/engine/troubles.ts. */
import { useMemo, useState, type ReactNode } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import { brownTips, overUnder, rootRotPlan, pestPlan, type BrownTipsInput, type OverUnderInput, type Pest, type BrownCause } from '../../lib/engine/troubles';
import { ResultCard, Rows, fmt } from './parts';

const o = (m: Record<string, string>) => Object.entries(m).map(([value, label]) => ({ value, label }));
const YN = o({ no: 'No', yes: 'Yes' });
const Frame = ({ children }: { children: ReactNode }) => <div className="rechner rounded-xl border border-navy-200 bg-white p-4 sm:p-6"><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">{children}</div></div>;
const Form = ({ children }: { children: ReactNode }) => <form onSubmit={(e) => e.preventDefault()} className="grid content-start grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">{children}</form>;

const BROWN: Record<BrownCause, [string, string]> = {
  salts: ['Fertilizer and salt buildup', 'Flush the pot: run plain water through it for a minute, let it drain, and feed less often.'],
  'low-humidity': ['Dry air', 'Group plants, use a pebble tray or a humidifier, and keep the pot away from heating vents.'],
  'water-quality': ['Tap water chemicals', 'Let tap water stand 24 hours before use, avoid softened water, or switch to filtered or rain water.'],
  underwatering: ['Letting it dry out too far', 'Water thoroughly as soon as the mix reaches the plant\'s dryness rule; do not wait for wilting.'],
  overwatering: ['Wet roots', 'Let the mix dry more between waterings and check that the drainage hole is clear.'],
};

export function BrownTipsTool({ idPrefix = 'bt' }: { idPrefix?: string }) {
  const [v, setV] = useState<BrownTipsInput>({ air: 'dry', water: 'tap', monthsSinceFlush: 6, feedEveryWeeks: 4, habit: 'regular', whiteCrust: false, fluorideSensitive: false });
  const set = <K extends keyof BrownTipsInput>(k: K) => (x: BrownTipsInput[K]) => setV((s) => ({ ...s, [k]: x }));
  const r = useMemo(() => brownTips(v), [v]);
  const top = r[0];
  const id = (x: string) => `${idPrefix}-${x}`;
  return (
    <Frame>
      <Form>
        <SelectField id={id('air')} label="Air in the room" value={v.air} onChange={(x) => set('air')(x as BrownTipsInput['air'])} options={o({ dry: 'Dry (heating or AC on)', average: 'Average', humid: 'Humid' })} />
        <SelectField id={id('water')} label="Water you use" value={v.water} onChange={(x) => set('water')(x as BrownTipsInput['water'])} options={o({ tap: 'Tap water', softened: 'Softened water', filtered: 'Filtered, distilled or rain' })} />
        <NumberField id={id('flush')} label="Months since a thorough flush" value={v.monthsSinceFlush} onChange={set('monthsSinceFlush')} unit="mo" max={60} />
        <NumberField id={id('feed')} label="You feed every" value={v.feedEveryWeeks} onChange={set('feedEveryWeeks')} unit="weeks" max={52} help="0 if you never feed" />
        <SelectField id={id('habit')} label="Between waterings the mix gets" value={v.habit} onChange={(x) => set('habit')(x as BrownTipsInput['habit'])} options={o({ regular: 'Dry to the plant\'s rule', 'bone-dry': 'Bone dry, plant wilts', soggy: 'Never really dries' })} />
        <SelectField id={id('crust')} label="White crust on soil or pot rim?" value={v.whiteCrust ? 'yes' : 'no'} onChange={(x) => set('whiteCrust')(x === 'yes')} options={YN} />
        <SelectField id={id('fl')} label="Does its guide say it dislikes tap water?" value={v.fluorideSensitive ? 'yes' : 'no'} onChange={(x) => set('fluorideSensitive')(x === 'yes')} options={YN} />
      </Form>
      <ResultCard label="Most likely cause of the brown tips" value={top ? BROWN[top.cause][0] : 'No clear cause'} sub={top ? BROWN[top.cause][1] : 'Your answers point nowhere in particular: check for pests under the leaves.'}>
        {r.length > 1 && <Rows rows={r.slice(1, 4).map((x) => [BROWN[x.cause][0], `score ${x.score}`])} />}
      </ResultCard>
    </Frame>
  );
}

export function OverUnderTool({ idPrefix = 'ou' }: { idPrefix?: string }) {
  const [v, setV] = useState<OverUnderInput>({ soil: 'wet', leaves: 'soft-limp', lowerYellow: true, smell: false, potWeight: 'heavy' });
  const set = <K extends keyof OverUnderInput>(k: K) => (x: string) => setV((s) => ({ ...s, [k]: k === 'lowerYellow' || k === 'smell' ? x === 'yes' : x }));
  const r = useMemo(() => overUnder(v), [v]);
  const id = (x: string) => `${idPrefix}-${x}`;
  const label = { overwatered: 'Overwatered', underwatered: 'Underwatered', unclear: 'Not clear yet' }[r.verdict];
  const advice = { overwatered: 'Stop watering, empty the saucer and let the mix dry. If it smells sour or roots are brown and soft, check for root rot.', underwatered: 'Soak the pot until water drains, or, if the mix has shrunk from the sides, stand the pot in a sink of water until the surface feels moist, then let it drain.', unclear: 'Wait a day and check the mix 2 in down and the pot weight again before watering.' }[r.verdict];
  return (
    <Frame>
      <Form>
        <SelectField id={id('soil')} label="Mix 2 in down feels" value={v.soil} onChange={set('soil')} options={o({ wet: 'Wet', damp: 'Slightly damp', dry: 'Dry' })} />
        <SelectField id={id('leaves')} label="Drooping leaves feel" value={v.leaves} onChange={set('leaves')} options={o({ 'soft-limp': 'Soft and limp', crispy: 'Dry and crispy', normal: 'Normal' })} />
        <SelectField id={id('yellow')} label="Lower leaves yellowing?" value={v.lowerYellow ? 'yes' : 'no'} onChange={set('lowerYellow')} options={YN} />
        <SelectField id={id('smell')} label="Sour or rotten smell?" value={v.smell ? 'yes' : 'no'} onChange={set('smell')} options={YN} />
        <SelectField id={id('weight')} label="Pot feels" value={v.potWeight} onChange={set('potWeight')} options={o({ heavy: 'Heavy', light: 'Light', unsure: 'Not sure' })} />
      </Form>
      <ResultCard label="Your plant is most likely" value={label} sub={advice}>
        <Rows rows={[['Signs of too much water', String(r.over)], ['Signs of too little water', String(r.under)], ['Confidence', r.confidence]]} />
      </ResultCard>
    </Frame>
  );
}

export function RootRotTool({ idPrefix = 'rr' }: { idPrefix?: string }) {
  const [pct, setPct] = useState(30); const [stems, setStems] = useState('yes'); const [pot, setPot] = useState(6);
  const r = useMemo(() => rootRotPlan({ rottenPct: pct, healthyStems: stems === 'yes', potIn: pot }), [pct, stems, pot]);
  const id = (x: string) => `${idPrefix}-${x}`;
  const title = { 'trim-repot': 'Trim and repot', 'trim-repot-smaller': 'Trim, repot smaller', propagate: 'Save cuttings', discard: 'Start over' }[r.action];
  return (
    <Frame>
      <Form>
        <NumberField id={id('pct')} label="Share of roots brown and soft" value={pct} onChange={setPct} unit="%" max={100} help="Estimate after rinsing the root ball" />
        <SelectField id={id('stems')} label="Firm, healthy stems left?" value={stems} onChange={setStems} options={o({ yes: 'Yes', no: 'No' })} />
        <NumberField id={id('pot')} label="Current pot diameter" value={pot} onChange={setPot} unit="in" min={2} max={24} />
      </Form>
      <ResultCard label="Rescue plan" value={title} sub={r.newPotIn ? `Pot for the recovery: ${fmt(r.newPotIn)} in` : undefined}>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-navy-800">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      </ResultCard>
    </Frame>
  );
}

export function PestTool({ idPrefix = 'ps' }: { idPrefix?: string }) {
  const [pest, setPest] = useState<Pest>('spider-mites'); const [sev, setSev] = useState<'light' | 'heavy'>('light');
  const plan = useMemo(() => pestPlan(pest, sev), [pest, sev]);
  const id = (x: string) => `${idPrefix}-${x}`;
  return (
    <Frame>
      <Form>
        <SelectField id={id('pest')} label="What you found" value={pest} onChange={(x) => setPest(x as Pest)} options={o({ 'spider-mites': 'Spider mites (webbing, speckles)', 'fungus-gnats': 'Fungus gnats (tiny flies)', mealybugs: 'Mealybugs (white cotton)' })} />
        <SelectField id={id('sev')} label="How bad is it?" value={sev} onChange={(x) => setSev(x as 'light' | 'heavy')} options={o({ light: 'A few spots', heavy: 'All over the plant' })} />
      </Form>
      <ResultCard label="Treatment plan" value={`${plan.length - 1} weeks`} sub="One step a week; repeat because eggs and hidden pests survive a single treatment.">
        <ol className="mt-3 space-y-1.5 text-sm text-navy-800">{plan.map((s) => <li key={s.week + s.action}><strong>{s.week === 0 ? 'Today' : `Week ${s.week}`}:</strong> {s.action}</li>)}</ol>
      </ResultCard>
    </Frame>
  );
}
