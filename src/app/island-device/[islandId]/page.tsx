'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Settings, AlertCircle, Clock, Flame } from 'lucide-react';
import { db, getDeviceConfig } from '@/db/schema';
import { initializeWorkers, workerManager } from '@/lib/worker-manager';
import { startAutoSync } from '@/lib/sync-manager';
import { SyncStatus } from '@/components/island-device/sync-status';
import {
  calculateOfflineAvailability,
  type OfflineAvailability,
} from '@/lib/offline-availability';
import { format } from 'date-fns';

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
  const [availability, setAvailability] = useState<
    Map<string, OfflineAvailability>
  >(new Map());

  const calculateAvailability = useCallback(async (saunasData: Sauna[]) => {
    const availabilityMap = new Map<string, OfflineAvailability>();

    for (const sauna of saunasData) {
      const avail = await calculateOfflineAvailability(sauna);
      availabilityMap.set(sauna.id, avail);
    }

    setAvailability(availabilityMap);
  }, []);

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

      // Calculate availability for all saunas
      await calculateAvailability(saunasData);
    } catch (err) {
      alert('Failed to load device data. Please reconfigure.');
      router.push('/island-device');
    } finally {
      setLoading(false);
    }
  }, [islandId, router, calculateAvailability]);

  useEffect(() => {
    checkDeviceAndLoadData();

    // Initialize workers if not already initialized
    if (!workerManager.isReady()) {
      initializeWorkers().catch(() => {
        // Worker initialization failed
      });
    }

    // Start automatic sync (60 minute intervals)
    startAutoSync(60);

    // Refresh availability every 30 seconds
    const availInterval = setInterval(async () => {
      if (saunas.length > 0) {
        await calculateAvailability(saunas);
      }
    }, 30000);

    return () => {
      clearInterval(availInterval);
    };
  }, [islandId, checkDeviceAndLoadData, calculateAvailability, saunas]);

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
          {/* Sync Status */}
          <SyncStatus compact />

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
          saunas.map((sauna) => {
            const avail = availability.get(sauna.id);

            return (
              <Card key={sauna.id} className="p-6">
                <h3 className="mb-4 text-xl font-bold">{sauna.name}</h3>

                {/* Current Status */}
                {avail && (
                  <div className="mb-4">
                    {avail.isCurrentlyReserved ? (
                      <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                        <Flame className="mt-0.5 h-4 w-4 text-red-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-900">
                            Currently In Use
                          </p>
                          <p className="mt-0.5 text-xs text-red-700">
                            {avail.currentReservation?.boatName}
                          </p>
                          <p className="mt-1 text-xs text-red-600">
                            Until{' '}
                            {format(
                              new Date(avail.currentReservation!.endTime),
                              'h:mm a'
                            )}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <Clock className="mt-0.5 h-4 w-4 text-gray-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            Available (Cold)
                          </p>
                          <p className="mt-0.5 text-xs text-gray-600">
                            Heating time: {sauna.heatingTimeHours}h
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Next Available */}
                {avail && (
                  <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <p className="text-xs font-medium text-blue-900">
                      Next Available
                    </p>
                    <p className="mt-1 text-lg font-bold text-blue-700">
                      {format(avail.nextAvailableTime, 'h:mm a')}
                    </p>
                    <p className="mt-0.5 text-xs text-blue-600">
                      {avail.reason === 'heating' && 'Includes heating time'}
                      {avail.reason === 'buffer' && '15-min buffer applied'}
                      {avail.reason === 'in_use' && 'After current reservation'}
                      {avail.reason === 'next_free' && 'Next free slot'}
                    </p>
                  </div>
                )}

                {/* Shared Reservation */}
                {avail?.sharedReservationToday && (
                  <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-3">
                    <p className="text-xs font-medium text-purple-900">
                      {avail.sharedReservationToday.name || 'Shared Sauna'}
                    </p>
                    <p className="mt-1 text-sm text-purple-700">
                      {avail.sharedReservationToday.genderSchedule}
                    </p>
                    <p className="mt-0.5 text-xs text-purple-600">
                      {avail.sharedReservationToday.participantCount}{' '}
                      participant(s)
                    </p>
                  </div>
                )}

                {/* Auto Club Sauna Badge */}
                {sauna.autoClubSaunaEnabled && (
                  <div className="mb-4 rounded border border-purple-200 bg-purple-50 px-2 py-1 text-center">
                    <span className="text-xs font-medium text-purple-700">
                      Auto Club Sauna Enabled
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() =>
                      router.push(
                        `/island-device/${islandId}/saunas/${sauna.id}`
                      )
                    }
                  >
                    Make Reservation
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
                    View All Reservations
                  </Button>
                </div>
              </Card>
            );
          })
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
