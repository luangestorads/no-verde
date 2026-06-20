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
  title: "Grana No Bolso · Otimizador de Campanhas Meta Ads",
  description: "SaaS para otimizar campanhas do Facebook/Instagram Ads com base nas métricas do Gerenciador de Anúncios. Calcule o lucro líquido (Grana No Bolso) e receba recomendações acionáveis.",
  keywords: ["Meta Ads", "Facebook Ads", "Instagram Ads", "otimização de campanhas", "ROAS", "tráfego pago"],
  authors: [{ name: "Grana No Bolso" }],
  openGraph: {
    title: "Grana No Bolso · Otimizador de Meta Ads",
    description: "Otimize campanhas de Meta Ads com base nas métricas reais e maximize seu lucro líquido.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grana No Bolso",
    description: "Otimizador de Campanhas Meta Ads",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
