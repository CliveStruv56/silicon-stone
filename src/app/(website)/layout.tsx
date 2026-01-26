import type { Metadata } from "next";
import { Unbounded, Outfit, JetBrains_Mono } from "next/font/google";
import { SanityLive } from "@/sanity/lib/live";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Silicon and Stone | Forensic Technopolitics",
  description:
    "Deep analysis at the intersection of technology policy, supply chains, and geopolitics. Cutting through complexity with 30 years of experience from the edge.",
  keywords: [
    "AI Act",
    "semiconductor",
    "supply chain",
    "technology policy",
    "EU regulation",
    "digital sovereignty",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${unbounded.variable} ${outfit.variable} ${jetbrainsMono.variable} antialiased bg-slate-deep text-text-primary noise-overlay`}
      >
        {children}
        <SanityLive />
      </body>
    </html>
  );
}
