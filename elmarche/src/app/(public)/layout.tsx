import { BottomNav, DesktopNav } from "@/components/layout/main-nav";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <DesktopNav />
      <div className="mx-auto w-full max-w-6xl">{children}</div>
      <BottomNav />
    </div>
  );
}