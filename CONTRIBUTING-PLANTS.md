# Ajouter une plante (ou un guide) à plantcare101.com

Notice pour les agents qui prolongent le site après l'étape A. À lire en entier avant d'écrire une
ligne, avec `~/Documents/GitHub/RECETTE-SITE.md` (§6, §7, §9.3, §11, §21, §26).

## Principe

Une plante = **un fichier** `src/data/plants/<slug>.json`. Rien d'autre à toucher.

Au build, le fichier est validé par `src/lib/plant-schema.ts` (zod), puis il alimente seul :
- la page `/plants/<slug>/` ;
- les menus et le pied de page ;
- l'index `/plants/` et les trois hubs (best, low light, pets) ;
- les outils : liste du calculateur d'arrosage, diagnostic, light finder, pot ;
- le maillage (plantes liées) et le sitemap.

Un fichier incomplet fait **échouer le build** avec la liste des champs fautifs.

Même logique pour un guide de problème : `src/data/guides/<slug>.json`, schéma `src/lib/guide-schema.ts`.
Il faut aussi ajouter le slug à `GUIDE_ORDER` dans `src/lib/guides.ts` pour fixer sa place dans les menus.

## Étapes

1. **Vérifier la demande.** La requête « <plant> care » doit avoir un volume mesuré au Keyword Planner (RECETTE §2.0 ; relevé du site : `~/Documents/GitHub/reports/volumes-2026-10-04/us-plantcare-exact.txt`). Candidates déjà mesurées entre 1 000 et 10 000 recherches : string of pearls, money tree, hoya, alocasia, boston fern, croton, gardenia, lavender, rosemary, basil.
2. **Lire les sources**, et seulement celles-ci :
   - NC State Extension Plant Toolbox : `https://plants.ces.ncsu.edu/plants/<genre>-<espece>/` ;
   - Clemson HGIC : la liste des fiches est dans le sitemap `https://hgic.clemson.edu/factsheet-sitemap.xml` et `-sitemap2.xml` ;
   - University of Illinois Extension : `https://extension.illinois.edu/houseplants/...` ;
   - UF/IFAS (EDIS, Gardening Solutions) ;
   - UMN Extension : bloquée aux robots (403), ne pas contourner ;
   - Missouri Botanical Garden Plant Finder : son moteur de recherche renvoie une erreur 500, il faut l'URL directe ;
   - RHS ;
   - **ASPCA** pour la toxicité : l'index des 987 entrées est dans `src/data/aspca-plants.json`, clé `s` = slug de la fiche ASPCA.

   Les pages Clemson et ASPCA demandent un user-agent de navigateur : un `curl` nu reçoit une page vide.
3. **Écrire le JSON** en copiant la structure d'une fiche existante, jamais ses phrases :
   - `snake-plant.json` pour une plante simple ;
   - `succulents.json` ou `bonsai.json` pour une fiche de groupe (`isGroup: true`).
4. **Valider la fiche seule** : `PLANT_FILES=<slug>.json npx vitest run tests/plants.test.ts`.
5. **Passer tous les contrôles** (voir plus bas), puis faire un commit local en français, dernière ligne `Co-Authored-By: …`.

## Les champs, et la règle de vérité

Un chiffre de soins vient d'une source lue et citée. Chaque bloc de soins liste ses sources dans `src`, qui donne les index dans `sources` :
- `light`, `water`, `soil`, `humidity`, `temperature`, `fertilizer`, `repotting`, `toxicity`, `size`.

**Un chiffre incertain ne se publie pas.** Les champs facultatifs restent absents plutôt qu'estimés :
- `soil.ph`, `humidity.idealPct`, `temperature.idealF/idealC`, `maxF/maxC` ;
- `repotting.everyYears`, `size.heightIn` (alors `size.note`), `size.widthIn`, `size.growth`.

