import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sauna Reservation System',
  description:
    'Offline-capable sauna reservation system for island communities',
  manifest: '/manifest.json',
  themeColor: '#0070f3',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sauna Reservations',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
