import { describe, it, expect } from 'vitest';
import { wateringSchedule, fingerTest, potVolumeCubicIn, BASE_DAYS, type WateringInput } from './watering';
import { dilute, npkProfile } from './fertilizer';
import { nextPot } from './pot';
import { lightAt, levelOf, lightFit } from './light';
import { diagnose, documentedSymptoms } from './diagnose';
import { searchAspca, verdict, aspcaUrl, type AspcaRow } from './petsafe';
import aspca from '../../data/aspca-plants.json';
import type { Plant } from '../plant-schema';

const ref: WateringInput = { rule: 'top-2-inches', potDiameterIn: 6, material: 'plastic', drainage: true, light: 'bright-indirect', season: 'summer', humidity: 'average', substrate: 'standard' };

describe('arrosage', () => {
  it('cas de référence = intervalle de base de la règle', () => {
    expect(wateringSchedule(ref).days).toEqual(BASE_DAYS['top-2-inches']);
    for (const rule of Object.keys(BASE_DAYS) as Array<keyof typeof BASE_DAYS>) expect(wateringSchedule({ ...ref, rule }).days).toEqual(BASE_DAYS[rule]);
  });
  it('la terre cuite raccourcit, le plastique et le grès émaillé non (Clemson, Illinois)', () => {
    expect(wateringSchedule({ ...ref, material: 'terracotta' }).days[1]).toBeLessThan(11);
    expect(wateringSchedule({ ...ref, material: 'glazed' }).days).toEqual([7, 11]);
  });
  it('hiver, faible lumière, gros pot et substrat tourbeux allongent ; soleil, air sec, écorce raccourcissent', () => {
    const d = (o: Partial<WateringInput>) => wateringSchedule({ ...ref, ...o }).days[0];
    expect(d({ season: 'winter' })).toBeGreaterThan(7);
    expect(d({ light: 'low' })).toBeGreaterThan(7);
    expect(d({ potDiameterIn: 12 })).toBeGreaterThan(7);
    expect(d({ substrate: 'moisture-retentive' })).toBeGreaterThan(7);
    expect(d({ light: 'direct-sun' })).toBeLessThan(7);
    expect(d({ humidity: 'dry' })).toBeLessThan(7);
    expect(d({ substrate: 'bark' })).toBeLessThan(7);
  });
  it('toujours une fourchette, jamais sous 1 jour', () => {
    const r = wateringSchedule({ ...ref, rule: 'evenly-moist', potDiameterIn: 2, material: 'terracotta', light: 'direct-sun', humidity: 'dry', substrate: 'bark' });
    expect(r.days[0]).toBeGreaterThanOrEqual(1);
    expect(r.days[1]).toBeGreaterThan(r.days[0]);
    expect(r.checkFromDay).toBeGreaterThanOrEqual(1);
  });
  it('sans drainage : intervalle plus long, volume réduit et avertissement', () => {
    const a = wateringSchedule(ref), b = wateringSchedule({ ...ref, drainage: false });
    expect(b.days[0]).toBeGreaterThan(a.days[0]);
    expect(b.volumeMl[1]).toBeLessThan(a.volumeMl[0]);
    expect(b.warnings.length).toBe(1);
  });
  it('volume d’un pot de 6 in : environ 1,8 L, arrosage de 20 à 30 %', () => {
    const v = potVolumeCubicIn(6) * 16.387;
    expect(v).toBeGreaterThan(1700); expect(v).toBeLessThan(1900);
    const r = wateringSchedule(ref);
    expect(r.volumeMl[0]).toBe(Math.round(v * 0.2));
    expect(r.volumeCups[1]).toBeCloseTo(r.volumeMl[1] / 236.588, 5);
  });
  it('test du doigt selon la règle', () => {
    expect(fingerTest('top-inch', 6)).toMatch(/1 in/);
    expect(fingerTest('top-2-inches', 6)).toMatch(/2 in/);
    expect(fingerTest('fully-dry', 6)).toMatch(/bottom/);
    expect(fingerTest('bark-dry', 5)).toMatch(/silvery/);
  });
});

