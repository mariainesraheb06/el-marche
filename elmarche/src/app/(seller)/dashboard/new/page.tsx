import { redirect } from "next/navigation";
import { ProductForm } from "@/components/forms/product-form";
import { BackButton } from "@/components/layout/back-button";
import { getCurrentUserId } from "@/server/auth";
import { getCategories } from "@/server/services/categories";
import { getSellerAccess } from "@/server/services/seller-products";

export const metadata = { title: "Nouveau produit — El Marché" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login?next=/dashboard/new");

  const profile = await getSellerAccess(userId);
  if (!profile) redirect("/profile");

  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 pb-8 pt-2 md:px-6 md:pt-6">
      <div className="flex items-center gap-2">
        <BackButton fallbackHref="/dashboard" />
        <h1 className="text-xl font-bold">Nouveau Produit</h1>
      </div>

      {!profile.whatsapp_number && (
        <p className="rounded-2xl bg-secondary p-4 text-sm">
          Ajoutez votre numéro WhatsApp à votre profil avant de publier : les acheteurs vous
          contactent sur ce numéro.
        </p>
      )}

      <ProductForm
        mode="create"
        userId={userId}
        categories={categories.map(({ id, name }) => ({ id, name }))}
        defaultWilaya={profile.wilaya_code ?? 16}
      />
    </div>
  );
}