'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Smartphone, Wifi, WifiOff, Settings, MapPin } from 'lucide-react'
import { getDeviceConfig } from '@/db/schema'

export default function IslandDevicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [deviceConfig, setDeviceConfig] = useState<{
    isConfigured: boolean;
    deviceId?: string;
    assignedIslandId?: string;
    lastSyncAt?: string;
  } | null>(null)

  const checkDeviceStatus = useCallback(async () => {
    try {
      const config = await getDeviceConfig()
      setDeviceConfig(config)
      setIsConfigured(config.isConfigured)

      // If configured, redirect to island view
      if (config.isConfigured && config.assignedIslandId) {
        router.push(`/island-device/${config.assignedIslandId}`)
      }
    } catch (err) {
      console.error('Failed to check device status:', err)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkDeviceStatus()

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkDeviceStatus])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading device...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      {/* Status Banner */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <>
                <Wifi className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Online</p>
                  <p className="text-sm text-green-700">Connected to internet</p>
                </div>
              </>
            ) : (
              <>
                <WifiOff className="w-6 h-6 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-900">Offline</p>
                  <p className="text-sm text-amber-700">Running locally</p>
                </div>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/island-device/settings')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </Card>

      {/* Welcome Screen */}
      {!isConfigured ? (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <Smartphone className="w-10 h-10 text-blue-600" />
          </div>

          <h1 className="text-3xl font-bold mb-4">Island Device Setup</h1>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            This device is not configured yet. Configure this device to use it as a dedicated
            island sauna reservation terminal with full offline capabilities.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="p-6 text-left">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <WifiOff className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Offline First</h3>
              <p className="text-sm text-gray-600">
                Works completely offline. No internet connection required for daily operations.
              </p>
            </Card>

            <Card className="p-6 text-left">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Island Locked</h3>
              <p className="text-sm text-gray-600">
                Dedicated to one island. Source of truth for all reservations.
              </p>
            </Card>

            <Card className="p-6 text-left">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Auto Sync</h3>
              <p className="text-sm text-gray-600">
                Automatically syncs with backend when online. Handles conflicts gracefully.
              </p>
            </Card>
          </div>

          <div className="space-y-3">
            <Button
              size="lg"
              onClick={() => router.push('/island-device/setup')}
              className="w-full max-w-md"
            >
              <Settings className="w-5 h-5 mr-2" />
              Configure Island Device
            </Button>

            <p className="text-sm text-gray-500">
              You&apos;ll need a device configuration token from the admin portal
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <MapPin className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold mb-4">Device Configured</h1>
          <p className="text-gray-600 mb-8">
            This device is configured and ready to use
          </p>

          {deviceConfig && (
            <Card className="p-6 mb-6 max-w-md mx-auto text-left">
              <h3 className="font-semibold mb-4">Device Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Device ID:</span>
                  <span className="font-mono">{deviceConfig.deviceId?.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Island ID:</span>
                  <span className="font-mono">{deviceConfig.assignedIslandId?.substring(0, 8)}...</span>
                </div>
                {deviceConfig.lastSyncAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Sync:</span>
                    <span>{new Date(deviceConfig.lastSyncAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Button
            size="lg"
            onClick={() => router.push(`/island-device/${deviceConfig?.assignedIslandId}`)}
          >
            Open Island View
          </Button>
        </div>
      )}
    </div>
  )
}
