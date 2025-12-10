/**
 * Availability Data Hook
 *
 * Provides unified access to sauna availability data regardless of mode.
 * Automatically uses API (online) or local calculation (offline).
 */

import { useState, useEffect, useCallback } from 'react';
import { useIsOfflineMode } from './use-mode';
import { useSauna } from './use-saunas';
import { calculateOfflineAvailability } from '@/lib/offline-availability';

export interface NextAvailableSlot {
  startTime: string;
  endTime: string;
  reason: 'heating' | 'buffer' | 'next_free' | 'in_use';
}

export interface CurrentReservation {
  id: string;
  startTime: string;
  endTime: string;
  boat: {
    name: string;
  };
}

export interface SharedReservationToday {
  id: string;
  name: string;
  startTime: string;
  participants: Array<{
    id: string;
    adults: number;
    kids: number;
    boat: { id: string; name: string };
  }>;
}

export interface SaunaAvailability {
  saunaId: string;
  saunaName: string;
  isCurrentlyReserved: boolean;
  currentReservation?: CurrentReservation;
  nextAvailable: NextAvailableSlot;
  sharedReservationsToday?: SharedReservationToday[];
}

interface UseAvailabilityResult {
  availability: SaunaAvailability | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Get availability data for a sauna
 */
export function useAvailability(saunaId: string): UseAvailabilityResult {
  const isOffline = useIsOfflineMode();
  const { sauna } = useSauna(saunaId);
  const [availability, setAvailability] = useState<SaunaAvailability | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOnline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/saunas/${saunaId}/next-available`);
      if (response.ok) {
        const data = await response.json();
        setAvailability(data.data);
      } else {
        throw new Error('Failed to fetch availability');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load availability'
      );
    } finally {
      setLoading(false);
    }
  }, [saunaId]);

  const fetchOffline = useCallback(async () => {
    if (!sauna) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const offlineAvail = await calculateOfflineAvailability(sauna);

      // Transform to match online format
      const transformed: SaunaAvailability = {
        saunaId: offlineAvail.saunaId,
        saunaName: offlineAvail.saunaName,
        isCurrentlyReserved: offlineAvail.isCurrentlyReserved,
        currentReservation: offlineAvail.currentReservation
          ? {
              id: '', // Not available in offline mode
              startTime: offlineAvail.currentReservation.startTime,
              endTime: offlineAvail.currentReservation.endTime,
              boat: {
                name: offlineAvail.currentReservation.boatName,
              },
            }
          : undefined,
        nextAvailable: {
          startTime: offlineAvail.nextAvailableTime.toISOString(),
          endTime: new Date(
            offlineAvail.nextAvailableTime.getTime() + 60 * 60 * 1000
          ).toISOString(),
          reason: offlineAvail.reason,
        },
        sharedReservationsToday: offlineAvail.sharedReservationToday
          ? [
              {
                id: offlineAvail.sharedReservationToday.id,
                name: offlineAvail.sharedReservationToday.name || 'Club Sauna',
                startTime: offlineAvail.sharedReservationToday.startTime,
                participants: [], // Would need separate query to populate
              },
            ]
          : [],
      };

      setAvailability(transformed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to calculate availability'
      );
    } finally {
      setLoading(false);
    }
  }, [sauna]);

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

  return { availability, loading, error, refresh };
}
