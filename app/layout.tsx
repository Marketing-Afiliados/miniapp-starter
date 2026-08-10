import type { Metadata } from "next";
import "./globals.css";

import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "DecoQuote — Cotizaciones para decoradoras",
    template: "%s | DecoQuote",
  },
  description:
    "Calcula costos, margen y ganancia. Crea cotizaciones profesionales para tus eventos en minutos.",
  openGraph: {
    type: "website",
    locale: "es_EC",
    title: "DecoQuote | Cotiza tus decoraciones sin improvisar tus precios",
    description: "Calcula materiales, mano de obra, transporte, margen y ganancia en minutos.",
    images: [{ url: "/og-decoquote.png", width: 1792, height: 1024, alt: "DecoQuote para decoradoras" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DecoQuote | Cotizaciones para decoradoras",
    description: "Cotiza con confianza y conoce cuánto realmente ganas.",
    images: ["/og-decoquote.png"],
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
