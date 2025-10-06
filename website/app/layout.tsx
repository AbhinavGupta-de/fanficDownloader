import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
        title: 'Fanfiction Downloader',
        description: 'Website for the Fanfiction Downloader Chrome Extension',
};

export default function RootLayout({
        children,
}: Readonly<{
        children: React.ReactNode;
}>) {
        return (
                <html lang="en">
                        <body
                                className={inter.className}
                                style={{
                                        backgroundColor: '#20231F',
                                        color: 'white',
                                        fontSize: '18px',
                                        fontFamily: 'Kelly Slab',
                                }}
                                data-testid="root-layout"
                        >
                                <Header />
                                <main className="flex justify-center min-h-screen" data-testid="main-content">{children}</main>
                                <Footer />
                        </body>
                </html>
        );
}
