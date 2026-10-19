import { Skeleton } from "@/components/ui/skeleton";

export default function FavoritesLoading() {
  return (
    <div className="space-y-4 px-4 pb-8 pt-4 md:px-6 md:pt-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <Skeleton className="h-8 w-40" />
      </div>
      <Skeleton className="h-5 w-24" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="aspect-[4/3] w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}