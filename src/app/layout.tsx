import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Merriweather } from "next/font/google";
import { SanityLive } from "@/sanity/lib/live";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
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
        className={`${inter.variable} ${jetbrainsMono.variable} ${merriweather.variable} antialiased`}
      >
        {children}
        <SanityLive />
      </body>
    </html>
  );
}
