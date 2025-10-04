'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Smartphone, Wifi, WifiOff, Settings, MapPin } from 'lucide-react';
import { getDeviceConfig } from '@/db/schema';

export default function IslandDevicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [deviceConfig, setDeviceConfig] = useState<{
    isConfigured: boolean;
    deviceId?: string;
    assignedIslandId?: string;
    lastSyncAt?: string;
  } | null>(null);

  const checkDeviceStatus = useCallback(async () => {
    try {
      const config = await getDeviceConfig();
      setDeviceConfig(config);
      setIsConfigured(config.isConfigured);

      // If configured, redirect to island view
      if (config.isConfigured && config.assignedIslandId) {
        router.push(`/island-device/${config.assignedIslandId}`);
      }
    } catch (err) {
      console.error('Failed to check device status:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkDeviceStatus();

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkDeviceStatus]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading device...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      {/* Status Banner */}
      <Card className="mb-8 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <>
                <Wifi className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Online</p>
                  <p className="text-sm text-green-700">
                    Connected to internet
                  </p>
                </div>
              </>
            ) : (
              <>
                <WifiOff className="h-6 w-6 text-amber-600" />
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
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </Card>

      {/* Welcome Screen */}
      {!isConfigured ? (
        <div className="text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <Smartphone className="h-10 w-10 text-blue-600" />
          </div>

          <h1 className="mb-4 text-3xl font-bold">Island Device Setup</h1>
          <p className="mx-auto mb-8 max-w-2xl text-gray-600">
            This device is not configured yet. Configure this device to use it
            as a dedicated island sauna reservation terminal with full offline
            capabilities.
          </p>

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <Card className="p-6 text-left">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <WifiOff className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 font-semibold">Offline First</h3>
              <p className="text-sm text-gray-600">
                Works completely offline. No internet connection required for
                daily operations.
              </p>
            </Card>

            <Card className="p-6 text-left">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 font-semibold">Island Locked</h3>
              <p className="text-sm text-gray-600">
                Dedicated to one island. Source of truth for all reservations.
              </p>
            </Card>

            <Card className="p-6 text-left">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mb-2 font-semibold">Auto Sync</h3>
              <p className="text-sm text-gray-600">
                Automatically syncs with backend when online. Handles conflicts
                gracefully.
              </p>
            </Card>
          </div>

          <div className="space-y-3">
            <Button
              size="lg"
              onClick={() => router.push('/island-device/setup')}
              className="w-full max-w-md"
            >
              <Settings className="mr-2 h-5 w-5" />
              Configure Island Device
            </Button>

            <p className="text-sm text-gray-500">
              You&apos;ll need a device configuration token from the admin
              portal
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <MapPin className="h-10 w-10 text-green-600" />
          </div>

          <h1 className="mb-4 text-3xl font-bold">Device Configured</h1>
          <p className="mb-8 text-gray-600">
            This device is configured and ready to use
          </p>

          {deviceConfig && (
            <Card className="mx-auto mb-6 max-w-md p-6 text-left">
              <h3 className="mb-4 font-semibold">Device Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Device ID:</span>
                  <span className="font-mono">
                    {deviceConfig.deviceId?.substring(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Island ID:</span>
                  <span className="font-mono">
                    {deviceConfig.assignedIslandId?.substring(0, 8)}...
                  </span>
                </div>
                {deviceConfig.lastSyncAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Sync:</span>
                    <span>
                      {new Date(deviceConfig.lastSyncAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Button
            size="lg"
            onClick={() =>
              router.push(`/island-device/${deviceConfig?.assignedIslandId}`)
            }
          >
            Open Island View
          </Button>
        </div>
      )}
    </div>
  );
}
