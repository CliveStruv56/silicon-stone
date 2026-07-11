import { SanityLive } from "@/sanity/lib/live";
import { DraftModeBanner } from "@/components/DraftModeBanner";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { BottomTabBar } from "@/components/pwa/BottomTabBar";

export default function WebsiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Bottom padding on mobile keeps page content clear of the fixed tab bar.
    <div className="noise-overlay pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
      {children}
      <SanityLive />
      <DraftModeBanner />
      <InstallPrompt />
      <BottomTabBar />
    </div>
  );
}
