import type { Metadata } from "next";
import "./globals.css";

import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "MiniApp Starter — Lanza productos SaaS más rápido",
    template: "%s | MiniApp Starter",
  },
  description:
    "Starter profesional con autenticación, suscripciones y panel administrativo para crear Mini Apps comerciales.",
  openGraph: {
    type: "website",
    locale: "es_EC",
    title: "MiniApp Starter",
    description: "Tu próxima Mini App empieza más adelante.",
    images: [{ url: "/og.png", width: 1792, height: 1024, alt: "MiniApp Starter" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MiniApp Starter",
    description: "Tu próxima Mini App empieza más adelante.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
