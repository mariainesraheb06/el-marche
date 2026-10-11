import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="El Marché, accueil"
      className={`flex items-center gap-2 ${className}`}
    >
      <ShoppingBag className="h-6 w-6 text-accent" aria-hidden />
      <span className="text-xl font-extrabold tracking-tight text-primary">El Marché</span>
    </Link>
  );
}