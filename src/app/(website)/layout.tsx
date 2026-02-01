import { SanityLive } from "@/sanity/lib/live";

export default function WebsiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="noise-overlay">
      {children}
      <SanityLive />
    </div>
  );
}
