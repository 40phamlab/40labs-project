import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { darkTokens } from "@40labs/design-tokens";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const inter = Inter({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      style={{ backgroundColor: darkTokens.colors.bg }}
    >
      <body
        className="min-h-full flex flex-col"
        style={{
          backgroundColor: darkTokens.colors.bg,
          color: darkTokens.colors.text,
        }}
      >
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
