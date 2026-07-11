import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Fraunces, Outfit, JetBrains_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./(website)/globals.css";

// Display / heading face. Fraunces is a variable serif; include the optical-size
// axis so large display headings get high contrast while small headings stay sturdy.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
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

export const viewport: Viewport = {
  // Edge-to-edge rendering so safe-area insets are usable on notched devices.
  viewportFit: "cover",
  // Fallback for first paint / no stored preference. The inline theme script
  // below overrides this to match the class-based theme toggle.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#efece4" },
    { media: "(prefers-color-scheme: dark)", color: "#0f141e" },
  ],
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
            get dark); an explicit 'light'/'dark' choice overrides the system.
            __ssThemeColor keeps the <meta name="theme-color"> (PWA status bar) in
            sync with the class-based theme: an explicit choice replaces the
            media-scoped pair from the viewport export with a single resolved meta;
            'system' restores the media-scoped pair. ThemeToggle calls it on change. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');var sys=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=t==='dark'||((t==='system'||!t)&&sys);document.documentElement.classList.toggle('dark',dark);}catch(e){}" +
              "try{var fs=Number(localStorage.getItem('ss:article-size'));if(fs>=16&&fs<=21)document.documentElement.style.setProperty('--article-size',fs+'px');}catch(e){}" +
              "window.__ssThemeColor=function(){try{var t=localStorage.getItem('theme');var L='#efece4',D='#0f141e';var head=document.head;var metas=head.querySelectorAll('meta[name=\"theme-color\"]');if(t==='dark'||t==='light'){metas.forEach(function(m){m.remove()});var m=document.createElement('meta');m.setAttribute('name','theme-color');m.setAttribute('content',t==='dark'?D:L);head.appendChild(m);}else{var scoped=false;metas.forEach(function(m){if(m.getAttribute('media'))scoped=true});if(!scoped){metas.forEach(function(m){m.remove()});[['(prefers-color-scheme: light)',L],['(prefers-color-scheme: dark)',D]].forEach(function(p){var m=document.createElement('meta');m.setAttribute('name','theme-color');m.setAttribute('media',p[0]);m.setAttribute('content',p[1]);head.appendChild(m);});}}}catch(e){}};" +
              "if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',window.__ssThemeColor);}else{window.__ssThemeColor();}})();",
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
        className={`${fraunces.variable} ${outfit.variable} ${jetbrainsMono.variable} antialiased bg-slate-deep text-text-primary`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