describe('engrais', () => {
  it('1 tsp par gallon, demi-dose, 1 quart = 1/8 tsp', () => {
    const r = dilute({ labelAmount: 1, labelUnit: 'tsp', labelPer: 'gallon', waterAmount: 1, waterUnit: 'quart', strength: 'half', npk: [10, 10, 10], everyWeeks: 4 });
    expect(r.amount).toBeCloseTo(0.125, 3);
    expect(r.amountMl).toBeCloseTo(0.616, 2);
    expect(r.nitrogenPpm).toBeNull();
  });
  it('1 g par litre de 20-20-20 à pleine dose = 200 ppm d’azote', () => {
    const r = dilute({ labelAmount: 1, labelUnit: 'g', labelPer: 'liter', waterAmount: 1, waterUnit: 'liter', strength: 'full', npk: [20, 20, 20], everyWeeks: 8 });
    expect(r.nitrogenPpm).toBeCloseTo(200, 6);
  });
  it('profil N-P-K', () => {
    expect(npkProfile([10, 10, 10])).toBe('balanced');
    expect(npkProfile([20, 20, 20])).toBe('balanced');
    expect(npkProfile([10, 20, 10])).toBe('one-two-one');
    expect(npkProfile([24, 8, 16])).toBe('high-nitrogen');
    expect(npkProfile([0, 0, 0])).toBe('unknown');
  });
  it('apports par saison et alertes', () => {
    const r = dilute({ labelAmount: 1, labelUnit: 'tsp', labelPer: 'gallon', waterAmount: 1, waterUnit: 'gallon', strength: 'full', npk: [10, 10, 10], everyWeeks: 2 });
    expect(r.feedingsPerSeason).toBe(16);
    expect(r.warnings.length).toBe(1);
  });
});

describe('pot', () => {
  it('Clemson : 1 ou 2 in de plus', () => {
    expect(nextPot({ currentIn: 6, rootType: 'fibrous', prefersSnug: false, rootbound: true }).newIn).toEqual([7, 8]);
    expect(nextPot({ currentIn: 8, rootType: 'fibrous', prefersSnug: false, rootbound: true }).newIn).toEqual([9, 10]);
    expect(nextPot({ currentIn: 12, rootType: 'woody', prefersSnug: false, rootbound: true }).newIn).toEqual([14, 14]);
  });
  it('plante qui aime l’étroitesse : +1 in ; plante pas à l’étroit : même pot', () => {
    expect(nextPot({ currentIn: 5, rootType: 'epiphytic', prefersSnug: false, rootbound: true }).newIn).toEqual([6, 6]);
    expect(nextPot({ currentIn: 6, rootType: 'rhizome', prefersSnug: true, rootbound: true }).newIn).toEqual([7, 7]);
    const s = nextPot({ currentIn: 6, rootType: 'fibrous', prefersSnug: false, rootbound: false });
    expect(s.sameSize).toBe(true); expect(s.addQuarts).toEqual([0, 0]);
  });
  it('terreau à ajouter positif et croissant', () => {
    const r = nextPot({ currentIn: 6, rootType: 'fibrous', prefersSnug: false, rootbound: true });
    expect(r.addQuarts[0]).toBeGreaterThan(0); expect(r.addQuarts[1]).toBeGreaterThan(r.addQuarts[0]);
    expect(r.volumeIncreasePct[0]).toBeGreaterThan(40);
  });
});

