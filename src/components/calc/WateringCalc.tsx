/**
 * Calculateur d'arrosage. Deux usages :
 *  - outil complet (/tools/watering-calculator/, accueil, widget) : choix de la plante, lien partageable ;
 *  - mini-simulateur d'une fiche plante (`fixedPlant`) : la plante est fixée, quatre champs visibles,
 *    les autres sous « More options ».
 * Premier rendu = valeurs par défaut du build ; l'URL n'est lue qu'après montage (RECETTE §17.5).
 */
import { useEffect, useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import { wateringSchedule, fingerTest, type WateringInput, type DryRule } from '../../lib/engine/watering';
import { readParams, num, str, updateURL } from '../../lib/url-state';
import { ResultCard, Rows, FactorBars, fmt } from './parts';

export interface PlantOption { slug: string; name: string; rule: DryRule }
interface Props { plants?: PlantOption[]; fixedPlant?: PlantOption; defaultSlug?: string; defaultRule?: DryRule; methodHref: string; toolHref?: string; share?: boolean; idPrefix?: string }

export const RULE_LABEL: Record<DryRule, string> = {
  'evenly-moist': 'Keep evenly moist', 'top-inch': 'Top inch dry', 'top-2-inches': 'Top 2 inches dry',
  'half-dry': 'Top half of the pot dry', 'fully-dry': 'Completely dry', 'bark-dry': 'Bark nearly dry (orchids)',
};

const opt = (o: Record<string, string>) => Object.entries(o).map(([value, label]) => ({ value, label }));
const MATERIALS = opt({ plastic: 'Plastic', terracotta: 'Unglazed terracotta', glazed: 'Glazed ceramic' });
const LIGHTS = opt({ 'bright-indirect': 'Bright, indirect', medium: 'Medium', low: 'Low (far from windows)', 'direct-sun': 'Some direct sun' });
const SEASONS = opt({ summer: 'Summer', spring: 'Spring', fall: 'Fall', winter: 'Winter' });
const HUMID = opt({ average: 'Average (30 to 50%)', dry: 'Dry (under 30%)', humid: 'Humid (over 50%)' });
const SUBSTRATES = opt({ standard: 'Standard potting mix', chunky: 'Chunky aroid mix', gritty: 'Gritty cactus mix', bark: 'Orchid bark', 'moisture-retentive': 'Peat or coir-heavy mix' });
const YESNO = opt({ yes: 'Yes', no: 'No' });

export default function WateringCalc({ plants = [], fixedPlant, defaultSlug, defaultRule = 'top-inch', methodHref, toolHref, share = false, idPrefix = 'w' }: Props) {
  const initialSlug = fixedPlant?.slug ?? defaultSlug ?? plants[0]?.slug ?? 'custom';
  const [slug, setSlug] = useState(initialSlug);
  const [customRule, setCustomRule] = useState<DryRule>(defaultRule);
  const [pot, setPot] = useState(6);
  const [material, setMaterial] = useState<WateringInput['material']>('plastic');
  const [drainage, setDrainage] = useState(true);
  const [light, setLight] = useState<WateringInput['light']>('bright-indirect');
  const [season, setSeason] = useState<WateringInput['season']>('summer');
  const [humidity, setHumidity] = useState<WateringInput['humidity']>('average');
  const [substrate, setSubstrate] = useState<WateringInput['substrate']>('standard');

  useEffect(() => {
    if (!share) return;
    const u = readParams(window.location.search);
    const s = str(u, 'plant', initialSlug);
    if (s === 'custom' || plants.some((p) => p.slug === s)) setSlug(s);
    const r = str(u, 'rule', defaultRule) as DryRule; if (r in RULE_LABEL) setCustomRule(r);
    setPot(num(u, 'pot', 6));
    const pick = <T extends string>(k: string, d: T, allowed: Array<{ value: string }>) => { const v = str(u, k, d); return (allowed.some((a) => a.value === v) ? v : d) as T; };
    setMaterial(pick('mat', 'plastic', MATERIALS)); setLight(pick('light', 'bright-indirect', LIGHTS)); setSeason(pick('season', 'summer', SEASONS));
    setHumidity(pick('rh', 'average', HUMID)); setSubstrate(pick('mix', 'standard', SUBSTRATES)); setDrainage(str(u, 'drain', 'yes') !== 'no');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const plant = fixedPlant ?? plants.find((p) => p.slug === slug);
  const rule: DryRule = plant ? plant.rule : customRule;
  const potIn = Math.min(Math.max(pot || 6, 2), 24);
  const r = useMemo(() => wateringSchedule({ rule, potDiameterIn: potIn, material, drainage, light, season, humidity, substrate }), [rule, potIn, material, drainage, light, season, humidity, substrate]);

  useEffect(() => {
    if (share) updateURL({ plant: slug, rule: slug === 'custom' ? customRule : undefined, pot: potIn, mat: material, drain: drainage ? undefined : 'no', light, season, rh: humidity, mix: substrate });
  }, [share, slug, customRule, potIn, material, drainage, light, season, humidity, substrate]);

  const id = (k: string) => `${idPrefix}-${k}`;
  const cups = (x: number) => (x < 1 ? `${fmt(x * 16, 0)} tbsp` : `${fmt(x, 1)} cups`);
  const advanced = (
    <>
      <SelectField id={id('drain')} label="Drainage hole?" value={drainage ? 'yes' : 'no'} onChange={(v) => setDrainage(v === 'yes')} options={YESNO} />
      <SelectField id={id('rh')} label="Air humidity" value={humidity} onChange={(v) => setHumidity(v as WateringInput['humidity'])} options={HUMID} />
      <SelectField id={id('mix')} label="Potting mix" value={substrate} onChange={(v) => setSubstrate(v as WateringInput['substrate'])} options={SUBSTRATES} />
    </>
  );
  return (
    <div className="rechner rounded-xl border border-navy-200 bg-white p-4 sm:p-6">
      <div className={fixedPlant ? 'grid gap-5' : 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'}>
        <form onSubmit={(e) => e.preventDefault()} className="grid content-start grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          {!fixedPlant && (
            <SelectField id={id('plant')} label="Plant" value={slug} onChange={setSlug}
              options={[...plants.map((p) => ({ value: p.slug, label: p.name })), { value: 'custom', label: 'Another plant (choose its rule)' }]} />
          )}
          {!fixedPlant && slug === 'custom' && (
            <SelectField id={id('rule')} label="Its watering rule" value={customRule} onChange={(v) => setCustomRule(v as DryRule)} options={opt(RULE_LABEL)} />
          )}
          <NumberField id={id('pot')} label="Pot diameter" value={pot} onChange={setPot} unit="in" min={2} max={24} help="Measure across the top rim" />
          <SelectField id={id('mat')} label="Pot material" value={material} onChange={(v) => setMaterial(v as WateringInput['material'])} options={MATERIALS} />
          <SelectField id={id('light')} label="Light it gets" value={light} onChange={(v) => setLight(v as WateringInput['light'])} options={LIGHTS} />
          <SelectField id={id('season')} label="Season" value={season} onChange={(v) => setSeason(v as WateringInput['season'])} options={SEASONS} />
          {fixedPlant
            ? <details className="sm:col-span-2"><summary className="cursor-pointer text-sm font-medium text-accent-700">More options: drainage, humidity, potting mix</summary><div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">{advanced}</div></details>
            : advanced}
        </form>
        <div>
          <ResultCard label={`Water ${plant ? `your ${plant.name.toLowerCase()}` : 'this plant'} roughly`} value={`every ${r.days[0]} to ${r.days[1]} days`}
            sub={<>Start checking on day {r.checkFromDay}. Rule: {RULE_LABEL[rule].toLowerCase()}.</>}>
            <Rows rows={[
              ['Water per session', `${cups(r.volumeCups[0])} to ${cups(r.volumeCups[1])} (${fmt(r.volumeMl[0])} to ${fmt(r.volumeMl[1])} mL)`],
              ['Weight test', `about ${fmt(r.weightLossOz)} oz lighter than just after watering`],
            ]} />
            <p className="mt-3 text-sm text-navy-800"><strong>Finger test:</strong> {fingerTest(rule, potIn)}</p>
          </ResultCard>
          {r.warnings.map((w) => <p key={w} className="mt-3 border-l-4 border-amber-600 bg-amber-50 px-3 py-2 text-sm text-amber-900">{w}</p>)}
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-medium text-navy-800">How this range was built</summary>
            <p className="mt-2 text-navy-700">Reference range for the rule, multiplied by each factor (×{fmt(r.totalMult, 2)} in total):</p>
            <FactorBars factors={r.factors} />
            <p className="mt-2 text-navy-700">An estimate, not a schedule: always confirm with the finger or weight test. <a href={methodHref} className="font-medium text-accent-700 underline">How we calculate</a></p>
          </details>
          {toolHref && <a href={toolHref} className="mt-3 inline-block text-sm font-medium text-accent-700 hover:underline">Open the full watering calculator →</a>}
        </div>
      </div>
    </div>
  );
}
