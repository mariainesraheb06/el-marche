import Image from "next/image";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Phone, ShoppingBag } from "lucide-react";
import { BackButton } from "@/components/layout/back-button";
import { FavoriteButton } from "@/components/product/favorite-button";
import { ViewTracker } from "@/components/product/view-tracker";
import { createClient } from "@/lib/supabase/server";
import { wilayaName } from "@/lib/constants/wilayas";
import { formatPrice, whatsappLink } from "@/lib/format";
import { productIdSchema } from "@/lib/validators/products";
import { getProduct, getSimilarProducts } from "@/server/services/products";
import { listFavoriteIds } from "@/server/repositories/favorites";
import { RecommendedSection } from "@/components/product/recommended-section";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProductPage({ params }: { params: { id: string } }) {
  if (!productIdSchema.safeParse(params.id).success) notFound();

  const product = await getProduct(params.id);
  if (!product) notFound();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const favoriteIds = user ? await listFavoriteIds(user.id) : new Set<string>();
  const isFavorited = favoriteIds.has(product.id);

  const sellerName = product.seller?.shopName ?? product.seller?.fullName ?? null;
  const contact = product.seller?.whatsappNumber
    ? whatsappLink(product.seller.whatsappNumber, product.title)
    : null;
  const wilaya = wilayaName(product.wilayaCode);

  return (
    <article className="pb-8 md:px-6 md:pt-6">
      <ViewTracker productId={product.id} />

      <div className="flex items-center gap-2 px-4 py-3 md:px-0">
        <BackButton fallbackHref="/search" />
        <span className="font-heading text-lg font-bold md:hidden">Détails du produit</span>
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-8 md:items-start">
        {/* Left column: Image constrained to a max width on desktop */}
        <div className="w-full md:max-w-md">
          {product.images.length > 0 ? (
            <div className="flex snap-x snap-mandatory overflow-x-auto md:rounded-2xl [scrollbar-width:none]">
              {product.images.map((image, index) => (
                <div
                  key={image.id}
                  className="relative aspect-square w-full shrink-0 snap-center bg-secondary"
                >
                  <Image
                    src={image.url}
                    alt={index === 0 ? product.title : `${product.title}, photo ${index + 1}`}
                    fill
                    priority={index === 0}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex aspect-square items-center justify-center bg-secondary text-muted-foreground md:rounded-2xl">
              <ShoppingBag className="h-12 w-12" aria-hidden />
              <span className="sr-only">Pas d&apos;image</span>
            </div>
          )}
          {product.images.length > 1 && (
            <p className="px-4 pt-2 text-xs text-muted-foreground md:px-0">
              Glissez pour voir les {product.images.length} photos
            </p>
          )}
        </div>

        {/* Right column: Product details */}
        <div className="space-y-4 px-4 pt-4 md:px-0 md:pt-0">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={`/categories/${product.category.slug}`}
              className="rounded-md bg-secondary px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-accent"
            >
              {product.category.name}
            </Link>
            {wilaya && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" aria-hidden />
                {wilaya}, Wilaya {product.wilayaCode}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold leading-tight md:text-3xl">{product.title}</h1>
          <p className="font-heading text-3xl font-bold text-primary">
            {formatPrice(product.priceDzd)}
          </p>

          {sellerName && (
            <div className="flex items-center gap-3 border-y py-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary font-heading text-lg font-bold text-primary">
                {sellerName.charAt(0).toUpperCase()}
              </span>
              <div>
                <Link href={`/sellers/${product.seller?.id}`} className="font-semibold hover:underline">{sellerName}</Link>
                <Link href={`/sellers/${product.seller?.id}`} className="block text-xs text-primary hover:underline">Voir la boutique →</Link>
              </div>
            </div>
          )}

          <section className="space-y-2">
            <h2 className="text-lg font-bold">Description du produit</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed">{product.description}</p>
          </section>

          {product.tags.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <li key={tag} className="rounded-full bg-secondary px-3 py-1 text-xs">
                  {tag}
                </li>
              ))}
            </ul>
          )}

          {/* Buttons container */}
          <div className="flex flex-row gap-3 pt-2">
            {contact ? (
              <a
                href={contact}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-whatsapp text-sm md:text-base font-semibold text-whatsapp-foreground transition-opacity hover:opacity-90 whitespace-nowrap px-2 md:px-4"
              >
                <Phone className="h-5 w-5" aria-hidden />
                Contacter le vendeur
              </a>
            ) : (
              <p className="flex-1 rounded-2xl bg-secondary p-4 text-sm text-muted-foreground">
                Le vendeur n&apos;a pas encore ajouté de numéro WhatsApp.
              </p>
            )}

            <FavoriteButton
              productId={product.id}
              variant="icon"
              initialFavorited={isFavorited}
              className="h-14 w-14 shrink-0 rounded-2xl border-2 border-red-500 bg-transparent text-red-500 shadow-none hover:bg-red-50"
            />
          </div>
        </div>
      </div>
      
      <div className="px-4 pt-8 md:px-0">
        <Suspense fallback={null}>
          <SimilarSection productId={product.id} favoriteIds={favoriteIds} />
        </Suspense>
      </div>
    </article>
  );
}

async function SimilarSection({
  productId,
  favoriteIds,
}: {
  productId: string;
  favoriteIds: Set<string>;
}) {
  try {
    const items = await getSimilarProducts(productId);
    return <RecommendedSection products={items} favoriteIds={favoriteIds} />;
  } catch {
    return null;
  }
}