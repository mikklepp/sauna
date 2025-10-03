import { Sauna, Reservation } from '@prisma/client';
import { addHours, startOfHour, addMinutes, isBefore, isAfter } from 'date-fns';
import type { NextAvailableSlot } from '@/types';

/**
 * Calculate the next available time slot for a sauna
 * 
 * Business Rules:
 * 1. If sauna is currently reserved:
 *    - Next available = next free hour slot
 *    - UNLESS next free slot is within 15 minutes (then skip to following hour)
 * 2. If sauna is not currently reserved:
 *    - Propose time slot based on heating time (default 2-3 hours in future)
 */
export function calculateNextAvailable(
  sauna: Sauna,
  currentReservation: Reservation | null,
  futureReservations: Reservation[],
  now: Date = new Date()
): NextAvailableSlot {
  const currentHour = startOfHour(now);
  
  // Case 1: Sauna is currently reserved
  if (currentReservation && isBefore(now, currentReservation.endTime)) {
    const nextFreeSlot = startOfHour(currentReservation.endTime);
    const minutesUntilFree = Math.floor(
      (currentReservation.endTime.getTime() - now.getTime()) / (1000 * 60)
    );
    
    // If next free slot is within 15 minutes, skip to following hour
    let proposedSlot = nextFreeSlot;
    if (minutesUntilFree <= 15) {
      proposedSlot = addHours(nextFreeSlot, 1);
    }
    
    // Check if proposed slot is already reserved, find next free
    const finalSlot = findNextFreeSlot(proposedSlot, futureReservations);
    
    return {
      saunaId: sauna.id,
      saunaName: sauna.name,
      startTime: finalSlot,
      endTime: addHours(finalSlot, 1),
      reason: minutesUntilFree <= 15 ? 'buffer' : 'next_free',
    };
  }
  
  // Case 2: Sauna is not currently reserved - apply heating time
  const heatingTimeSlot = addHours(currentHour, sauna.heatingTimeHours);
  
  // Ensure heating time slot hasn't passed (if checking in past)
  const proposedSlot = isAfter(heatingTimeSlot, currentHour) 
    ? heatingTimeSlot 
    : addHours(currentHour, 1);
  
  // Check if proposed slot is already reserved
  const finalSlot = findNextFreeSlot(proposedSlot, futureReservations);
  
  return {
    saunaId: sauna.id,
    saunaName: sauna.name,
    startTime: finalSlot,
    endTime: addHours(finalSlot, 1),
    reason: 'heating',
  };
}

/**
 * Find the next free hour slot that isn't reserved
 */
function findNextFreeSlot(
  startSlot: Date,
  reservations: Reservation[]
): Date {
  let candidateSlot = startOfHour(startSlot);
  const maxIterations = 100; // Prevent infinite loop
  let iterations = 0;
  
  while (iterations < maxIterations) {
    const candidateEnd = addHours(candidateSlot, 1);
    
    // Check if this slot overlaps with any reservation
    const hasConflict = reservations.some(reservation => {
      const reservationStart = startOfHour(reservation.startTime);
      const reservationEnd = startOfHour(reservation.endTime);
      
      // Check for overlap
      return (
        (candidateSlot >= reservationStart && candidateSlot < reservationEnd) ||
        (candidateEnd > reservationStart && candidateEnd <= reservationEnd) ||
        (candidateSlot <= reservationStart && candidateEnd >= reservationEnd)
      );
    });
    
    if (!hasConflict) {
      return candidateSlot;
    }
    
    // Try next hour
    candidateSlot = addHours(candidateSlot, 1);
    iterations++;
  }
  
  // Fallback if all slots checked are reserved (unlikely)
  return addHours(startSlot, maxIterations);
}

/**
 * Check if a specific time slot is available for reservation
 */
export function isSlotAvailable(
  startTime: Date,
  endTime: Date,
  existingReservations: Reservation[]
): boolean {
  const slotStart = startOfHour(startTime);
  const slotEnd = startOfHour(endTime);
  
  // Check if slot is in the past
  if (isBefore(slotStart, new Date())) {
    return false;
  }
  
  // Check for conflicts with existing reservations
  return !existingReservations.some(reservation => {
    const reservationStart = startOfHour(reservation.startTime);
    const reservationEnd = startOfHour(reservation.endTime);
    
    return (
      (slotStart >= reservationStart && slotStart < reservationEnd) ||
      (slotEnd > reservationStart && slotEnd <= reservationEnd) ||
      (slotStart <= reservationStart && slotEnd >= reservationEnd)
    );
  });
}

/**
 * Check if a reservation can be cancelled
 * Rule: Cancellation only allowed until 15 minutes before start time
 */
export function canCancelReservation(
  reservation: Reservation,
  now: Date = new Date()
): { canCancel: boolean; minutesUntilStart: number; reason?: string } {
  if (reservation.status !== 'ACTIVE') {
    return {
      canCancel: false,
      minutesUntilStart: 0,
      reason: 'already_cancelled',
    };
  }
  
  if (isBefore(now, reservation.startTime)) {
    const minutesUntilStart = Math.floor(
      (reservation.startTime.getTime() - now.getTime()) / (1000 * 60)
    );
    
    if (minutesUntilStart > 15) {
      return {
        canCancel: true,
        minutesUntilStart,
      };
    }
    
    return {
      canCancel: false,
      minutesUntilStart,
      reason: 'too_late',
    };
  }
  
  return {
    canCancel: false,
    minutesUntilStart: 0,
    reason: 'already_started',
  };
}

/**
 * Validate time slot format
 * - Must be at top of hour (minutes = 0)
 * - Duration must be exactly 1 hour
 */
export function validateTimeSlot(startTime: Date, endTime: Date): {
  valid: boolean;
  error?: string;
} {
  // Check if start time is at top of hour
  if (startTime.getMinutes() !== 0 || startTime.getSeconds() !== 0) {
    return {
      valid: false,
      error: 'Start time must be at the top of the hour',
    };
  }
  
  // Check if duration is exactly 1 hour
  const durationMs = endTime.getTime() - startTime.getTime();
  const oneHourMs = 60 * 60 * 1000;
  
  if (durationMs !== oneHourMs) {
    return {
      valid: false,
      error: 'Reservation duration must be exactly 1 hour',
    };
  }
  
  // Check if end time is also at top of hour
  if (endTime.getMinutes() !== 0 || endTime.getSeconds() !== 0) {
    return {
      valid: false,
      error: 'End time must be at the top of the hour',
    };
  }
  
  return { valid: true };
}

/**
 * Get the current reservation for a sauna (if any)
 */
export function getCurrentReservation(
  reservations: Reservation[],
  now: Date = new Date()
): Reservation | null {
  return reservations.find(
    (r) =>
      r.status === 'ACTIVE' &&
      isBefore(r.startTime, now) &&
      isAfter(r.endTime, now)
  ) || null;
}

/**
 * Get future reservations for a sauna
 */
export function getFutureReservations(
  reservations: Reservation[],
  now: Date = new Date()
): Reservation[] {
  return reservations.filter(
    (r) =>
      r.status === 'ACTIVE' &&
      isAfter(r.startTime, now)
  ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}