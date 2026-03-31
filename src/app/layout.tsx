import type { Metadata } from "next";
import Script from "next/script";
import { Unbounded, Outfit, JetBrains_Mono } from "next/font/google";
import "./(website)/globals.css";

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://siliconandstone.com"),
  openGraph: {
    title: "Silicon and Stone | Forensic Technopolitics",
    description:
      "AI regulation, semiconductor supply chains, and digital sovereignty. Analysis for European decision-makers from 30 years at the edge.",
    siteName: "Silicon and Stone",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Silicon and Stone | Forensic Technopolitics",
    description:
      "AI regulation, semiconductor supply chains, and digital sovereignty. Analysis for European decision-makers.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.tagged-events.js"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body
        className={`${unbounded.variable} ${outfit.variable} ${jetbrainsMono.variable} antialiased bg-slate-deep text-text-primary`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
