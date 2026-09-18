import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { darkTokens } from "@40labs/design-tokens";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "40Labs — Healthcare Redefined",
  description: "Advanced solutions for patients, pharmacies, and suppliers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ backgroundColor: darkTokens.colors.bg }}
    >
      <body
        className="min-h-full flex flex-col"
        style={{
          backgroundColor: darkTokens.colors.bg,
          color: darkTokens.colors.text,
        }}
      >
        <SiteHeader />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
