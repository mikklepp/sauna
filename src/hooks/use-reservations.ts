/**
 * Reservations Data Hook
 *
 * Provides unified access to reservation operations regardless of mode.
 * Automatically uses API (online) or IndexedDB (offline).
 */

import { useState, useEffect, useCallback } from 'react';
import { useIsOfflineMode } from './use-mode';
import { db } from '@/db/schema';
import {
  createReservation as createOfflineReservation,
  cancelReservation as cancelOfflineReservation,
} from '@/db/queries';
import { startOfDay } from 'date-fns';

export interface Reservation {
  id: string;
  startTime: string;
  endTime: string;
  adults: number;
  kids: number;
  status: string;
  boat: {
    name: string;
    membershipNumber: string;
    captainName: string | null;
  };
}

interface CreateReservationData {
  saunaId: string;
  boatId: string;
  startTime: string;
  adults: number;
  kids: number;
}

interface UseReservationsResult {
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface UseCreateReservationResult {
  createReservation: (data: CreateReservationData) => Promise<string>;
  loading: boolean;
  error: string | null;
}

interface UseCancelReservationResult {
  cancelReservation: (reservationId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Get reservations for a sauna
 */
export function useReservations(saunaId: string): UseReservationsResult {
  const isOffline = useIsOfflineMode();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOnline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/reservations?saunaId=${saunaId}`);
      if (response.ok) {
        const data = await response.json();
        setReservations(data.data || []);
      } else {
        throw new Error('Failed to fetch reservations');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load reservations'
      );
    } finally {
      setLoading(false);
    }
  }, [saunaId]);

  const fetchOffline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all future reservations from today onwards
      const today = new Date();
      const allReservations = await db.reservations
        .where('saunaId')
        .equals(saunaId)
        .and((r) => new Date(r.startTime) >= startOfDay(today))
        .toArray();

      // Transform to match API format
      const transformed = await Promise.all(
        allReservations.map(async (r) => {
          const boat = await db.boats.get(r.boatId);
          return {
            id: r.id,
            startTime: r.startTime,
            endTime: r.endTime,
            adults: r.adults,
            kids: r.kids,
            status: r.status,
            boat: {
              name: boat?.name || 'Unknown',
              membershipNumber: boat?.membershipNumber || '',
              captainName: boat?.captainName || null,
            },
          };
        })
      );

      setReservations(transformed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load reservations'
      );
    } finally {
      setLoading(false);
    }
  }, [saunaId]);

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

  return { reservations, loading, error, refresh };
}

/**
 * Create a new reservation
 */
export function useCreateReservation(): UseCreateReservationResult {
  const isOffline = useIsOfflineMode();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReservation = useCallback(
    async (data: CreateReservationData): Promise<string> => {
      try {
        setLoading(true);
        setError(null);

        if (isOffline) {
          // Create offline reservation
          const id = await createOfflineReservation({
            saunaId: data.saunaId,
            boatId: data.boatId,
            startTime: data.startTime,
            endTime: new Date(
              new Date(data.startTime).getTime() + 60 * 60 * 1000
            ).toISOString(),
            adults: data.adults,
            kids: data.kids,
            status: 'ACTIVE',
            cancelledAt: null,
          });

          return id;
        } else {
          // Create online reservation
          const response = await fetch('/api/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          if (response.ok) {
            const result = await response.json();
            return result.data.id;
          } else {
            const result = await response.json();
            throw new Error(result.error || 'Failed to create reservation');
          }
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create reservation';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [isOffline]
  );

  return { createReservation, loading, error };
}

/**
 * Cancel a reservation
 */
export function useCancelReservation(): UseCancelReservationResult {
  const isOffline = useIsOfflineMode();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelReservation = useCallback(
    async (reservationId: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        if (isOffline) {
          // Cancel offline reservation
          await cancelOfflineReservation(reservationId);
        } else {
          // Cancel online reservation
          const response = await fetch(`/api/reservations/${reservationId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Failed to cancel reservation');
          }
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to cancel reservation';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [isOffline]
  );

  return { cancelReservation, loading, error };
}

/**
 * Check if a reservation can be cancelled (15-minute rule)
 */
export function canCancelReservation(reservation: Reservation): boolean {
  const startTime = new Date(reservation.startTime);
  const now = new Date();
  const minutesUntilStart = Math.floor(
    (startTime.getTime() - now.getTime()) / (1000 * 60)
  );
  return minutesUntilStart > 15 && reservation.status === 'ACTIVE';
}

/**
 * Check if a reservation is in the past
 */
export function isPastReservation(reservation: Reservation): boolean {
  return new Date(reservation.endTime) < new Date();
}
