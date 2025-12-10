/**
 * Boats Data Hook
 *
 * Provides unified access to boat data regardless of mode.
 * Automatically searches API (online) or IndexedDB (offline).
 */

import { useState, useEffect, useCallback } from 'react';
import { useIsOfflineMode } from './use-mode';
import { db, getDeviceConfig } from '@/db/schema';

export interface Boat {
  id: string;
  name: string;
  membershipNumber: string;
  captainName: string | null;
  phoneNumber?: string | null;
}

interface UseBoatsSearchResult {
  boats: Boat[];
  loading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
}

/**
 * Search boats by name or membership number
 */
export function useBoatsSearch(): UseBoatsSearchResult {
  const isOffline = useIsOfflineMode();
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchOnline = useCallback(async (query: string) => {
    if (query.length < 2) {
      setBoats([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/boats/search?q=${encodeURIComponent(query)}`
      );

      if (response.ok) {
        const data = await response.json();
        setBoats(data.data || []);
      } else {
        throw new Error('Failed to search boats');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search boats');
      setBoats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchOffline = useCallback(async (query: string) => {
    if (query.length < 2) {
      setBoats([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get club ID from device config
      const config = await getDeviceConfig();
      if (!config.isConfigured) {
        throw new Error('Device not configured');
      }

      // Get island to find club
      const island = await db.islands.get(config.assignedIslandId || '');
      if (!island) {
        throw new Error('Island not found');
      }

      const lowerQuery = query.toLowerCase();

      // Search boats in the club
      const results = await db.boats
        .where('clubId')
        .equals(island.clubId)
        .and(
          (boat) =>
            boat.name.toLowerCase().includes(lowerQuery) ||
            boat.membershipNumber.toLowerCase().includes(lowerQuery)
        )
        .limit(10)
        .toArray();

      setBoats(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search boats');
      setBoats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(
    async (query: string) => {
      if (isOffline) {
        await searchOffline(query);
      } else {
        await searchOnline(query);
      }
    },
    [isOffline, searchOffline, searchOnline]
  );

  return { boats, loading, error, search };
}

/**
 * Check if a boat has already reserved on an island today
 */
export function useBoatDailyLimit(boatId: string | null, islandId: string) {
  const isOffline = useIsOfflineMode();
  const [canReserve, setCanReserve] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boatId) {
      setCanReserve(true);
      return;
    }

    async function checkLimit() {
      try {
        setLoading(true);
        setError(null);

        if (!boatId) return;

        if (isOffline) {
          // Check offline using IndexedDB
          const { hasBoatReservedTodayOffline } = await import(
            '@/lib/offline-availability'
          );
          const hasReservation = await hasBoatReservedTodayOffline(
            boatId,
            islandId
          );
          setCanReserve(!hasReservation);
        } else {
          // Check online using API
          const response = await fetch(
            `/api/boats/${boatId}/daily-limit?islandId=${islandId}&date=${new Date().toISOString()}`
          );

          if (response.ok) {
            const data = await response.json();
            setCanReserve(data.data.canReserve);
          } else {
            throw new Error('Failed to check daily limit');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check limit');
        setCanReserve(false);
      } finally {
        setLoading(false);
      }
    }

    checkLimit();
  }, [boatId, islandId, isOffline]);

  return { canReserve, loading, error };
}

/**
 * Get a single boat by ID
 */
export function useBoat(boatId: string | null) {
  const isOffline = useIsOfflineMode();
  const [boat, setBoat] = useState<Boat | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boatId) {
      setBoat(null);
      return;
    }

    async function fetchBoat() {
      try {
        setLoading(true);
        setError(null);

        if (isOffline) {
          const boatData = await db.boats.get(boatId);
          setBoat(boatData || null);
        } else {
          const response = await fetch(`/api/boats/${boatId}`);
          if (response.ok) {
            const data = await response.json();
            setBoat(data.data);
          } else {
            throw new Error('Failed to fetch boat');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load boat');
        setBoat(null);
      } finally {
        setLoading(false);
      }
    }

    fetchBoat();
  }, [boatId, isOffline]);

  return { boat, loading, error };
}
