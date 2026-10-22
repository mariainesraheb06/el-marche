import Link from "next/link";
import { ChevronDown, X } from "lucide-react";
import { BackButton } from "@/components/layout/back-button";
import { SearchBar } from "@/components/layout/search-bar";
import { ProductGrid } from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { CATEGORIES, categoryName } from "@/lib/constants/categories";
import { WILAYAS, wilayaName } from "@/lib/constants/wilayas";
import { formatPrice } from "@/lib/format";
import { productsQuerySchema } from "@/lib/validators/products";
import { getCurrentUserId } from "@/server/auth";
import { searchProducts } from "@/server/services/products";
import { listFavoriteIds } from "@/server/repositories/favorites";

export const metadata = { title: "Recherche — El Marché" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const STEP = 12;
const MAX_PAGE_SIZE = 50;

const SORTS = [
  { value: "newest", label: "Plus récents" },
  { value: "popular", label: "Popularité" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
];

const fieldClass =
  "h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValues(searchParams: SearchParams): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    const single = Array.isArray(value) ? value[0] : value;
    if (single) result[key] = single;
  }
  return result;
}

function buildHref(params: Record<string, string>, changes: Record<string, string | null>) {
  const next = { ...params };
  for (const [key, value] of Object.entries(changes)) {
    if (value === null) delete next[key];
    else next[key] = value;
  }
  const query = new URLSearchParams(next).toString();
  return query ? `/search?${query}` : "/search";
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = firstValues(searchParams);
  const pageSize = Math.min(Math.max(Number(raw.pageSize) || STEP, STEP), MAX_PAGE_SIZE);

  const parsed = productsQuerySchema.safeParse({ ...raw, page: "1", pageSize: String(pageSize) });
  const query = parsed.success ? parsed.data : productsQuerySchema.parse({ pageSize: STEP });

  const userId = await getCurrentUserId();
  const [result, favoriteIds] = await Promise.all([
    searchProducts(query, userId),
    userId ? listFavoriteIds(userId) : Promise.resolve(new Set<string>()),
  ]);

  const base: Record<string, string> = {};
  if (query.q) base.q = query.q;
  if (query.category) base.category = query.category;
  if (query.wilaya !== undefined) base.wilaya = String(query.wilaya);
  if (query.minPrice !== undefined) base.minPrice = String(query.minPrice);
  if (query.maxPrice !== undefined) base.maxPrice = String(query.maxPrice);
  if (query.sort !== "newest") base.sort = query.sort;

  const chips: { label: string; href: string }[] = [];
  if (query.category) {
    chips.push({
      label: `Catégorie : ${categoryName(query.category) ?? query.category}`,
      href: buildHref(base, { category: null }),
    });
  }
  if (query.wilaya !== undefined) {
    chips.push({
      label: `Wilaya : ${wilayaName(query.wilaya) ?? query.wilaya}`,
      href: buildHref(base, { wilaya: null }),
    });
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const min = formatPrice(query.minPrice ?? 0);
    const max = query.maxPrice !== undefined ? formatPrice(query.maxPrice) : "∞";
    chips.push({
      label: `Prix : ${min} – ${max}`,
      href: buildHref(base, { minPrice: null, maxPrice: null }),
    });
  }

  const title = query.category
    ? (categoryName(query.category) ?? "Recherche")
    : query.q
      ? `Résultats pour « ${query.q} »`
      : "Tous les produits";
  const sortLabel = SORTS.find((sort) => sort.value === query.sort)?.label ?? "Plus récents";
  const hasMore = result.total > result.items.length && pageSize < MAX_PAGE_SIZE;
  const capped = result.total > result.items.length && pageSize >= MAX_PAGE_SIZE;

  return (
    <div className="space-y-4 px-4 pb-8 pt-4 md:px-6 md:pt-6">
      <div className="flex items-center gap-2">
        <BackButton />
        <div className="flex-1">
          <SearchBar defaultValue={query.q ?? ""} />
        </div>
      </div>

      <h1 className="text-2xl font-bold">{title}</h1>

      <details className="group rounded-2xl border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          Filtres et tri
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <form action="/search" className="grid gap-3 border-t p-4 sm:grid-cols-2 lg:grid-cols-3">
          {query.q && <input type="hidden" name="q" value={query.q} />}
          <select
            name="category"
            defaultValue={query.category ?? ""}
            aria-label="Catégorie"
            className={fieldClass}
          >
            <option value="">Toutes les catégories</option>
            {CATEGORIES.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            name="wilaya"
            defaultValue={query.wilaya ?? ""}
            aria-label="Wilaya"
            className={fieldClass}
          >
            <option value="">Toutes les wilayas</option>
            {WILAYAS.map((wilaya) => (
              <option key={wilaya.code} value={wilaya.code}>
                {wilaya.code} - {wilaya.name}
              </option>
            ))}
          </select>
          <select name="sort" defaultValue={query.sort} aria-label="Trier par" className={fieldClass}>
            {SORTS.map((sort) => (
              <option key={sort.value} value={sort.value}>
                Trier par : {sort.label}
              </option>
            ))}
          </select>
          <input
            name="minPrice"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={query.minPrice ?? ""}
            placeholder="Prix min (DA)"
            aria-label="Prix minimum"
            className={fieldClass}
          />
          <input
            name="maxPrice"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={query.maxPrice ?? ""}
            placeholder="Prix max (DA)"
            aria-label="Prix maximum"
            className={fieldClass}
          />
          <Button type="submit" className="h-11 rounded-xl">
            Appliquer
          </Button>
        </form>
      </details>

      {chips.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <li key={chip.label}>
              <Link
                href={chip.href}
                aria-label={`Retirer le filtre ${chip.label}`}
                className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                {chip.label}
                <X className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          {result.total} produit{result.total > 1 ? "s" : ""} trouvé{result.total > 1 ? "s" : ""}
        </p>
        <p>Trier par : {sortLabel}</p>
      </div>

      <ProductGrid products={result.items} favoriteIds={favoriteIds} />

      {hasMore && (
        <Button
          asChild
          variant="outline"
          size="lg"
          className="w-full rounded-2xl border-primary text-primary"
        >
          <Link
            href={buildHref(base, { pageSize: String(Math.min(pageSize + STEP, MAX_PAGE_SIZE)) })}
            scroll={false}
          >
            Voir plus de produits
          </Link>
        </Button>
      )}
      {capped && (
        <p className="text-center text-sm text-muted-foreground">
          Affinez votre recherche avec les filtres pour voir plus de résultats.
        </p>
      )}
    </div>
  );
}