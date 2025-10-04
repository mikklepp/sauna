'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Settings, Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react'
import { db, getDeviceConfig } from '@/db/schema'
import { initializeWorkers, workerManager } from '@/lib/worker-manager'

interface Sauna {
  id: string
  islandId: string
  name: string
  heatingTimeHours: number
  autoClubSaunaEnabled: boolean
}

export default function IslandDeviceIslandPage() {
  const params = useParams()
  const router = useRouter()
  const islandId = params.islandId as string

  const [saunas, setSaunas] = useState<Sauna[]>([])
  const [island, setIsland] = useState<{ id: string; name: string; clubId: string } | null>(null)
  const [club, setClub] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')

  const checkDeviceAndLoadData = useCallback(async () => {
    try {
      // Verify device is configured for this island
      const config = await getDeviceConfig()

      if (!config.isConfigured || config.assignedIslandId !== islandId) {
        alert('This device is not configured for this island')
        router.push('/island-device')
        return
      }

      // Load data from IndexedDB
      const islandData = await db.islands.get(islandId)
      setIsland(islandData || null)

      if (islandData) {
        const clubData = await db.clubs.get(islandData.clubId)
        setClub(clubData || null)
      }

      const saunasData = await db.saunas.where('islandId').equals(islandId).toArray()
      setSaunas(saunasData)
    } catch (err) {
      alert('Failed to load device data. Please reconfigure.')
      router.push('/island-device')
    } finally {
      setLoading(false)
    }
  }, [islandId, router])

  const handleSync = useCallback(async () => {
    setSyncStatus('syncing')

    try {
      const config = await getDeviceConfig()

      const response = await fetch('/api/sync/device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: config.deviceId,
          islandId: islandId,
        }),
      })

      if (response.ok) {
        setSyncStatus('success')
        setTimeout(() => setSyncStatus('idle'), 3000)
      } else {
        setSyncStatus('error')
        setTimeout(() => setSyncStatus('idle'), 5000)
      }
    } catch (err) {
      setSyncStatus('error')
      setTimeout(() => setSyncStatus('idle'), 5000)
    }
  }, [islandId])

  useEffect(() => {
    checkDeviceAndLoadData()

    // Initialize workers if not already initialized
    if (!workerManager.isReady()) {
      initializeWorkers().catch(() => {
        // Worker initialization failed
      })
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      handleSync()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [islandId, checkDeviceAndLoadData, handleSync])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading island data...</p>
      </div>
    )
  }

  if (!island) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Island Not Found</h2>
          <p className="text-gray-600 mb-6">
            Could not load island data from local storage
          </p>
          <Button onClick={() => router.push('/island-device')}>
            Back to Device Home
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{island.name}</h1>
          <p className="text-gray-600 mt-1">{club?.name}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Online/Offline Indicator */}
          <div className="flex items-center gap-2 text-sm">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-amber-600" />
                <span className="text-amber-600">Offline</span>
              </>
            )}
          </div>

          {/* Sync Button */}
          {isOnline && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncStatus === 'syncing'}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              {syncStatus === 'syncing' ? 'Syncing...' : 'Sync'}
            </Button>
          )}

          {/* Settings */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/island-device/settings')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Sync Status Messages */}
      {syncStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <div className="w-2 h-2 bg-green-600 rounded-full" />
          <span className="text-green-800 text-sm">Successfully synced with server</span>
        </div>
      )}

      {syncStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-red-800 text-sm">Sync failed - changes will sync when connection is restored</span>
        </div>
      )}

      {/* Offline Mode Notice */}
      {!isOnline && (
        <Card className="p-4 mb-6 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <WifiOff className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Offline Mode Active</p>
              <p className="text-sm text-amber-700 mt-1">
                All reservations are being saved locally. Changes will sync automatically when connection is restored.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Saunas List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {saunas.length === 0 ? (
          <Card className="p-12 text-center col-span-full">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No saunas configured</h3>
            <p className="text-gray-600">
              Please configure saunas for this island in the admin portal
            </p>
          </Card>
        ) : (
          saunas.map((sauna) => (
            <Card key={sauna.id} className="p-6">
              <h3 className="text-xl font-bold mb-4">{sauna.name}</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Heating time:</span>
                  <span className="font-medium">{sauna.heatingTimeHours}h</span>
                </div>
                {sauna.autoClubSaunaEnabled && (
                  <div className="bg-purple-50 border border-purple-200 rounded px-2 py-1">
                    <span className="text-xs text-purple-700 font-medium">Auto Club Sauna Enabled</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => router.push(`/island-device/${islandId}/saunas/${sauna.id}`)}
                >
                  View & Reserve
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/island-device/${islandId}/saunas/${sauna.id}/reservations`)}
                >
                  View Reservations
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Device Info Footer */}
      <Card className="p-4 mt-8 bg-gray-50">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Island Device Mode - All operations work offline</span>
          <span className="font-mono">Device ID: {island.id.substring(0, 8)}...</span>
        </div>
      </Card>
    </div>
  )
}
