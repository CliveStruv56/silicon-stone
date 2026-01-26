import { Inter } from 'next/font/google';
import "../(website)/globals.css";

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Writer Login',
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className={inter.className}>
                <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                    {children}
                </div>
            </body>
        </html>
    );
}
