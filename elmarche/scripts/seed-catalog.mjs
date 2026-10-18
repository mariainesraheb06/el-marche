// The full product list: the 160 products of seed-data.mjs plus extra products
// created to match the team's own photos exactly.

import { CATEGORIES } from "./seed-data.mjs";

const EXTRA_ITEMS = {
  electronique: [
    ["Four micro-ondes 23 L", "Four micro-ondes de 23 litres avec plusieurs modes de cuisson et décongélation rapide, intérieur céramique facile à nettoyer.", 24500, 31],
    ["Blender en verre 1,5 L", "Blender avec bol en verre de 1,5 litre, lames en acier inoxydable et base antidérapante pour smoothies et soupes.", 7800, 31],
  ],
  "beaute-soins": [
    ["Palette de fards à paupières 15 teintes", "Palette de 15 fards à paupières aux tons chauds, mats et nacrés, très pigmentés et faciles à estomper.", 3200, 9],
    ["Sérum visage anti-imperfections 30 ml", "Sérum visage à la niacinamide, à l'acide hyaluronique et à l'aloe vera : réduit les imperfections, contrôle le sébum et resserre les pores.", 2900, 9],
  ],
  alimentation: [
    ["Prunes fraîches 1 kg", "Prunes rouges fraîches, juteuses et sucrées, cueillies à maturité.", 450, 16],
    ["Poivrons assortis 1 kg", "Poivrons verts, rouges et orange, frais et croquants, idéaux pour les salades et la cuisine.", 250, 16],
  ],
  artisanat: [
    ["Écharpe au crochet faite main", "Écharpe en laine bleue crochetée à la main, douce et chaude, chaque pièce est unique.", 2600, 19],
  ],
  bijoux: [
    ["Collier de perles nacrées et perles dorées", "Collier de perles nacrées séparées par de petites perles dorées, longueur ajustable.", 3900, 25],
    ["Collier pendentif cercles en argent et zircons", "Collier en argent 925 avec un pendentif de deux cercles sertis de zircons blancs et noirs, finition argentée ou dorée.", 6200, 16],
    ["Bracelet cordon émaillé rouge et doré", "Bracelet à cordon rouge réglable orné de maillons dorés émaillés, plusieurs motifs disponibles.", 2800, 15],
  ],
  "enfants-bebe": [
    ["Boulier en bois coloré", "Boulier en bois avec perles colorées pour apprendre à compter en s'amusant, dès 3 ans.", 2600, 16],
    ["Arche de jeux pour siège auto bébé", "Arche de petits ours colorés à fixer sur le siège auto ou la poussette, elle stimule l'éveil dès la naissance.", 2100, 25],
  ],
  "maison-deco": [
    ["Statues décoratives visages dorés (lot de 3)", "Trois statues décoratives en résine à finition bronze doré, à poser sur une étagère ou une console.", 8800, 25],
    ["Vase cannelé en céramique beige", "Vase cannelé en céramique beige, parfait pour des fleurs séchées ou fraîches, hauteur 28 cm.", 3200, 25],
  ],
  "sports-loisirs": [
    ["Chaussures de football à crampons", "Chaussures de football à crampons moulés pour terrains en herbe, dessus synthétique léger, pointures 38 à 45.", 8900, 19],
  ],
};

export function slugify(title) {
  return title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const STOPWORDS = new Set(["pour", "avec", "dans", "sans", "chez", "lots", "pièces", "pièce"]);

function makeTags(category, title) {
  const words = title
    .toLowerCase()
    .replace(/[(),:.'’]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOPWORDS.has(word) && !/^\d+$/.test(word));
  return [...new Set([category.tag, ...words])].slice(0, 6).map((tag) => tag.slice(0, 30));
}

export const PRODUCTS = CATEGORIES.flatMap((category) => {
  const items = [...category.items, ...(EXTRA_ITEMS[category.slug] ?? [])];
  return items.map(([title, description, price, wilaya, shopKey], index) => ({
    category,
    index,
    title,
    slug: slugify(title),
    description,
    price,
    wilaya,
    shop: shopKey ?? category.shops[index % category.shops.length],
    tags: makeTags(category, title),
  }));
});