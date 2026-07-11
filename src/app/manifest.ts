import type { MetadataRoute } from "next";

// Served automatically at /manifest.webmanifest by the App Router.
// Colors mirror the light theme tokens in globals.css (--background / --slate-deep);
// the dark status-bar color is handled by the themeColor viewport export in layout.tsx.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Silicon & Stone",
    short_name: "S&S",
    description:
      "Independent, decision-grade intelligence for UK and European leaders managing AI governance, technology dependency, and operational resilience.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#efece4",
    theme_color: "#efece4",
    categories: ["news", "business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Intelligence",
        short_name: "Intelligence",
        description: "Latest briefings and deep dives",
        url: "/intelligence?source=pwa",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Tools",
        short_name: "Tools",
        description: "Self-serve compliance and exposure tools",
        url: "/tools?source=pwa",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
