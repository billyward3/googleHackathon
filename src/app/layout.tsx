import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicHousing",
  description: "Personalized housing search and allocation simulation for Detroit public housing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav
          className="flex items-center justify-center gap-1 px-4 pt-4"
          aria-label="Main navigation"
        >
          <Link
            href="/realtor"
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2"
            style={{ color: "var(--ink-2)" }}
          >
            Find Your Home
          </Link>
          <span style={{ color: "var(--line)" }}>|</span>
          <Link
            href="/"
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2"
            style={{ color: "var(--ink-2)" }}
          >
            Allocation Simulation
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
