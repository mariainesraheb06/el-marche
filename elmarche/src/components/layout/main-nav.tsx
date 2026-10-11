"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, Search, User, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; prefixes: string[] };

const ITEMS: NavItem[] = [
  { href: "/", label: "Accueil", icon: House, prefixes: [] },
  {
    href: "/search",
    label: "Rechercher",
    icon: Search,
    prefixes: ["/search", "/categories", "/products"],
  },
  { href: "/favorites", label: "Favoris", icon: Heart, prefixes: ["/favorites"] },
  { href: "/profile", label: "Profil", icon: User, prefixes: ["/profile", "/dashboard"] },
];

function useIsActive() {
  const pathname = usePathname();
  return (item: NavItem) =>
    item.href === "/"
      ? pathname === "/"
      : item.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function BottomNav() {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-xs",
                  active ? "font-bold text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function DesktopNav() {
  const isActive = useIsActive();

  return (
    <header className="sticky top-0 z-40 hidden border-b bg-card/95 backdrop-blur md:block">
      <div className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-3">
        <Logo />
        <nav aria-label="Navigation principale" className="ml-auto flex items-center gap-6">
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item) ? "page" : undefined}
              className={cn(
                "text-sm transition-colors hover:text-primary",
                isActive(item) ? "font-bold text-primary" : "font-medium text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}