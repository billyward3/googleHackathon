import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicHousing",
  description: "A polished single-page demo comparing FIFO allocation against TTC-inspired reallocation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