| Champ | Contenu |
|---|---|
| `slug` | Égal au nom du fichier, en minuscules avec tirets. C'est l'URL `/plants/<slug>/`. |
| `commonName`, `otherNames`, `botanicalName`, `formerNames`, `family` | Noms. Le nom botanique est celui de la source la plus récente ; l'ancien nom va dans `formerNames`. |
| `kind` | `foliage`, `succulent`, `cactus`, `flowering`, `bonsai` ou `shrub` (sert aux filtres). |
| `light.minLevel / idealLevel / maxLevel` | Niveaux de l'Illinois Extension : `low` 75 fc, `medium` 150, `high` 300, `direct` 1 500. |
| `light.fc`, `light.lux` | Valeurs du minLevel et du maxLevel, sauf si une source donne des foot-candles propres à la plante. Le lux vaut fc × 10,764 (le schéma vérifie à ± 3 %). Le light finder compare à `fc` : garder la même échelle que la table Illinois (voir le cas de l'orchidée). |
| `light.windows`, `light.directSun` | Fenêtres conseillées ; `avoid`, `morning-only`, `tolerates` ou `needs`. |
| `water.rule` | Une des 6 règles de séchage : `evenly-moist`, `top-inch`, `top-2-inches`, `half-dry`, `fully-dry`, `bark-dry`. C'est elle qui pilote le calculateur d'arrosage. |
| `water.ruleText`, `winter`, `factors` | La règle en clair, l'hiver, et les pièges propres à la plante. |
| `soil` | `mix`, `components`, `ph` facultatif. |
| `humidity` | `level` (`low`, `average` ou `high`), `note`, `idealPct` facultatif. |
| `temperature` | `minF` et `minC` obligatoires et cohérents (le schéma vérifie la conversion). |
| `fertilizer` | `season`, `everyWeeks` [min, max], `strength` (`full`, `half` ou `quarter`), `type`, `winter` (`none` ou `reduced`). Une règle générale citée (Illinois `care` : tous les 1 à 3 mois, de mars à septembre) est admise faute de mieux. |
| `repotting` | `signs` (au moins 2), `season`, `rootType`, `prefersSnug`. La règle de pot (1 à 2 in de plus, Clemson) est dans le moteur. |
| `toxicity` | Statut chats et chiens, et pour l'humain une note. Pour chaque fiche ASPCA lue, une entrée dans `aspca` avec le nom, les statuts, l'URL, les principes toxiques et les signes cliniques tels qu'écrits par l'ASPCA. Sans fiche ASPCA : `aspcaListed: false`, `aspca: []`, une autre source citée, et la liste ASPCA consultée dans `sources`. |
| `problems` | 5 à 7 lignes symptôme → cause → remède. `symptomKey` et `causeKey` sont pris dans les listes du schéma ; ils alimentent l'outil de diagnostic. |
| `propagation`, `size`, `varieties` | Méthodes et saison ; taille en pouces ; variétés citées par les sources. |
| `sources` | Au moins 2, toujours en `https`, avec `accessed` (date ISO). La fiche ASPCA ou la liste ASPCA est obligatoire. |
| `verified` | Date de la vérification. |
| `seo.title` | 50 à 60 caractères. Commence par « <Plant> Care », contient l'année, jamais How, What ni Calculator en tête, pas de tiret cadratin. |
| `seo.description` | 150 à 160 caractères, avec l'année et un fait sourcé. Compter avec python. |
| `seo.h1` | « <plant> care: … », sans année. |
| `content` | Toute la prose, voir ci-dessous. |

**Pièges ASPCA connus** :
- « Fiddle-Leaf » est un philodendron, pas Ficus lyrata ;
- « Rubber Plant » et « Baby Rubber Plant » sont des Peperomia ;
- « Bird of Paradise » tout court est Caesalpinia gilliesii : prendre « Bird of Paradise Flower » (Strelitzia) ;
- « Prayer Plant » est rangé sous Calathea insignis ;
- ZZ plant et Juniperus n'ont pas de fiche.

## Ton et longueur

- **Langue** : anglais américain, °F d'abord (°C entre parenthèses), pouces, cups et gallons.
- **Voix** : humaine, phrases de longueur variable, le chiffre d'abord.
- **Interdits** :
  - le tiret cadratin et le demi-cadratin ;
  - « it's important to note », « dive into », « whether you're… » ;
  - « Additionally / Moreover » en enfilade, les triplets systématiques, les conclusions-résumés, les émojis.
- **Jamais d'intervalle d'arrosage en jours dans la prose**, sauf s'il est cité d'une source. Le calculateur donne la fourchette.
- **Longueurs** :
  - `content.answer` : environ 40 mots (30 à 55) ;
  - `content.intro` : UN paragraphe de 125 mots ou plus, citable seul (bloc §21) ;
  - prose propre à la plante (hors FAQ et answer) : 950 mots au minimum, viser 1 100 à 1 400 ;
  - sections : light, water (2 paragraphes ou plus), soil, humidity, temperature, fertilizer, repotting, propagation, problems, petSafety ;
  - `content.faq` : 4 à 6 vraies questions, le nom de la plante dedans, réponses de 40 à 90 mots. Une question ne doit exister nulle part ailleurs sur le site (le test le vérifie).
- **Unicité** : `check-unique` compare toutes les pages, chiffres neutralisés, avec un seuil de 30 % (pic actuel 4,6 %). Écrivez la biologie propre à la plante : rhizome, pseudobulbe, épiphyte, feuilles qui se ferment la nuit… Ne reprenez aucune tournure d'une autre fiche.

## Contrôles à passer (tous à 0)

```bash
cd ~/Documents/GitHub/a-publier/Mottalib-10M/plantcare101.com
export NODE_PATH=$(npm root -g):$PWD/node_modules
S=~/Documents/GitHub/_trame/_template/scripts
npm run build                       # inclut typo-nbsp et check-snippets (bloquant)
npx vitest run
python3 $S/check-seo.py .
python3 $S/check-trame.py .
python3 $S/check-unique.py .
python3 $S/check-simulateurs.py .
node $S/check-contraste.mjs .
node $S/check-saisie.mjs . --max=60
node $S/check-nombres.mjs .
node scripts/check-legal.mjs
node scripts/typo-nbsp.mjs dist --check
python3 scripts/check-liens.py .
node $S/check-layout.mjs . > /tmp/layout.log 2>&1   # long : en arrière-plan
node $S/check-sources.mjs .
```

**Deux limites connues des contrôles** :
- **`check-sources.mjs`** lance toutes ses requêtes en parallèle. Avec environ 140 URL, l'ASPCA, le RHS et MoBot coupent une partie des connexions, qui sortent « injoignables » (de 30 à 51 selon l'essai). Revérifier en série avec `curl` (au 2026-10-04 : 139 URL sur 139 en 200) avant de conclure.
- **L'accueil `/`** est sauté par `check-seo.py` et contrôlé par `check-trame.py` comme une page de redirection : la trame suppose une racine `/` qui redirige vers `/en/`, alors qu'ici la racine est l'accueil. Pour le contrôler comme une page pilier :
  1. copier `dist/` ailleurs ;
  2. déplacer `index.html` dans `accueil/index.html` ;
  3. lancer `check-seo` et `check-trame` sur la copie (résultat au 2026-10-04 : 2 217 mots, 0 défaut).

**Ensuite** :
- régénérer `public/llms.txt` avec `python3 scripts/build-llms.py` ;
- relancer `python3 scripts/build-aspca.py` à chaque revue annuelle (listes ASPCA) ;
- après une modification de `public/favicon.svg`, relancer `node scripts/gen-icons.mjs` ;
- refaire l'image OG avec `npm run og`. Ne pas lancer `generate-og-images.mjs`, qui réécrirait les icônes avec un carré « PC ».

## Ce qu'on ne fait pas

- Pas de dépôt GitHub ni de push sans validation de l'éditeur, pas de DNS.
- Ne pas toucher à `_trame` ni à la RECETTE : les suggestions vont dans le compte rendu.
- Monétisation : `ADS_ENABLED` et `AFFILIATE_ENABLED` restent à `false` dans `src/data/site-config.ts` tant que l'éditeur n'a pas choisi ses partenaires.
