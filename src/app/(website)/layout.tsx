import { SanityLive } from "@/sanity/lib/live";
import { DraftModeBanner } from "@/components/DraftModeBanner";

export default function WebsiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="noise-overlay">
      {children}
      <SanityLive />
      <DraftModeBanner />
    </div>
  );
}
