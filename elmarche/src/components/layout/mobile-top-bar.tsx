import { Globe } from "lucide-react";
import { Logo } from "@/components/layout/logo";

export function MobileTopBar() {
  return (
    <div className="flex items-center justify-between md:hidden">
      <Logo />
      <span
        aria-label="Langue : français"
        className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-bold"
      >
        <Globe className="h-4 w-4" aria-hidden />
        FR
      </span>
    </div>
  );
}