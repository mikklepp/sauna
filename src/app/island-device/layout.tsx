import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Island Device - Sauna Reservations',
  description: 'Offline-capable island device for sauna reservations',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Island Device',
  },
};

export default function IslandDeviceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            <span className="text-sm font-medium">Island Device Mode</span>
          </div>
          <span className="text-xs opacity-75">Offline Ready</span>
        </div>
      </div>
      {children}
    </div>
  );
}
