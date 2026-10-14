import { Search } from "lucide-react";

export function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/search" role="search" className="relative">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Rechercher un artisan, un produit…"
        aria-label="Rechercher"
        className="h-12 w-full rounded-2xl border bg-secondary pl-12 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
      />
    </form>
  );
}