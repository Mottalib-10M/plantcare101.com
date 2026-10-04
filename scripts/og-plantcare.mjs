/** Image Open Graph 1200×630 de plantcare101.com (RECETTE §11, §19) : la feuille du favicon à la place
 *  du sigle texte de generate-og-images.mjs, qui réécrirait aussi les icônes avec un carré « PC ».
 *  Usage : node scripts/og-plantcare.mjs   (puis rien d'autre : les icônes restent celles de gen-icons.mjs) */
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
const cfg = JSON.parse(readFileSync('src/data/og.json', 'utf8'));
const A = cfg.accent;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
for (const v of cfg.variants) {
  const lines = v.title.split('\n');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#fff"/><rect width="1200" height="14" fill="${A}"/>
  <g transform="translate(80,62) scale(2.6)"><rect width="32" height="32" rx="7" fill="#EAF6EE"/><path d="M6 26C6 13.8 13.6 5.8 27 5.2c0 13.2-7.6 20.8-21 20.8z" fill="${A}"/><path d="M4.8 27.2L8 24" stroke="${A}" stroke-width="2.6" stroke-linecap="round"/><path d="M8.6 23.4L21.2 10.8" stroke="#EAF6EE" stroke-width="1.8" stroke-linecap="round"/></g>
  <text x="182" y="120" font-family="Georgia, 'Times New Roman', serif" font-size="40" font-weight="700" fill="#0f172a">${esc(v.brand)}</text>
  ${lines.map((l, i) => `<text x="80" y="${270 + i * 80}" font-family="Georgia, 'Times New Roman', serif" font-size="64" font-weight="700" fill="#0f172a">${esc(l)}</text>`).join('')}
  <text x="80" y="${270 + lines.length * 80 + 14}" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#475569">${esc(v.subtitle)}</text>
  <rect x="80" y="536" width="${v.badge.length * 13.5 + 44}" height="48" rx="6" fill="#f1f9f4" stroke="${A}"/><text x="${102 + v.badge.length * 6.75}" y="567" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="600" fill="${A}" text-anchor="middle">${esc(v.badge)}</text></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`public/${v.file}`);
  console.log('✓', v.file);
}
