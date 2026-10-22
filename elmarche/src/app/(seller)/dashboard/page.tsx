import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil, Plus, ShoppingBag } from "lucide-react";
import { DeleteProductButton } from "@/components/seller/delete-product-button";
import { formatPrice } from "@/lib/format";
import { getCurrentUserId } from "@/server/auth";
import { getSellerDashboard } from "@/server/services/seller-products";

export const metadata = { title: "Tableau de bord — El Marché" };
export const dynamic = "force-dynamic";

const countFormatter = new Intl.NumberFormat("en-US");

const STATUS: Record<string, { label: string; className: string }> = {
  approved: { label: "Actif", className: "bg-green-100 text-green-800" },
  pending: { label: "En attente", className: "bg-orange-100 text-orange-700" },
  rejected: { label: "Refusé", className: "bg-red-100 text-red-700" },
};

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login?next=/dashboard");

  const dashboard = await getSellerDashboard(userId);
  if (!dashboard) redirect("/profile");

  const { profile, products, totalViews } = dashboard;
  const name = profile.shop_name ?? profile.full_name ?? "Ma boutique";

  return (
    <div className="space-y-6 px-4 pb-24 pt-4 md:px-6 md:pb-8 md:pt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mon Tableau de Bord</h1>
          <p className="font-semibold text-accent">{name}</p>
        </div>
        <Link
          href="/dashboard/new"
          className="hidden h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 md:inline-flex"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Ajouter un produit
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Vues totales</p>
          <p className="font-heading text-2xl font-bold">{countFormatter.format(totalViews)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Produits</p>
          <p className="font-heading text-2xl font-bold">{countFormatter.format(products.length)}</p>
        </div>
      </div>

      <section aria-labelledby="products-title" className="space-y-3">
        <h2 id="products-title" className="text-xl font-bold">
          Mes Produits
        </h2>

        {products.length === 0 ? (
          <p className="rounded-2xl border bg-card p-6 text-center text-muted-foreground">
            Vous n&apos;avez pas encore de produit. Publiez le premier !
          </p>
        ) : (
          <ul className="space-y-3">
            {products.map((product) => {
              const status = STATUS[product.status] ?? STATUS.pending;
              return (
                <li
                  key={product.id}
                  className="flex items-center gap-3 rounded-2xl border bg-card p-3"
                >
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary text-muted-foreground">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <ShoppingBag className="h-6 w-6" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate font-semibold">{product.title}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading font-bold text-primary">
                        {formatPrice(product.priceDzd)}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/${product.id}/edit`}
                    aria-label={`Modifier ${product.title}`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary"
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Link>
                  <DeleteProductButton productId={product.id} title={product.title} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Link
        href="/dashboard/new"
        className="fixed bottom-20 right-4 z-40 flex h-12 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-lg md:hidden"
      >
        <Plus className="h-5 w-5" aria-hidden />
        Ajouter un produit
      </Link>
    </div>
  );
}