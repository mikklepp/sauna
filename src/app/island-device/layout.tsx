import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Island Device - Sauna Reservations',
  description: 'Offline-capable island device for sauna reservations',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Island Device',
  },
}

export default function IslandDeviceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Island Device Mode</span>
          </div>
          <span className="text-xs opacity-75">Offline Ready</span>
        </div>
      </div>
      {children}
    </div>
  )
}
