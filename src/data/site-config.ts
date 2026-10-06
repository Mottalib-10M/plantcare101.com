/** Configuration centrale du site (générée par new-site.py). */
export const SITE_URL = "https://plantcare101.com";
export const SITE_NAMES: Record<string, string> = {"en": "PlantCare101"};
export const LANG_TAGS: Record<string, string> = {"en": "en-US"};
export const OG_LOCALES: Record<string, string> = {"en": "en_US"};
export const LOCALE_TAG = 'en-US';
/** Sert seulement au schéma WebApplication (outil gratuit : prix 0). Le site ne manipule aucune somme. */
export const CURRENCY = 'USD';
export const YEAR = 2026;
/** Année de création du site — signal d'ancienneté (RECETTE §8.0). */
export const SITE_FOUNDED = '2026';
export const LAST_UPDATED = '2026-10-04';
export const AUTHOR_NAME = 'Radif Partners';
export const AUTHOR_ROLE: Record<string, string> = {"en": "Publisher of houseplant care guides and calculators · watering, light, repotting, pet safety"};
export const AUTHOR_DESC: Record<string, string> = {"en": "Radif Partners publishes free plant care guides and calculators. Care ranges on this site are read from university extension services, botanical gardens and the ASPCA toxic plant list, with the source and the date it was checked shown on the page."};
/** Sujets sur lesquels l'editeur est competent (schema.org knowsAbout). Ce sont les
 *  themes reellement traites par le site, pas une liste de mots-cles : un sujet
 *  declare ici sans page qui le couvre est une declaration fausse. */
export const KNOWS_ABOUT: Record<string, string[]> = {"en": ["Houseplant care", "Watering schedules", "Indoor light levels", "Repotting", "Plants toxic to cats and dogs"]};
export const CONTACT_EMAIL = "contact@plantcare101.com";
export const THEME_COLOR = '#2D6A45';
export const LOGO_SYMBOL = 'leaf';
export const BING_VERIFY_CODE = '';
export const GOOGLE_VERIFY_CODE = '';
/** Régime de consentement. 'none' = choix de l'éditeur : aucun bandeau, la mesure
 *  d'audience se charge à l'ouverture de la page et n'est décrite que dans les pages
 *  cookies et confidentialité. */
export const CONSENT_MODE: 'opt-in' | 'notice' | 'none' = 'none';
export const GA4_ID = '';
/** Projet Microsoft Clarity (compte amradif). */
export const CLARITY_ID = 'ysy2vg19g5';
export const INDEXNOW_KEY = '7c2e9a41f05b4d6e8a3c1b7f92d4e058';

/* ------------------------------------------------------------------------- *
 * IDENTITÉ LÉGALE — À COMPLÉTER AVANT LA MISE EN LIGNE
 * Ces champs alimentent la mention légale du pays, la politique de confidentialité,
 * la page contact et le schema Organization. Un champ vide s'affiche en jaune
 * sur le site. Contrôle : `npm run check:legal`.
 * ------------------------------------------------------------------------- */
export interface LegalHosting { name: string; address: string; phone: string; url: string }
export interface LegalIdentity {
  entityName: string; legalForm: string; street: string; postalCode: string; city: string;
  country: string; phone: string; registerLabel: string; registerNumber: string;
  vatLabel: string; vatNumber: string; jurisdiction: string;
  supervisoryAuthority: string; supervisoryAuthorityUrl: string; hosting: LegalHosting;
}
export const LEGAL: LegalIdentity = {
  entityName: 'Radif Partners',  // éditeur de tous les sites du portefeuille (RECETTE §8)
  legalForm: '',  // vide : publication à titre personnel, pas de société
  street: '49 rue du Ressort',
  postalCode: '63000',
  city: 'Clermont-Ferrand',
  country: "France",
  phone: '',                 // ligne de contact publiée
  registerLabel: "SIREN",
  registerNumber: '',
  vatLabel: "VAT",
  vatNumber: '',             // laisser vide si non assujetti
  jurisdiction: "France",
  supervisoryAuthority: "Commission nationale de l'informatique et des libertés (CNIL)",
  supervisoryAuthorityUrl: "https://www.cnil.fr",
  hosting: { name: 'GitHub, Inc. (GitHub Pages)', address: '88 Colin P Kelly Jr Street, San Francisco, CA 94107, United States', phone: '', url: 'https://pages.github.com' },
};

/** Champs sans lesquels le site ne doit pas être mis en ligne. */
export const LEGAL_REQUIRED: Array<keyof LegalIdentity> = ['entityName', 'street', 'postalCode', 'city'];

/** Profils publics de l'auteur (schema.org sameAs). Laisser vide si aucun. */
export const AUTHOR_SAME_AS: string[] = [];

/** Rythme de revue éditoriale annoncé sur le site, en mois. */
export const REVIEW_CYCLE_MONTHS = 12;

/* ------------------------------------------------------------------------- *
 * MONÉTISATION — préparée, désactivée (brief du 2026-10-04)
 * ADS_ENABLED : emplacements publicitaires de la trame (AdSlot), jamais au-dessus d'un calculateur.
 * AFFILIATE_ENABLED : encart d'affiliation discret (pots, lampes de culture, terreau) sous les
 * conseils concernés. Les deux restent à false tant que l'éditeur n'a pas choisi ses partenaires ;
 * les liens d'affiliation porteront rel="sponsored nofollow" et une mention visible.
 * ------------------------------------------------------------------------- */
export const ADS_ENABLED = false;
export const AFFILIATE_ENABLED = false;
