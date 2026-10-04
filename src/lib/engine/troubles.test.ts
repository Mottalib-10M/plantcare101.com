import { describe, it, expect } from 'vitest';
import { brownTips, overUnder, rootRotPlan, pestPlan } from './troubles';

describe('pointes brunes', () => {
  it('croûte blanche et engrais fréquent : sels en tête', () => {
    expect(brownTips({ air: 'average', water: 'tap', monthsSinceFlush: 8, feedEveryWeeks: 2, habit: 'regular', whiteCrust: true, fluorideSensitive: false })[0].cause).toBe('salts');
  });
  it('air sec seul : humidité en tête', () => {
    expect(brownTips({ air: 'dry', water: 'filtered', monthsSinceFlush: 1, feedEveryWeeks: 0, habit: 'regular', whiteCrust: false, fluorideSensitive: false })[0].cause).toBe('low-humidity');
  });
  it('plante sensible au fluor arrosée au robinet', () => {
    const r = brownTips({ air: 'humid', water: 'tap', monthsSinceFlush: 1, feedEveryWeeks: 0, habit: 'regular', whiteCrust: false, fluorideSensitive: true });
    expect(r[0].cause).toBe('water-quality');
  });
  it('aucun signal : aucune cause', () => {
    expect(brownTips({ air: 'humid', water: 'filtered', monthsSinceFlush: 1, feedEveryWeeks: 0, habit: 'regular', whiteCrust: false, fluorideSensitive: false })).toEqual([]);
  });
});

describe('trop ou pas assez', () => {
  it('terreau détrempé, odeur, pot lourd : excès, certitude haute', () => {
    expect(overUnder({ soil: 'wet', leaves: 'soft-limp', lowerYellow: true, smell: true, potWeight: 'heavy' })).toMatchObject({ verdict: 'overwatered', confidence: 'high' });
  });
  it('terreau sec, feuilles cassantes, pot léger : manque', () => {
    expect(overUnder({ soil: 'dry', leaves: 'crispy', lowerYellow: false, smell: false, potWeight: 'light' }).verdict).toBe('underwatered');
  });
  it('signaux contradictoires : incertain', () => {
    expect(overUnder({ soil: 'damp', leaves: 'normal', lowerYellow: false, smell: false, potWeight: 'unsure' }).verdict).toBe('unclear');
  });
});

describe('pourriture des racines', () => {
  it('seuils', () => {
    expect(rootRotPlan({ rottenPct: 10, healthyStems: true, potIn: 6 })).toMatchObject({ action: 'trim-repot', newPotIn: 6 });
    expect(rootRotPlan({ rottenPct: 50, healthyStems: true, potIn: 8 })).toMatchObject({ action: 'trim-repot-smaller', newPotIn: 6 });
    expect(rootRotPlan({ rottenPct: 90, healthyStems: true, potIn: 8 }).action).toBe('propagate');
    expect(rootRotPlan({ rottenPct: 90, healthyStems: false, potIn: 8 }).action).toBe('discard');
  });
});

describe('ravageurs', () => {
  it('isolement puis traitements hebdomadaires', () => {
    const p = pestPlan('spider-mites', 'heavy');
    expect(p[0].week).toBe(0); expect(p.length).toBe(5); expect(p[1].action).toMatch(/insecticidal soap/);
    expect(pestPlan('fungus-gnats', 'light').some((s) => /BTI/.test(s.action))).toBe(true);
    expect(pestPlan('mealybugs', 'heavy').at(-1)!.action).toMatch(/discarding/);
  });
});
