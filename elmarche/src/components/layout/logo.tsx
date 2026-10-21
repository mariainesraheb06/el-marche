import Image from "next/image";
import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="El Marché, accueil"
      className={`flex items-center gap-2 ${className}`}
    >
      <Image src="/logo.svg" alt="" width={36} height={36} priority className="h-9 w-9" />
      <span className="font-heading text-xl font-extrabold tracking-tight text-primary">
        El Marché
      </span>
    </Link>
  );
}