import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apex Courier | Live Tracking",
  description: "Global Assets, Invisible Precision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-50 antialiased selection:bg-amber-500/20">
        {children}
      </body>
    </html>
  );
}