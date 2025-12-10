/**
 * Saunas Data Hook
 *
 * Provides unified access to sauna data regardless of mode.
 * Automatically fetches from API (online) or IndexedDB (offline).
 */

import { useState, useEffect, useCallback } from 'react';
import { useIsOfflineMode } from './use-mode';
import { db } from '@/db/schema';
import type { LocalSauna } from '@/types';
import { calculateOfflineAvailability } from '@/lib/offline-availability';

interface SaunaWithAvailability {
  id: string;
  name: string;
  heatingTimeHours: number;
  autoClubSaunaEnabled?: boolean;
  isCurrentlyReserved?: boolean;
  currentReservation?: {
    id: string;
    startTime: string;
    endTime: string;
    boat: { name: string };
  };
  nextAvailable?: {
    startTime: string;
    endTime: string;
    reason: string;
  };
  sharedReservationsToday?: Array<{
    id: string;
    name: string;
    startTime: string;
    participants: Array<{
      id: string;
      adults: number;
      kids: number;
      boat: { id: string; name: string };
    }>;
  }>;
}

interface UseSaunasResult {
  saunas: SaunaWithAvailability[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Get saunas for an island with availability data
 */
export function useSaunas(islandId: string): UseSaunasResult {
  const isOffline = useIsOfflineMode();
  const [saunas, setSaunas] = useState<SaunaWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOnline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get saunas
      const saunasRes = await fetch(`/api/saunas?islandId=${islandId}`);
      if (!saunasRes.ok) {
        throw new Error('Failed to fetch saunas');
      }

      const saunasData = await saunasRes.json();

      // Fetch availability for each sauna
      const saunasWithAvailability = await Promise.all(
        (saunasData.data || []).map(
          async (sauna: {
            id: string;
            name: string;
            heatingTimeHours: number;
          }) => {
            const availRes = await fetch(
              `/api/saunas/${sauna.id}/next-available`
            );
            if (availRes.ok) {
              const availData = await availRes.json();
              return { ...sauna, ...availData.data };
            }
            return sauna;
          }
        )
      );

      setSaunas(saunasWithAvailability);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch saunas');
    } finally {
      setLoading(false);
    }
  }, [islandId]);

  const fetchOffline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get saunas from IndexedDB
      const saunasData = await db.saunas
        .where('islandId')
        .equals(islandId)
        .toArray();

      // Calculate availability for each sauna
      const saunasWithAvailability = await Promise.all(
        saunasData.map(async (sauna) => {
          const avail = await calculateOfflineAvailability(sauna);

          return {
            id: sauna.id,
            name: sauna.name,
            heatingTimeHours: sauna.heatingTimeHours,
            autoClubSaunaEnabled: sauna.autoClubSaunaEnabled,
            isCurrentlyReserved: avail.isCurrentlyReserved,
            currentReservation: avail.currentReservation
              ? {
                  id: '',
                  startTime: avail.currentReservation.startTime,
                  endTime: avail.currentReservation.endTime,
                  boat: { name: avail.currentReservation.boatName },
                }
              : undefined,
            nextAvailable: {
              startTime: avail.nextAvailableTime.toISOString(),
              endTime: new Date(
                avail.nextAvailableTime.getTime() + 60 * 60 * 1000
              ).toISOString(),
              reason: avail.reason,
            },
            sharedReservationsToday: avail.sharedReservationToday
              ? [
                  {
                    id: avail.sharedReservationToday.id,
                    name: avail.sharedReservationToday.name || 'Club Sauna',
                    startTime: avail.sharedReservationToday.startTime,
                    participants: [], // Will be populated by separate query if needed
                  },
                ]
              : [],
          };
        })
      );

      setSaunas(saunasWithAvailability);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saunas');
    } finally {
      setLoading(false);
    }
  }, [islandId]);

  const refresh = useCallback(async () => {
    if (isOffline) {
      await fetchOffline();
    } else {
      await fetchOnline();
    }
  }, [isOffline, fetchOffline, fetchOnline]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { saunas, loading, error, refresh };
}

/**
 * Get a single sauna by ID
 */
export function useSauna(saunaId: string) {
  const isOffline = useIsOfflineMode();
  const [sauna, setSauna] = useState<LocalSauna | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSauna() {
      try {
        setLoading(true);
        setError(null);

        if (isOffline) {
          const saunaData = await db.saunas.get(saunaId);
          setSauna(saunaData || null);
        } else {
          const response = await fetch(`/api/saunas/${saunaId}`);
          if (response.ok) {
            const data = await response.json();
            setSauna(data.data);
          } else {
            throw new Error('Failed to fetch sauna');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sauna');
      } finally {
        setLoading(false);
      }
    }

    fetchSauna();
  }, [saunaId, isOffline]);

  return { sauna, loading, error };
}
