import type { Metadata } from "next";
import Script from "next/script";
import { Unbounded, Outfit, JetBrains_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/site";
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
    "Independent, decision-grade intelligence for UK and European leaders managing AI governance, technology dependency, and operational resilience.",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Silicon and Stone | Forensic Technopolitics",
    description:
      "AI regulation, semiconductor supply chains, and digital sovereignty. Analysis for European decision-makers from 30 years at the edge.",
    images: [
      {
        url: "/homepage-redesign-2026/the-watcher.png",
        width: 1200,
        height: 675,
        alt: "Silicon and Stone: the view from the Atlantic edge",
      },
    ],
    siteName: "Silicon and Stone",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Silicon and Stone | Forensic Technopolitics",
    description:
      "AI regulation, semiconductor supply chains, and digital sovereignty. Analysis for European decision-makers.",
    images: ["/homepage-redesign-2026/the-watcher.png"],
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* No-flash theme init. Stored preference is 'light' | 'dark' | 'system'.
            With nothing stored we follow the OS (first-time visitors with a dark OS
            get dark); an explicit 'light'/'dark' choice overrides the system. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');var sys=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=t==='dark'||((t==='system'||!t)&&sys);document.documentElement.classList.toggle('dark',dark);}catch(e){}})();",
          }}
        />
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
