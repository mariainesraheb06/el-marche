import { notFound, redirect } from "next/navigation";
import { CATEGORIES } from "@/lib/constants/categories";

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const exists = CATEGORIES.some((category) => category.slug === params.slug);
  if (!exists) notFound();

  redirect(`/search?category=${params.slug}`);
}