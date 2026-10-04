/** Sources générales lues pour les outils, les hubs et la page Méthode (lues le 2026-10-04). */
export interface Src { name: string; url: string }
const read = ' (read October 4, 2026)';
export const SRC = {
  ilWatering: { name: 'University of Illinois Extension: Watering houseplants' + read, url: 'https://extension.illinois.edu/houseplants/watering' },
  ilCare: { name: 'University of Illinois Extension: Houseplant care (temperature, humidity, fertilizer)' + read, url: 'https://extension.illinois.edu/houseplants/care' },
  ilRepot: { name: 'University of Illinois Extension: Repotting' + read, url: 'https://extension.illinois.edu/houseplants/repotting' },
  ilLight: { name: 'University of Illinois Extension: Lighting (foot-candles by window)' + read, url: 'https://extension.illinois.edu/houseplants/lighting' },
  ilTrouble: { name: 'University of Illinois Extension: Troubleshooting houseplants' + read, url: 'https://extension.illinois.edu/houseplants/troubleshooting' },
  clWatering: { name: 'Clemson HGIC: Indoor plants, watering' + read, url: 'https://hgic.clemson.edu/factsheet/indoor-plants-watering/' },
  clRepot: { name: 'Clemson HGIC: Indoor plants, transplanting and repotting' + read, url: 'https://hgic.clemson.edu/factsheet/indoor-plants-transplanting-repotting/' },
  clFert: { name: 'Clemson HGIC: Indoor plants, cleaning, fertilizing, containers and light requirements' + read, url: 'https://hgic.clemson.edu/factsheet/indoor-plants-cleaning-fertilizing-containers-light-requirements/' },
  clSoil: { name: 'Clemson HGIC: Indoor plants, soil mixes' + read, url: 'https://hgic.clemson.edu/factsheet/indoor-plants-soil-mixes/' },
  clDisease: { name: 'Clemson HGIC: Houseplant diseases and disorders' + read, url: 'https://hgic.clemson.edu/factsheet/houseplant-diseases-disorders/' },
  clPests: { name: 'Clemson HGIC: Common houseplant insects and related pests' + read, url: 'https://hgic.clemson.edu/factsheet/common-houseplant-insects-related-pests/' },
  ufCare: { name: 'UF/IFAS Gardening Solutions: Houseplant care' + read, url: 'https://gardeningsolutions.ifas.ufl.edu/plants/houseplants/houseplant-care/' },
  aspcaCats: { name: 'ASPCA Animal Poison Control Center: Toxic and non-toxic plant list, cats' + read, url: 'https://www.aspca.org/pet-care/animal-poison-control/cats-plant-list' },
  aspcaDogs: { name: 'ASPCA Animal Poison Control Center: Toxic and non-toxic plant list, dogs' + read, url: 'https://www.aspca.org/pet-care/animal-poison-control/dogs-plant-list' },
} satisfies Record<string, Src>;
