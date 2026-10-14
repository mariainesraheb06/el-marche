import Link from "next/link";
import {
  Apple,
  Baby,
  Brush,
  Dumbbell,
  Gem,
  Package,
  Shirt,
  Smartphone,
  Sofa,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { CATEGORIES } from "@/lib/constants/categories";

const ICONS: Record<string, LucideIcon> = {
  "mode-accessoires": Shirt,
  "beaute-soins": Sparkles,
  "maison-deco": Sofa,
  electronique: Smartphone,
  artisanat: Brush,
  "sports-loisirs": Dumbbell,
  "enfants-bebe": Baby,
  alimentation: Apple,
  bijoux: Gem,
  autre: Package,
};

export function CategoryCircles() {
  return (
    <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0 [scrollbar-width:none]">
      {CATEGORIES.map((category) => {
        const Icon = ICONS[category.slug] ?? Package;
        return (
          <Link
            key={category.slug}
            href={`/categories/${category.slug}`}
            className="flex w-16 shrink-0 flex-col items-center gap-2 text-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full border bg-card text-primary">
              <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="text-xs font-medium">{category.shortName}</span>
          </Link>
        );
      })}
    </div>
  );
}