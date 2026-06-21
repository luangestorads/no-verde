import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "No Verde · Otimizador de Campanhas Meta Ads",
  description: "No Verde: o SaaS que deixa suas campanhas de Meta Ads no lucro. Importe dados do Gerenciador de Anúncios, cadastre seus produtos e receba recomendações precisas para aumentar sua Grana No Bolso.",
  keywords: ["Meta Ads", "Facebook Ads", "Instagram Ads", "otimização de campanhas", "ROAS", "tráfego pago", "order bump", "upsell"],
  authors: [{ name: "No Verde" }],
  openGraph: {
    title: "No Verde · Otimizador de Meta Ads",
    description: "Suas campanhas no lucro. Sua grana no bolso.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "No Verde",
    description: "Otimizador de Campanhas Meta Ads",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
