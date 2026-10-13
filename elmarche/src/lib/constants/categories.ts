export const CATEGORIES = [
  { slug: "mode-accessoires", name: "Mode & Accessoires", shortName: "Mode" },
  { slug: "beaute-soins", name: "Beauté & Soins", shortName: "Beauté" },
  { slug: "maison-deco", name: "Maison & Déco", shortName: "Maison" },
  { slug: "electronique", name: "Électronique", shortName: "Électro" },
  { slug: "artisanat", name: "Artisanat", shortName: "Artisanat" },
  { slug: "sports-loisirs", name: "Sports & Loisirs", shortName: "Sports" },
  { slug: "enfants-bebe", name: "Enfants & Bébé", shortName: "Enfants" },
  { slug: "alimentation", name: "Alimentation", shortName: "Aliments" },
  { slug: "bijoux", name: "Bijoux", shortName: "Bijoux" },
  { slug: "autre", name: "Autre", shortName: "Autre" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function categoryName(slug: string): string | undefined {
  return CATEGORIES.find((category) => category.slug === slug)?.name;
}