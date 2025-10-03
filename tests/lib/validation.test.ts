import { describe, it, expect } from 'vitest';
import {
  sanitizeSearchQuery,
  createReservationSchema,
  joinSharedReservationSchema,
} from '@/lib/validation';
import { canCancelReservation } from '@/lib/availability';

describe('canCancelReservation', () => {
  it('should allow cancellation when reservation starts in more than 15 minutes', () => {
    const reservation = {
      id: 'res-1',
      saunaId: 'sauna-1',
      boatId: 'boat-1',
      startTime: new Date(Date.now() + 20 * 60 * 1000), // 20 minutes from now
      endTime: new Date(Date.now() + 80 * 60 * 1000),
      adults: 2,
      kids: 0,
      status: 'ACTIVE' as const,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = canCancelReservation(reservation);
    expect(result.canCancel).toBe(true);
  });

  it('should not allow cancellation when reservation starts in less than 15 minutes', () => {
    const reservation = {
      id: 'res-1',
      saunaId: 'sauna-1',
      boatId: 'boat-1',
      startTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      endTime: new Date(Date.now() + 70 * 60 * 1000),
      adults: 2,
      kids: 0,
      status: 'ACTIVE' as const,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = canCancelReservation(reservation);
    expect(result.canCancel).toBe(false);
    expect(result.reason).toBe('too_late');
  });

  it('should not allow cancellation when reservation has already started', () => {
    const reservation = {
      id: 'res-1',
      saunaId: 'sauna-1',
      boatId: 'boat-1',
      startTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      endTime: new Date(Date.now() + 55 * 60 * 1000),
      adults: 2,
      kids: 0,
      status: 'ACTIVE' as const,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = canCancelReservation(reservation);
    expect(result.canCancel).toBe(false);
    expect(result.reason).toBe('already_started');
  });

  it('should not allow cancellation when reservation is not active', () => {
    const reservation = {
      id: 'res-1',
      saunaId: 'sauna-1',
      boatId: 'boat-1',
      startTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      endTime: new Date(Date.now() + 90 * 60 * 1000),
      adults: 2,
      kids: 0,
      status: 'CANCELLED' as const,
      cancelledAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = canCancelReservation(reservation);
    expect(result.canCancel).toBe(false);
    expect(result.reason).toBe('already_cancelled');
  });
});

describe('sanitizeSearchQuery', () => {
  it('should trim and lowercase the query', () => {
    expect(sanitizeSearchQuery('  Hello World  ')).toBe('hello world');
  });

  it('should handle empty strings', () => {
    expect(sanitizeSearchQuery('')).toBe('');
  });

  it('should handle special characters', () => {
    expect(sanitizeSearchQuery('Boat-123')).toBe('boat-123');
  });
});

describe('createReservationSchema', () => {
  it('should validate correct reservation data', () => {
    const validData = {
      saunaId: '123e4567-e89b-12d3-a456-426614174000',
      boatId: '123e4567-e89b-12d3-a456-426614174001',
      startTime: new Date().toISOString(),
      adults: 2,
      kids: 1,
    };

    const result = createReservationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid adults count', () => {
    const invalidData = {
      saunaId: '123e4567-e89b-12d3-a456-426614174000',
      boatId: '123e4567-e89b-12d3-a456-426614174001',
      startTime: new Date().toISOString(),
      adults: 0, // Invalid - must be at least 1
      kids: 0,
    };

    const result = createReservationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject negative kids count', () => {
    const invalidData = {
      saunaId: '123e4567-e89b-12d3-a456-426614174000',
      boatId: '123e4567-e89b-12d3-a456-426614174001',
      startTime: new Date().toISOString(),
      adults: 2,
      kids: -1, // Invalid
    };

    const result = createReservationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject missing required fields', () => {
    const invalidData = {
      saunaId: '123e4567-e89b-12d3-a456-426614174000',
      // Missing boatId, startTime, adults
    };

    const result = createReservationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('joinSharedReservationSchema', () => {
  it('should validate correct join data', () => {
    const validData = {
      sharedReservationId: '123e4567-e89b-12d3-a456-426614174000',
      boatId: '123e4567-e89b-12d3-a456-426614174001',
      adults: 2,
      kids: 0,
    };

    const result = joinSharedReservationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should allow default kids value of 0', () => {
    const validData = {
      sharedReservationId: '123e4567-e89b-12d3-a456-426614174000',
      boatId: '123e4567-e89b-12d3-a456-426614174001',
      adults: 2,
    };

    const result = joinSharedReservationSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kids).toBe(0);
    }
  });

  it('should reject invalid adults count for shared reservation', () => {
    const invalidData = {
      sharedReservationId: '123e4567-e89b-12d3-a456-426614174000',
      boatId: '123e4567-e89b-12d3-a456-426614174001',
      adults: 0,
      kids: 0,
    };

    const result = joinSharedReservationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
