import Link from 'next/link';
import { Terminal, Zap, Search, Users, Database, Home, BrainCircuit, LogOut, FileInput, BarChart3, FileText } from 'lucide-react';
import { logout } from '@/app/(auth)/login/actions';

export const metadata = {
    title: 'Writer Studio',
    description: 'Silicon & Stone Admin',
};

type NavItem = {
    href: string;
    label: string;
    icon: typeof Home;
    // The embedded Sanity Studio is a separate SPA: a soft <Link> transition
    // mounts it inside the admin app and it drops to its own login screen.
    // hardNav forces a plain <a> full-page load so it boots cleanly.
    hardNav?: boolean;
};

const NAV_ITEMS: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/create', label: 'Create', icon: Zap },
    { href: '/import', label: 'Import', icon: FileInput },
    { href: '/content', label: 'Library', icon: FileText },
    { href: '/research', label: 'Research', icon: Search },
    { href: '/context', label: 'Context', icon: Users },
    { href: '/knowledge', label: 'Knowledge', icon: BrainCircuit },
    { href: '/studio', label: 'Studio', icon: Database, hardNav: true },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Admin Navigation Header */}
            <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                    <Link href="/admin" className="flex items-center gap-2 text-primary font-bold">
                        <Terminal className="w-5 h-5" />
                        <span>Writer Studio</span>
                    </Link>
                    <nav className="flex items-center gap-1">
                        {NAV_ITEMS.map((item) => {
                            const navClass = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors";
                            const inner = (
                                <>
                                    <item.icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{item.label}</span>
                                </>
                            );
                            // Sanity Studio needs a full page load (see NavItem.hardNav).
                            return item.hardNav ? (
                                <a key={item.href} href={item.href} className={navClass}>
                                    {inner}
                                </a>
                            ) : (
                                <Link key={item.href} href={item.href} className={navClass}>
                                    {inner}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
                            ← Public Site
                        </Link>
                        <form action={logout}>
                            <button
                                type="submit"
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                title="Log out"
                            >
                                <LogOut className="w-3 h-3" />
                                <span className="hidden sm:inline">Log out</span>
                            </button>
                        </form>
                    </div>
                </div>
            </header>
            {/* Main Content */}
            {children}
        </div>
    );
}
