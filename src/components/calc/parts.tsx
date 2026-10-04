/** Pièces communes des calculateurs : carte de résultat (seule pièce spectaculaire, §10.2), lignes
 *  de détail avec barre proportionnelle, formatage US. */
import type { ReactNode } from 'react';

export const fmt = (n: number, d = 0) => new Intl.NumberFormat('en-US', { maximumFractionDigits: d, minimumFractionDigits: 0 }).format(n);
/** Fraction lisible pour les cuillères : 0.125 → "1/8". */
export function fraction(x: number): string {
  if (x >= 10) return fmt(x, 0);
  const whole = Math.floor(x);
  const rest = x - whole;
  const fr: Array<[number, string]> = [[0, ''], [0.125, '1/8'], [0.25, '1/4'], [0.333, '1/3'], [0.5, '1/2'], [0.667, '2/3'], [0.75, '3/4'], [1, '']];
  let best = fr[0];
  for (const f of fr) if (Math.abs(rest - f[0]) < Math.abs(rest - best[0])) best = f;
  const w = best[0] === 1 ? whole + 1 : whole;
  if (Math.abs(rest - best[0]) > 0.06) return fmt(x, 2);
  return [w ? String(w) : '', best[1]].filter(Boolean).join(' ') || '0';
}

export function ResultCard({ label, value, sub, children }: { label: string; value: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div aria-live="polite" className="rounded-lg border border-accent-200 bg-accent-50 p-4 sm:p-5">
      <p className="text-sm font-medium text-navy-700">{label}</p>
      <p className="tabular-nums mt-1 font-serif text-4xl font-bold text-accent-800">{value}</p>
      {sub && <div className="mt-1 text-sm text-navy-700">{sub}</div>}
      {children}
    </div>
  );
}

export function Rows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <table className="journal mt-3 w-full text-sm"><tbody>
      {rows.map(([l, v]) => <tr key={l} className="border-t border-navy-200"><td className="py-1.5 pr-3 text-navy-700">{l}</td><td className="tabular-nums py-1.5 text-right font-medium text-navy-900">{v}</td></tr>)}
    </tbody></table>
  );
}

/** Ligne de facteur : multiplicateur et barre (1 = référence). */
export function FactorBars({ factors }: { factors: Array<{ label: string; mult: number }> }) {
  return (
    <ul className="mt-3 space-y-1.5 text-sm">
      {factors.map((f) => {
        const pct = Math.min(100, Math.max(8, (f.mult / 1.8) * 100));
        return (
          <li key={f.label} className="grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-2">
            <span className="text-navy-700">{f.label}<span className="mt-1 block h-1.5 rounded bg-navy-100"><span className="block h-1.5 rounded bg-accent-500" style={{ width: `${pct}%` }} /></span></span>
            <span className="tabular-nums text-right text-navy-900">×{fmt(f.mult, 2)}</span>
          </li>
        );
      })}
    </ul>
  );
}
