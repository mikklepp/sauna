/**
 * Offline Availability Calculator
 *
 * Calculates sauna availability using only local IndexedDB data.
 * This enables Island Devices to show accurate availability even when offline.
 */

import { db } from '@/db/schema';
import type { LocalReservation, LocalSauna } from '@/types';
import { startOfDay, endOfDay, addHours, isBefore, isAfter } from 'date-fns';

export interface OfflineAvailability {
  saunaId: string;
  saunaName: string;
  isCurrentlyReserved: boolean;
  currentReservation?: LocalReservation & { boatName: string };
  nextAvailableTime: Date;
  reason: 'heating' | 'buffer' | 'next_free' | 'in_use';
  sharedReservationToday?: {
    id: string;
    name: string | null;
    startTime: string;
    genderSchedule: string;
    participantCount: number;
  };
}

/**
 * Calculate next available time for a sauna
 */
export async function calculateOfflineAvailability(
  sauna: LocalSauna
): Promise<OfflineAvailability> {
  const now = new Date();

  // Get today's reservations for this sauna
  const todayStart = startOfDay(now).toISOString();
  const todayEnd = endOfDay(now).toISOString();

  const reservations = await db.reservations
    .where('saunaId')
    .equals(sauna.id)
    .and((r) => {
      const startTime = new Date(r.startTime);
      return (
        startTime >= new Date(todayStart) &&
        startTime <= new Date(todayEnd) &&
        r.status === 'ACTIVE'
      );
    })
    .toArray();

  // Check if sauna is currently in use
  let currentReservation: (LocalReservation & { boatName: string }) | undefined;
  for (const res of reservations) {
    const start = new Date(res.startTime);
    const end = new Date(res.endTime);
    if (isBefore(start, now) && isAfter(end, now)) {
      const boat = await db.boats.get(res.boatId);
      currentReservation = {
        ...res,
        boatName: boat?.name ?? 'Unknown',
      };
      break;
    }
  }

  let nextAvailableTime: Date;
  let reason: 'heating' | 'buffer' | 'next_free' | 'in_use';

  if (currentReservation) {
    // Sauna is currently in use
    const currentEnd = new Date(currentReservation.endTime);

    // Find next free slot after current reservation
    nextAvailableTime = findNextFreeSlot(currentEnd, reservations);
    reason = 'in_use';

    // Apply 15-minute buffer rule
    const minutesUntilFree =
      (nextAvailableTime.getTime() - now.getTime()) / 1000 / 60;
    if (minutesUntilFree < 15) {
      // Skip to next hour to respect 15-minute buffer
      nextAvailableTime = addHours(nextAvailableTime, 1);
      reason = 'buffer';
    }
  } else {
    // Sauna is not in use - apply heating time
    const heatingEndTime = addHours(now, sauna.heatingTimeHours);

    // Round up to next hour
    nextAvailableTime = new Date(heatingEndTime);
    nextAvailableTime.setMinutes(0, 0, 0);
    if (heatingEndTime.getMinutes() > 0) {
      nextAvailableTime = addHours(nextAvailableTime, 1);
    }

    // Check if that slot is already reserved
    nextAvailableTime = findNextFreeSlot(nextAvailableTime, reservations);
    reason = 'heating';
  }

  // Check for shared reservations today
  const sharedReservation = await findSharedReservationToday(sauna.id);

  return {
    saunaId: sauna.id,
    saunaName: sauna.name,
    isCurrentlyReserved: !!currentReservation,
    currentReservation,
    nextAvailableTime,
    reason,
    sharedReservationToday: sharedReservation,
  };
}

/**
 * Find next free hourly slot
 */
function findNextFreeSlot(
  startFrom: Date,
  reservations: LocalReservation[]
): Date {
  let candidate = new Date(startFrom);
  candidate.setMinutes(0, 0, 0);

  // If startFrom has minutes, round up to next hour
  if (startFrom.getMinutes() > 0) {
    candidate = addHours(candidate, 1);
  }

  // Check up to 24 hours ahead
  for (let i = 0; i < 24; i++) {
    const slotStart = addHours(candidate, i);
    const slotEnd = addHours(slotStart, 1);

    // Check if this slot conflicts with any reservation
    const hasConflict = reservations.some((res) => {
      const resStart = new Date(res.startTime);
      const resEnd = new Date(res.endTime);

      return (
        (isBefore(slotStart, resEnd) && isAfter(slotEnd, resStart)) ||
        slotStart.getTime() === resStart.getTime()
      );
    });

    if (!hasConflict) {
      return slotStart;
    }
  }

  // If all slots are taken (unlikely), return 24 hours from start
  return addHours(candidate, 24);
}

/**
 * Find shared reservation for today
 */
async function findSharedReservationToday(saunaId: string) {
  const today = new Date();
  const dateStr = startOfDay(today).toISOString().split('T')[0];

  const sharedReservations = await db.sharedReservations
    .where('saunaId')
    .equals(saunaId)
    .and((sr) => sr.date.startsWith(dateStr))
    .toArray();

  if (sharedReservations.length === 0) return undefined;

  const shared = sharedReservations[0];

  // Get participant count
  const participants = await db.sharedParticipants
    .where('sharedReservationId')
    .equals(shared.id)
    .toArray();

  // Format gender schedule
  const genderSchedule =
    shared.genderOrder === 'MALES_FIRST'
      ? `Males: ${shared.malesDurationHours}h, Females: ${shared.femalesDurationHours}h`
      : `Females: ${shared.femalesDurationHours}h, Males: ${shared.malesDurationHours}h`;

  return {
    id: shared.id,
    name: shared.name,
    startTime: shared.startTime,
    genderSchedule,
    participantCount: participants.length,
  };
}

/**
 * Check if a boat has already reserved today on this island
 */
export async function hasBoatReservedTodayOffline(
  boatId: string,
  islandId: string
): Promise<boolean> {
  const today = new Date();
  const dayStart = startOfDay(today).toISOString();
  const dayEnd = endOfDay(today).toISOString();

  // Get all saunas for the island
  const saunas = await db.saunas.where('islandId').equals(islandId).toArray();
  const saunaIds = saunas.map((s) => s.id);

  // Check individual reservations
  const individualReservation = await db.reservations
    .where('boatId')
    .equals(boatId)
    .and((r) => saunaIds.includes(r.saunaId))
    .and((r) => {
      const startTime = new Date(r.startTime);
      return (
        startTime >= new Date(dayStart) &&
        startTime <= new Date(dayEnd) &&
        r.status === 'ACTIVE'
      );
    })
    .first();

  if (individualReservation) {
    return true;
  }

  // Check shared reservation participation
  const sharedParticipation = await db.sharedParticipants
    .where('boatId')
    .equals(boatId)
    .toArray();

  for (const participant of sharedParticipation) {
    const sharedRes = await db.sharedReservations.get(
      participant.sharedReservationId
    );
    if (sharedRes && saunaIds.includes(sharedRes.saunaId)) {
      const resDate = new Date(sharedRes.date);
      if (resDate >= new Date(dayStart) && resDate <= new Date(dayEnd)) {
        return true;
      }
    }
  }

  return false;
}
