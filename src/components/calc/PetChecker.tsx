/**
 * Vérificateur de toxicité pour chats et chiens : recherche dans les 987 entrées des listes ASPCA
 * (données embarquées dans le JS de l'îlot, pas dans le HTML). Le statut affiché est celui de l'ASPCA.
 */
import { useMemo, useState } from 'react';
import SelectField from '../ui/SelectField';
import data from '../../data/aspca-plants.json';
import { searchAspca, verdict, aspcaUrl, type AspcaRow } from '../../lib/engine/petsafe';

const rows = (data as { plants: AspcaRow[] }).plants;
const VERDICT = {
  'safe-both': ['Non-toxic to cats and dogs', 'text-accent-800'],
  'toxic-both': ['Toxic to cats and dogs', 'text-red-800'],
  'toxic-cats': ['Toxic to cats, non-toxic to dogs', 'text-red-800'],
  'toxic-dogs': ['Toxic to dogs, non-toxic to cats', 'text-red-800'],
  partial: ['Listed for one species only', 'text-amber-800'],
} as const;
const status = (s: AspcaRow['c']) => (s === 'toxic' ? 'Toxic' : s === 'non-toxic' ? 'Non-toxic' : 'Not listed');

interface Props { defaultQuery?: string; plantPages?: Record<string, string>; idPrefix?: string; compact?: boolean }

export default function PetChecker({ defaultQuery = 'snake plant', plantPages = {}, idPrefix = 'pet', compact = false }: Props) {
  const [q, setQ] = useState(defaultQuery);
  const [pet, setPet] = useState<'both' | 'cats' | 'dogs'>('both');
  const matches = useMemo(() => searchAspca(rows, q, compact ? 5 : 10), [q, compact]);
  const shown = matches.filter((m) => pet === 'both' || (pet === 'cats' ? m.row.c : m.row.d));
  const top = shown[0];
  return (
    <div className="rechner rounded-xl border border-navy-200 bg-white p-4 sm:p-6">
      <form onSubmit={(e) => e.preventDefault()} className="grid content-start grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="grid grid-rows-subgrid row-span-3 content-start gap-y-0">
          <label htmlFor={`${idPrefix}-q`} className="mb-1 block text-sm font-medium text-navy-700">Plant name (common or botanical)</label>
          <input id={`${idPrefix}-q`} type="text" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" spellCheck={false}
            className="h-12 w-full rounded-lg border border-navy-300 bg-white px-4 text-lg text-navy-900 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20" />
          <p className="mt-1 text-xs text-navy-600">Searches the ASPCA cat and dog plant lists: {rows.length.toLocaleString('en-US')} entries</p>
        </div>
        <SelectField id={`${idPrefix}-pet`} label="Your pet" value={pet} onChange={(v) => setPet(v as typeof pet)} options={[{ value: 'both', label: 'Cat and dog' }, { value: 'cats', label: 'Cat' }, { value: 'dogs', label: 'Dog' }]} />
      </form>
      <div aria-live="polite" className="mt-5">
        {top ? (
          <div className="rounded-lg border border-accent-200 bg-accent-50 p-4 sm:p-5">
            <p className="text-sm font-medium text-navy-700">{top.row.n}{top.row.sci && <> · <i>{top.row.sci}</i></>}</p>
            <p className={`mt-1 font-serif text-3xl font-bold ${VERDICT[verdict(top.row)][1]}`}>
              {pet === 'both' ? VERDICT[verdict(top.row)][0] : `${status(pet === 'cats' ? top.row.c : top.row.d)} to ${pet}`}
            </p>
            <p className="mt-2 text-sm text-navy-800">Cats: <strong>{status(top.row.c)}</strong> · Dogs: <strong>{status(top.row.d)}</strong>{top.row.a && <> · Also called {top.row.a}</>}</p>
            <p className="mt-2 text-sm"><a href={aspcaUrl(top.row.s)} target="_blank" rel="nofollow noopener noreferrer" className="font-medium text-accent-800 underline">Read the ASPCA entry</a>{plantPages[top.row.s] && <> · <a href={plantPages[top.row.s]} className="font-medium text-accent-800 underline">Our care guide</a></>}</p>
          </div>
        ) : (
          <p className="rounded-lg border border-navy-200 bg-navy-50 p-4 text-sm text-navy-800">{q.trim().length < 2 ? 'Type at least two letters.' : 'Not found in the ASPCA lists. That does not mean the plant is safe: try its botanical name, or ask your veterinarian.'}</p>
        )}
        {shown.length > 1 && (
          <table className="journal mt-4 w-full text-sm">
            <thead><tr><th scope="col" className="py-1.5 pr-2 text-left">Other matches</th><th scope="col" className="py-1.5 pr-2 text-left">Cats</th><th scope="col" className="py-1.5 text-left">Dogs</th></tr></thead>
            <tbody>{shown.slice(1).map((m) => (
              <tr key={m.row.s} className="border-t border-navy-200">
                <td className="py-1.5 pr-2"><a href={aspcaUrl(m.row.s)} target="_blank" rel="nofollow noopener noreferrer" className="text-accent-800 underline">{m.row.n}</a>{m.row.sci && <span className="text-navy-600"> · <i>{m.row.sci}</i></span>}</td>
                <td className="py-1.5 pr-2">{status(m.row.c)}</td><td className="py-1.5">{status(m.row.d)}</td>
              </tr>))}</tbody>
          </table>
        )}
        <p className="mt-3 text-xs text-navy-600">If your pet ate a plant, call your veterinarian or the ASPCA Animal Poison Control Center, (888) 426-4435.</p>
      </div>
    </div>
  );
}
