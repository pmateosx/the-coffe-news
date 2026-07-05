import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { ViewTransitionResolver } from "@/components/view-transitions";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Coffee News",
  description: "El periódico efímero de tu oficina. Caduca cada 7 días.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <ViewTransitionResolver />
        {children}
      </body>
    </html>
  );
}
