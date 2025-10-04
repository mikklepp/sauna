import { describe, it, expect } from 'vitest';
import { calculateNextAvailable } from '@/lib/availability';
import { Sauna, Reservation } from '@prisma/client';

describe('calculateNextAvailable', () => {
  const mockSauna: Sauna = {
    id: 'sauna-1',
    name: 'Test Sauna',
    islandId: 'island-1',
    heatingTimeHours: 2,
    autoClubSaunaEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('when sauna is currently reserved', () => {
    it('should return next free slot when reservation ends > 15 minutes from now', () => {
      const now = new Date('2025-01-15T14:30:00');
      const currentReservation: Reservation = {
        id: 'res-1',
        saunaId: 'sauna-1',
        boatId: 'boat-1',
        cancelledAt: null,
        startTime: new Date('2025-01-15T14:00:00'),
        endTime: new Date('2025-01-15T15:00:00'),
        adults: 2,
        kids: 0,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = calculateNextAvailable(
        mockSauna,
        currentReservation,
        [],
        now
      );

      expect(result.startTime).toEqual(new Date('2025-01-15T15:00:00'));
      expect(result.endTime).toEqual(new Date('2025-01-15T16:00:00'));
      expect(result.reason).toBe('next_free');
    });

    it('should skip to following hour when reservation ends within 15 minutes', () => {
      const now = new Date('2025-01-15T14:50:00');
      const currentReservation: Reservation = {
        id: 'res-1',
        saunaId: 'sauna-1',
        boatId: 'boat-1',
        cancelledAt: null,
        startTime: new Date('2025-01-15T14:00:00'),
        endTime: new Date('2025-01-15T15:00:00'),
        adults: 2,
        kids: 0,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = calculateNextAvailable(
        mockSauna,
        currentReservation,
        [],
        now
      );

      expect(result.startTime).toEqual(new Date('2025-01-15T16:00:00'));
      expect(result.endTime).toEqual(new Date('2025-01-15T17:00:00'));
      expect(result.reason).toBe('buffer');
    });

    it('should find next free slot when proposed slot is already reserved', () => {
      const now = new Date('2025-01-15T14:30:00');
      const currentReservation: Reservation = {
        id: 'res-1',
        saunaId: 'sauna-1',
        boatId: 'boat-1',
        cancelledAt: null,
        startTime: new Date('2025-01-15T14:00:00'),
        endTime: new Date('2025-01-15T15:00:00'),
        adults: 2,
        kids: 0,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const futureReservations: Reservation[] = [
        {
          id: 'res-2',
          saunaId: 'sauna-1',
          boatId: 'boat-2',
          cancelledAt: null,
          startTime: new Date('2025-01-15T15:00:00'),
          endTime: new Date('2025-01-15T16:00:00'),
          adults: 2,
          kids: 0,
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateNextAvailable(
        mockSauna,
        currentReservation,
        futureReservations,
        now
      );

      expect(result.startTime).toEqual(new Date('2025-01-15T16:00:00'));
      expect(result.endTime).toEqual(new Date('2025-01-15T17:00:00'));
    });
  });

  describe('when sauna is not currently reserved', () => {
    it('should apply heating time to determine start time', () => {
      const now = new Date('2025-01-15T14:30:00');

      const result = calculateNextAvailable(mockSauna, null, [], now);

      // With 2 hours heating time, from 14:00 (current hour) -> 16:00
      expect(result.startTime).toEqual(new Date('2025-01-15T16:00:00'));
      expect(result.endTime).toEqual(new Date('2025-01-15T17:00:00'));
      expect(result.reason).toBe('heating');
    });

    it('should find next free slot if heating time slot is reserved', () => {
      const now = new Date('2025-01-15T14:30:00');

      const futureReservations: Reservation[] = [
        {
          id: 'res-1',
          saunaId: 'sauna-1',
          boatId: 'boat-1',
          cancelledAt: null,
          startTime: new Date('2025-01-15T16:00:00'),
          endTime: new Date('2025-01-15T17:00:00'),
          adults: 2,
          kids: 0,
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateNextAvailable(
        mockSauna,
        null,
        futureReservations,
        now
      );

      expect(result.startTime).toEqual(new Date('2025-01-15T17:00:00'));
      expect(result.endTime).toEqual(new Date('2025-01-15T18:00:00'));
    });
  });
});
