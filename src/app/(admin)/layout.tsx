import { Inter } from 'next/font/google';
import Link from 'next/link';
import "../(website)/globals.css"; // Reuse globals
import { Terminal, Zap, Search, Users, Database, Home } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Writer Studio',
    description: 'Silicon & Stone Admin',
};

const NAV_ITEMS = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/generate', label: 'Generate', icon: Zap },
    { href: '/research', label: 'Research', icon: Search },
    { href: '/context', label: 'Context', icon: Users },
    { href: '/studio', label: 'Studio', icon: Database },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className={inter.className}>
                <div className="min-h-screen bg-background text-foreground">
                    {/* Admin Navigation Header */}
                    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
                        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                            <Link href="/admin" className="flex items-center gap-2 text-primary font-bold">
                                <Terminal className="w-5 h-5" />
                                <span>Writer Studio</span>
                            </Link>
                            <nav className="flex items-center gap-1">
                                {NAV_ITEMS.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                    >
                                        <item.icon className="w-4 h-4" />
                                        <span className="hidden sm:inline">{item.label}</span>
                                    </Link>
                                ))}
                            </nav>
                            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
                                ← Public Site
                            </Link>
                        </div>
                    </header>
                    {/* Main Content */}
                    {children}
                </div>
            </body>
        </html>
    );
}
