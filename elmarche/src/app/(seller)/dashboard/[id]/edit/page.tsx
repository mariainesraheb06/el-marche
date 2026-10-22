import { notFound, redirect } from "next/navigation";
import { ProductForm } from "@/components/forms/product-form";
import { BackButton } from "@/components/layout/back-button";
import { productIdSchema } from "@/lib/validators/products";
import { getCurrentUserId } from "@/server/auth";
import { getCategories } from "@/server/services/categories";
import { getSellerAccess, getSellerProduct } from "@/server/services/seller-products";

export const metadata = { title: "Modifier le produit — El Marché" };
export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) redirect(`/login?next=/dashboard/${params.id}/edit`);
  if (!productIdSchema.safeParse(params.id).success) notFound();

  const profile = await getSellerAccess(userId);
  if (!profile) redirect("/profile");

  const [product, categories] = await Promise.all([
    getSellerProduct(userId, params.id),
    getCategories(),
  ]);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 pb-8 pt-2 md:px-6 md:pt-6">
      <div className="flex items-center gap-2">
        <BackButton fallbackHref="/dashboard" />
        <h1 className="text-xl font-bold">Modifier le produit</h1>
      </div>

      <ProductForm
        mode="edit"
        userId={userId}
        productId={product.id}
        categories={categories.map(({ id, name }) => ({ id, name }))}
        defaultWilaya={profile.wilaya_code ?? 16}
        initial={{
          title: product.title,
          description: product.description,
          priceDzd: product.priceDzd,
          categoryId: product.categoryId,
          wilayaCode: product.wilayaCode,
          tags: product.tags,
        }}
      />
    </div>
  );
}