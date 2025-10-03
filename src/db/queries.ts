import { db } from './schema';
import type {
  LocalReservation,
  LocalSharedReservation,
  LocalSharedParticipant,
  LocalBoat,
  LocalSauna,
} from '@/types';
import { startOfDay, endOfDay } from 'date-fns';

// ============================================================================
// RESERVATION QUERIES
// ============================================================================

/**
 * Create a new reservation in local database
 */
export async function createReservation(
  reservation: Omit<LocalReservation, 'id' | 'createdAt' | 'syncStatus'>
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  await db.reservations.add({
    ...reservation,
    id,
    createdAt: now,
    syncStatus: 'pending',
  });
  
  // Add to sync queue
  await addToSyncQueue({
    entityType: 'reservation',
    entityId: id,
    operation: 'create',
    data: { ...reservation, id, createdAt: now },
    timestamp: new Date(),
  });
  
  return id;
}

/**
 * Get reservations for a sauna on a specific date
 */
export async function getReservationsForSaunaDate(
  saunaId: string,
  date: Date
): Promise<LocalReservation[]> {
  const dayStart = startOfDay(date).toISOString();
  const dayEnd = endOfDay(date).toISOString();
  
  return db.reservations
    .where('saunaId')
    .equals(saunaId)
    .and(r => {
      const startTime = new Date(r.startTime);
      return startTime >= new Date(dayStart) && startTime <= new Date(dayEnd);
    })
    .and(r => r.status === 'ACTIVE')
    .toArray();
}

/**
 * Cancel a reservation
 */
export async function cancelReservation(reservationId: string): Promise<void> {
  const now = new Date().toISOString();
  
  await db.reservations.update(reservationId, {
    status: 'CANCELLED',
    cancelledAt: now,
    syncStatus: 'pending',
  });
  
  // Add to sync queue
  const reservation = await db.reservations.get(reservationId);
  if (reservation) {
    await addToSyncQueue({
      entityType: 'reservation',
      entityId: reservationId,
      operation: 'update',
      data: { ...reservation, status: 'CANCELLED', cancelledAt: now },
      timestamp: new Date(),
    });
  }
}

/**
 * Check if a boat has a reservation on an island for a given date
 */
export async function hasBoatReservationToday(
  boatId: string,
  islandId: string,
  date: Date
): Promise<boolean> {
  // Get all saunas for the island
  const saunas = await db.saunas.where('islandId').equals(islandId).toArray();
  const saunaIds = saunas.map(s => s.id);
  
  const dayStart = startOfDay(date).toISOString();
  const dayEnd = endOfDay(date).toISOString();
  
  // Check individual reservations
  const individualReservation = await db.reservations
    .where('boatId')
    .equals(boatId)
    .and(r => saunaIds.includes(r.saunaId))
    .and(r => {
      const startTime = new Date(r.startTime);
      return startTime >= new Date(dayStart) && startTime <= new Date(dayEnd);
    })
    .and(r => r.status === 'ACTIVE')
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
    const sharedRes = await db.sharedReservations.get(participant.sharedReservationId);
    if (sharedRes && saunaIds.includes(sharedRes.saunaId)) {
      const resDate = new Date(sharedRes.date);
      if (resDate >= new Date(dayStart) && resDate <= new Date(dayEnd)) {
        return true;
      }
    }
  }
  
  return false;
}

// ============================================================================
// SHARED RESERVATION QUERIES
// ============================================================================

/**
 * Create a shared reservation
 */
export async function createSharedReservation(
  sharedReservation: Omit<LocalSharedReservation, 'id' | 'syncStatus'>
): Promise<string> {
  const id = crypto.randomUUID();
  
  await db.sharedReservations.add({
    ...sharedReservation,
    id,
    syncStatus: 'pending',
  });
  
  // Add to sync queue
  await addToSyncQueue({
    entityType: 'shared_reservation',
    entityId: id,
    operation: 'create',
    data: { ...sharedReservation, id },
    timestamp: new Date(),
  });
  
  return id;
}

/**
 * Get shared reservations for a sauna on a specific date
 */
export async function getSharedReservationsForSaunaDate(
  saunaId: string,
  date: Date
): Promise<LocalSharedReservation[]> {
  const dateStr = startOfDay(date).toISOString().split('T')[0];
  
  return db.sharedReservations
    .where('saunaId')
    .equals(saunaId)
    .and(sr => sr.date.startsWith(dateStr))
    .toArray();
}

/**
 * Join a shared reservation
 */
export async function joinSharedReservation(
  sharedReservationId: string,
  boatId: string,
  adults: number,
  kids: number
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  await db.sharedParticipants.add({
    id,
    sharedReservationId,
    boatId,
    adults,
    kids,
    joinedAt: now,
    syncStatus: 'pending',
  });
  
  // Add to sync queue
  await addToSyncQueue({
    entityType: 'shared_participant',
    entityId: id,
    operation: 'create',
    data: { id, sharedReservationId, boatId, adults, kids, joinedAt: now },
    timestamp: new Date(),
  });
  
  return id;
}

