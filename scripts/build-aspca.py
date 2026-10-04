#!/usr/bin/env python3
"""Jeu de données de l'outil « Pet-safe plant checker » : les listes officielles de l'ASPCA.

Rejouable : python3 scripts/build-aspca.py  → src/data/aspca-plants.json
Source : ASPCA Animal Poison Control Center, « Toxic and Non-Toxic Plant List — Cats » et « — Dogs »
(deux pages, chacune divisée en « Plants Toxic to … » et « Plants Non-Toxic to … »). On ne garde que
ce que ces listes disent : nom, autres noms, nom scientifique, famille, statut chats, statut chiens,
et le slug de la fiche ASPCA (l'URL complète se reconstruit dans le site). Rien n'est déduit.
À relancer à chaque revue annuelle du site, puis `npx vitest run`.
"""
import html, json, re, subprocess, sys, datetime, os

LISTS = {
    'cats': 'https://www.aspca.org/pet-care/animal-poison-control/cats-plant-list',
    'dogs': 'https://www.aspca.org/pet-care/animal-poison-control/dogs-plant-list',
}
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36'

def fetch(url):
    r = subprocess.run(['curl', '-sL', '--max-time', '60', '-A', UA, url], capture_output=True, text=True, errors='ignore')
    if r.returncode or len(r.stdout) < 50000:
        sys.exit(f'Lecture impossible ou page tronquée : {url}')
    return r.stdout

def parse(doc):
    out, status = {}, None
    for part in re.split(r'(<h2>.*?</h2>)', doc, flags=re.S):
        if part.startswith('<h2>'):
            h = part.lower()
            status = 'non-toxic' if 'non-toxic' in h else ('toxic' if 'toxic' in h else None)
            continue
        if not status:
            continue
        for m in re.finditer(r'toxic-and-non-toxic-plants/([a-z0-9-]+)">(.*?)</a>(.*?)</span>', part, re.S):
            extra = html.unescape(re.sub(r'<[^>]+>', '', m.group(3)))
            sci = re.search(r'Scientific Names?:\s*([^|]+)', extra)
            fam = re.search(r'Family:\s*(.+)', extra)
            aka = re.sub(r'\s*\|.*', '', extra, flags=re.S).strip(' ()\n')
            out[m.group(1)] = dict(status=status, name=html.unescape(m.group(2)).strip(),
                                   scientific=(sci.group(1).strip() if sci else ''),
                                   family=(fam.group(1).strip() if fam else ''), aka=aka)
    return out

data = {k: parse(fetch(u)) for k, u in LISTS.items()}
if min(len(v) for v in data.values()) < 500:
    sys.exit(f'Listes anormalement courtes : { {k: len(v) for k, v in data.items()} }')
rows = []
for slug in sorted(set(data['cats']) | set(data['dogs'])):
    s = data['cats'].get(slug) or data['dogs'].get(slug)
    rows.append({'s': slug, 'n': s['name'], 'a': s['aka'], 'sci': s['scientific'], 'f': s['family'],
                 'c': data['cats'][slug]['status'] if slug in data['cats'] else None,
                 'd': data['dogs'][slug]['status'] if slug in data['dogs'] else None})
out = {'source': 'ASPCA Animal Poison Control Center, Toxic and Non-Toxic Plant Lists (cats, dogs)',
       'lists': LISTS, 'retrieved': datetime.date.today().isoformat(), 'count': len(rows), 'plants': rows}
dest = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'data', 'aspca-plants.json')
json.dump(out, open(dest, 'w'), ensure_ascii=False, separators=(',', ':'))
print(f'{len(rows)} plantes ({len(data["cats"])} chats, {len(data["dogs"])} chiens) -> src/data/aspca-plants.json')
