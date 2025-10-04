'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Settings, Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { db, getDeviceConfig } from '@/db/schema';
import { initializeWorkers, workerManager } from '@/lib/worker-manager';

interface Sauna {
  id: string;
  islandId: string;
  name: string;
  heatingTimeHours: number;
  autoClubSaunaEnabled: boolean;
}

export default function IslandDeviceIslandPage() {
  const params = useParams();
  const router = useRouter();
  const islandId = params.islandId as string;

  const [saunas, setSaunas] = useState<Sauna[]>([]);
  const [island, setIsland] = useState<{
    id: string;
    name: string;
    clubId: string;
  } | null>(null);
  const [club, setClub] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<
    'idle' | 'syncing' | 'success' | 'error'
  >('idle');

  const checkDeviceAndLoadData = useCallback(async () => {
    try {
      // Verify device is configured for this island
      const config = await getDeviceConfig();

      if (!config.isConfigured || config.assignedIslandId !== islandId) {
        alert('This device is not configured for this island');
        router.push('/island-device');
        return;
      }

      // Load data from IndexedDB
      const islandData = await db.islands.get(islandId);
      setIsland(islandData || null);

      if (islandData) {
        const clubData = await db.clubs.get(islandData.clubId);
        setClub(clubData || null);
      }

      const saunasData = await db.saunas
        .where('islandId')
        .equals(islandId)
        .toArray();
      setSaunas(saunasData);
    } catch (err) {
      alert('Failed to load device data. Please reconfigure.');
      router.push('/island-device');
    } finally {
      setLoading(false);
    }
  }, [islandId, router]);

  const handleSync = useCallback(async () => {
    setSyncStatus('syncing');

    try {
      const config = await getDeviceConfig();

      const response = await fetch('/api/sync/device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: config.deviceId,
          islandId: islandId,
        }),
      });

      if (response.ok) {
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 5000);
      }
    } catch (err) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  }, [islandId]);

  useEffect(() => {
    checkDeviceAndLoadData();

    // Initialize workers if not already initialized
    if (!workerManager.isReady()) {
      initializeWorkers().catch(() => {
        // Worker initialization failed
      });
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      handleSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [islandId, checkDeviceAndLoadData, handleSync]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading island data...</p>
      </div>
    );
  }

  if (!island) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-600" />
          <h2 className="mb-2 text-xl font-bold">Island Not Found</h2>
          <p className="mb-6 text-gray-600">
            Could not load island data from local storage
          </p>
          <Button onClick={() => router.push('/island-device')}>
            Back to Device Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{island.name}</h1>
          <p className="mt-1 text-gray-600">{club?.name}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Online/Offline Indicator */}
          <div className="flex items-center gap-2 text-sm">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-amber-600" />
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
              <RefreshCw
                className={`mr-2 h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}
              />
              {syncStatus === 'syncing' ? 'Syncing...' : 'Sync'}
            </Button>
          )}

          {/* Settings */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/island-device/settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Sync Status Messages */}
      {syncStatus === 'success' && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="h-2 w-2 rounded-full bg-green-600" />
          <span className="text-sm text-green-800">
            Successfully synced with server
          </span>
        </div>
      )}

      {syncStatus === 'error' && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-800">
            Sync failed - changes will sync when connection is restored
          </span>
        </div>
      )}

      {/* Offline Mode Notice */}
      {!isOnline && (
        <Card className="mb-6 border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <WifiOff className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-900">Offline Mode Active</p>
              <p className="mt-1 text-sm text-amber-700">
                All reservations are being saved locally. Changes will sync
                automatically when connection is restored.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Saunas List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {saunas.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No saunas configured
            </h3>
            <p className="text-gray-600">
              Please configure saunas for this island in the admin portal
            </p>
          </Card>
        ) : (
          saunas.map((sauna) => (
            <Card key={sauna.id} className="p-6">
              <h3 className="mb-4 text-xl font-bold">{sauna.name}</h3>

              <div className="mb-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Heating time:</span>
                  <span className="font-medium">{sauna.heatingTimeHours}h</span>
                </div>
                {sauna.autoClubSaunaEnabled && (
                  <div className="rounded border border-purple-200 bg-purple-50 px-2 py-1">
                    <span className="text-xs font-medium text-purple-700">
                      Auto Club Sauna Enabled
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() =>
                    router.push(`/island-device/${islandId}/saunas/${sauna.id}`)
                  }
                >
                  View & Reserve
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    router.push(
                      `/island-device/${islandId}/saunas/${sauna.id}/reservations`
                    )
                  }
                >
                  View Reservations
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Device Info Footer */}
      <Card className="mt-8 bg-gray-50 p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Island Device Mode - All operations work offline</span>
          <span className="font-mono">
            Device ID: {island.id.substring(0, 8)}...
          </span>
        </div>
      </Card>
    </div>
  );
}
