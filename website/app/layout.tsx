import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RightSidebar from '@/components/RightSidebar';

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
					fontSize: '20px',
					fontFamily: 'Kelly Slab',
				}}
			>
				<Header />
				<main className="flex">
					{children}
					<RightSidebar />
				</main>
				<Footer />
			</body>
		</html>
	);
}
