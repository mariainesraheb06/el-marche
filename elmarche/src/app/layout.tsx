import type { Metadata } from "next";
import { Caveat, Figtree, Fraunces } from "next/font/google";
import { FavoritesRefreshOnMount } from "@/components/layout/favorites-refresh-on-mount";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });

export const metadata: Metadata = {
  title: "El Marché",
  description: "Tout l'Algérie, en un seul endroit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${figtree.variable} ${fraunces.variable} ${caveat.variable}`}>
      <body>
        <FavoritesRefreshOnMount />
        {children}
      </body>
    </html>
  );
}