import type { Metadata } from "next";
import { Sora, Inter, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { darkTokens } from "@40labs/design-tokens";

const display = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
});

const accent = Instrument_Serif({
  variable: "--font-accent",
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  display: "swap",
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
      className={`${display.variable} ${sans.variable} ${mono.variable} ${accent.variable} h-full antialiased`}
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