describe('lumière (ancrages Illinois Extension)', () => {
  it('devant la fenêtre', () => {
    expect(lightAt('south', 0, 'none').fc).toBe(1500);
    expect(lightAt('east', 0, 'none').fc).toBe(300);
    expect(lightAt('north', 0, 'none').fc).toBe(150);
  });
  it('à distance', () => {
    expect(lightAt('south', 5, 'none').level).toBe('high');
    expect(lightAt('south', 10, 'none').level).toBe('medium');
    expect(lightAt('east', 3, 'none').fc).toBe(150);
    expect(lightAt('north', 3, 'none').level).toBe('low');
    expect(lightAt('south', 18, 'none').fc).toBe(75);
    expect(lightAt('north', 20, 'none').extrapolated).toBe(true);
  });
  it('voilage et ombre extérieure', () => {
    expect(lightAt('east', 0, 'sheer').fc).toBe(150);
    expect(lightAt('east', 0, 'both').fc).toBe(75);
  });
  it('niveaux', () => {
    expect(levelOf(40)).toBe('too-dark'); expect(levelOf(75)).toBe('low'); expect(levelOf(150)).toBe('medium');
    expect(levelOf(300)).toBe('high'); expect(levelOf(1500)).toBe('direct');
  });
  it('comparaison aux besoins', () => {
    const p = { light: { minLevel: 'medium', idealLevel: 'high', maxLevel: 'high', fc: [150, 300], lux: [1615, 3229], windows: ['east'], directSun: 'avoid', src: [0] } } as unknown as Plant;
    expect(lightFit(60, p)).toBe('too-dark');
    expect(lightFit(160, p)).toBe('survives');
    expect(lightFit(300, p)).toBe('good');
    expect(lightFit(1500, p)).toBe('too-bright');
  });
});

describe('diagnostic', () => {
  const mk = (slug: string, problems: Array<[string, string]>) => ({ slug, problems: problems.map(([s, c]) => ({ symptomKey: s, causeKey: c, symptom: 'x', cause: `cause ${c} ${slug}`, remedy: `remedy ${c} ${slug}` })) }) as unknown as Plant;
  const plants = [mk('a', [['yellow-leaves', 'overwatering'], ['brown-tips', 'low-humidity']]), mk('b', [['yellow-leaves', 'overwatering']]), mk('c', [['yellow-leaves', 'underwatering']])];
  it('classe par fréquence', () => {
    const d = diagnose(plants, 'yellow-leaves');
    expect(d[0].causeKey).toBe('overwatering'); expect(d[0].plants).toEqual(['a', 'b']);
    expect(d.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1, 6);
  });
  it('plante choisie et terreau sec', () => {
    const d = diagnose(plants, 'yellow-leaves', { plant: 'c', soil: 'dry' });
    expect(d[0].causeKey).toBe('underwatering'); expect(d[0].remedy).toBe('remedy underwatering c');
  });
  it('symptôme non documenté : aucune cause', () => expect(diagnose(plants, 'no-flowers')).toEqual([]));
  it('symptômes documentés', () => expect(documentedSymptoms(plants)[0]).toEqual({ key: 'yellow-leaves', count: 3 }));
});

describe('ASPCA', () => {
  const rows = (aspca as { plants: AspcaRow[] }).plants;
  it('listes complètes', () => expect(rows.length).toBeGreaterThan(900));
  it('snake plant : toxique chats et chiens', () => {
    const m = searchAspca(rows, 'snake plant');
    expect(m[0].row.s).toBe('snake-plant'); expect(verdict(m[0].row)).toBe('toxic-both');
    expect(aspcaUrl(m[0].row.s)).toBe('https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/snake-plant');
  });
  it('spider plant : sans danger', () => expect(verdict(searchAspca(rows, 'spider plant')[0].row)).toBe('safe-both'));
  it('par nom scientifique', () => expect(searchAspca(rows, 'Epipremnum').some((m) => m.row.s === 'golden-pothos')).toBe(true));
  it('rien pour une requête inconnue ou trop courte', () => { expect(searchAspca(rows, 'qqqzzz')).toEqual([]); expect(searchAspca(rows, 'a')).toEqual([]); });
});