/**
 * Get participants for a shared reservation
 */
export async function getSharedReservationParticipants(
  sharedReservationId: string
): Promise<(LocalSharedParticipant & { boat: LocalBoat })[]> {
  const participants = await db.sharedParticipants
    .where('sharedReservationId')
    .equals(sharedReservationId)
    .toArray();
  
  const result = [];
  for (const participant of participants) {
    const boat = await db.boats.get(participant.boatId);
    if (boat) {
      result.push({ ...participant, boat });
    }
  }
  
  return result;
}

/**
 * Cancel a shared reservation and convert participants
 */
export async function cancelAndConvertSharedReservation(
  sharedReservationId: string,
  conversions: { boatId: string; startTime: Date; endTime: Date }[]
): Promise<void> {
  const now = new Date().toISOString();
  
  // Update shared reservation
  await db.sharedReservations.update(sharedReservationId, {
    autoCancelledAt: now,
    convertedToIndividual: true,
    syncStatus: 'pending',
  });
  
  // Get shared reservation details
  const sharedRes = await db.sharedReservations.get(sharedReservationId);
  if (!sharedRes) return;
  
  // Get participants for their adult/kid counts
  const participants = await db.sharedParticipants
    .where('sharedReservationId')
    .equals(sharedReservationId)
    .toArray();
  
  // Create individual reservations for conversions
  for (const conversion of conversions) {
    const participant = participants.find(p => p.boatId === conversion.boatId);
    if (participant) {
      await createReservation({
        saunaId: sharedRes.saunaId,
        boatId: conversion.boatId,
        startTime: conversion.startTime.toISOString(),
        endTime: conversion.endTime.toISOString(),
        adults: participant.adults,
        kids: participant.kids,
        status: 'ACTIVE',
        cancelledAt: null,
      });
    }
  }
  
  // Add to sync queue
  await addToSyncQueue({
    entityType: 'shared_reservation',
    entityId: sharedReservationId,
    operation: 'update',
    data: { ...sharedRes, autoCancelledAt: now, convertedToIndividual: true },
    timestamp: new Date(),
  });
}

// ============================================================================
// BOAT QUERIES
// ============================================================================

/**
 * Search boats by name or membership number
 */
export async function searchBoats(query: string, clubId: string): Promise<LocalBoat[]> {
  const lowerQuery = query.toLowerCase();
  
  return db.boats
    .where('clubId')
    .equals(clubId)
    .and(boat => 
      boat.name.toLowerCase().includes(lowerQuery) ||
      boat.membershipNumber.toLowerCase().includes(lowerQuery)
    )
    .toArray();
}

/**
 * Get boat by membership number
 */
export async function getBoatByMembershipNumber(
  membershipNumber: string,
  clubId: string
): Promise<LocalBoat | undefined> {
  return db.boats
    .where('[clubId+membershipNumber]')
    .equals([clubId, membershipNumber])
    .first();
}

// ============================================================================
// SAUNA QUERIES
// ============================================================================

/**
 * Get all saunas for an island
 */
export async function getSaunasForIsland(islandId: string): Promise<LocalSauna[]> {
  return db.saunas.where('islandId').equals(islandId).toArray();
}

/**
 * Get saunas eligible for Club Sauna
 */
export async function getClubSaunaEligibleSaunas(islandId: string): Promise<LocalSauna[]> {
  return db.saunas
    .where('islandId')
    .equals(islandId)
    .and(s => s.autoClubSaunaEnabled === true)
    .toArray();
}

// ============================================================================
// SYNC QUEUE
// ============================================================================

import type { SyncChange } from '@/types';

/**
 * Add a change to the sync queue
 */
export async function addToSyncQueue(change: Omit<SyncChange, 'id'>): Promise<void> {
  await db.syncQueue.add({
    ...change,
    id: crypto.randomUUID(),
  });
}

/**
 * Get pending sync changes
 */
export async function getPendingSyncChanges(): Promise<SyncChange[]> {
  return db.syncQueue.toArray();
}

/**
 * Clear synced changes from queue
 */
export async function clearSyncedChanges(changeIds: string[]): Promise<void> {
  await db.syncQueue.bulkDelete(changeIds);
}

/**
 * Mark entities as synced
 */
export async function markAsSynced(
  entityType: string,
  entityIds: string[]
): Promise<void> {
  for (const id of entityIds) {
    switch (entityType) {
      case 'reservation':
        await db.reservations.update(id, { syncStatus: 'synced' });
        break;
      case 'shared_reservation':
        await db.sharedReservations.update(id, { syncStatus: 'synced' });
        break;
      case 'shared_participant':
        await db.sharedParticipants.update(id, { syncStatus: 'synced' });
        break;
    }
  }
}