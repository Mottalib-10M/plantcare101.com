#!/usr/bin/env python3
"""Régénère public/llms.txt depuis les fiches et les guides (RECETTE §21). Usage : python3 scripts/build-llms.py"""
import json, glob, os
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
plants = sorted((json.load(open(f)) for f in glob.glob(f'{R}/src/data/plants/*.json')), key=lambda d: d['commonName'])
guides = [json.load(open(f)) for f in sorted(glob.glob(f'{R}/src/data/guides/*.json'))]
U = 'https://plantcare101.com'
L = ['# PlantCare101', '', f'> Houseplant care guides for {len(plants)} indoor plants, each with a watering calculator set to the plant, and six tools: watering calculator, pet-safe plant checker (ASPCA cat and dog lists), plant problem diagnosis, window light finder, fertilizer dilution and pot size. Care figures come from university extension services (NC State, Clemson HGIC, University of Illinois, UF/IFAS), the Missouri Botanical Garden, the RHS and the ASPCA, each cited with the date it was read. Published by Radif Partners. US English.', '', '## Plant guides']
L += [f"- [{p['commonName']} care]({U}/plants/{p['slug']}/): {p['content']['answer']}" for p in plants]
L += ['', '## Problem guides'] + [f"- [{g['nav']}]({U}/guides/{g['slug']}/): {g['answer']}" for g in guides]
L += ['', '## Tools'] + [f'- [{n}]({U}/tools/{s}/)' for n, s in [('Watering calculator', 'watering-calculator'), ('Pet-safe plant checker', 'pet-safe-plant-checker'), ('Plant problem diagnosis', 'plant-problem-diagnosis'), ('Which plant for my light', 'plant-light-finder'), ('Fertilizer dilution calculator', 'fertilizer-dilution-calculator'), ('Pot size calculator', 'pot-size-calculator')]]
L += ['', '## Method', f'- [How we calculate]({U}/methodology/): watering ranges are estimates built from each plant\'s drying rule and documented multipliers, never a fixed date.']
open(f'{R}/public/llms.txt', 'w').write('\n'.join(L) + '\n')
print(f'llms.txt : {len(plants)} plantes, {len(guides)} guides')
