import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { MobileTopBar } from "@/components/layout/mobile-top-bar";
import { SearchBar } from "@/components/layout/search-bar";
import { CategoryCircles } from "@/components/product/category-circles";
import { ProductGrid } from "@/components/product/product-grid";
import { RecommendedSection } from "@/components/product/recommended-section";
import { productsQuerySchema } from "@/lib/validators/products";
import { getCurrentUserId } from "@/server/auth";
import { searchProducts } from "@/server/services/products";
import { getRecommendedProducts } from "@/server/services/recommendations";
import { listFavoriteIds } from "@/server/repositories/favorites";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const userId = await getCurrentUserId();

  const [latest, recommended, favoriteIds] = await Promise.all([
    searchProducts(productsQuerySchema.parse({ pageSize: 8 }), null),
    getRecommendedProducts(userId),
    userId ? listFavoriteIds(userId) : Promise.resolve(new Set<string>()),
  ]);

  return (
    <div className="space-y-6 px-4 pb-8 pt-4 md:px-6 md:pt-6">
      <MobileTopBar />
      <SearchBar />

      <section className="relative overflow-hidden rounded-2xl bg-primary px-6 py-8 text-primary-foreground md:px-10 md:py-14">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-black/30"
        />
        <div aria-hidden className="zellige absolute inset-0 opacity-[0.07]" />
        <div aria-hidden className="float-slow absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,hsl(var(--accent)/0.35),transparent_70%)]" />
        <div className="relative max-w-xl space-y-4 fade-up">
          <h1 className="text-3xl font-bold leading-tight md:text-5xl">
            Soutenir les petites entreprises algériennes n&apos;a jamais été aussi simple.
          </h1>
          <div className="flex flex-wrap gap-2">
            <span className="glass rounded-full px-3 py-1 text-xs font-semibold">Fait en Algérie</span>
            <span className="glass rounded-full px-3 py-1 text-xs font-semibold">58 wilayas</span>
          </div>
          <p className="text-sm text-primary-foreground/90 md:text-base">
            Tout l&apos;Algérie, en un seul endroit.
          </p>
          <Link
            href="/search"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
          >
            Découvrir le marché
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section aria-labelledby="categories-title" className="space-y-3">
        <h2 id="categories-title" className="text-xl font-bold">
          Explorer par catégorie
        </h2>
        <CategoryCircles />
      </section>

      <RecommendedSection products={recommended} favoriteIds={favoriteIds} />

      <section aria-labelledby="latest-title" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="latest-title" className="text-xl font-bold">
            Nouveautés
          </h2>
          <Link href="/search" className="text-sm font-semibold text-primary">
            Voir tout
          </Link>
        </div>
        <ProductGrid products={latest.items} favoriteIds={favoriteIds} />
      </section>

      <section className="flex items-center gap-3 rounded-2xl border bg-card p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold">Transactions fiables</p>
          <p className="text-xs text-muted-foreground">
            Soutien direct aux artisans locaux sans intermédiaires.
          </p>
        </div>
      </section>
    </div>
  );
}