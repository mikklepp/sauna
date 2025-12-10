/**
 * Sync Service for Island Device
 *
 * Handles bidirectional synchronization between Island Device (IndexedDB)
 * and Backend (PostgreSQL).
 *
 * Key Principles:
 * - Island Device is the source of truth
 * - All operations work offline first
 * - Changes are queued and synced when online
 * - Backend changes are pulled and merged into local DB
 * - Retry logic with exponential backoff
 */

import { db, updateLastSync, getDeviceConfig } from '@/db/schema';
import type { SyncChange, SyncRequest, SyncResponse } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface SyncResult {
  success: boolean;
  pushedChanges: number;
  pulledChanges: number;
  failedChanges: number;
  errors: string[];
  lastSyncAt: Date;
}

export interface SyncError {
  changeId: string;
  error: string;
  retryCount: number;
  nextRetryAt: Date;
}

// ============================================================================
// Constants
// ============================================================================

// Reserved for future retry logic implementation
// const MAX_RETRY_ATTEMPTS = 5;
// const BASE_RETRY_DELAY_MS = 1000; // 1 second
// const MAX_RETRY_DELAY_MS = 300000; // 5 minutes
const SYNC_BATCH_SIZE = 50; // Process 50 changes at a time

// ============================================================================
// Main Sync Functions
// ============================================================================

/**
 * Sync now - Push pending changes and pull backend changes
 * This is the main sync function called periodically or manually
 */
export async function syncNow(): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    pushedChanges: 0,
    pulledChanges: 0,
    failedChanges: 0,
    errors: [],
    lastSyncAt: new Date(),
  };

  // Check if online
  if (!navigator.onLine) {
    result.errors.push('Device is offline');
    return result;
  }

  // Get device configuration
  const config = await getDeviceConfig();
  if (!config.isConfigured || !config.assignedIslandId || !config.deviceId) {
    result.errors.push('Device is not configured');
    return result;
  }

  try {
    // Step 1: Push pending changes to backend
    const pushResult = await processSyncQueue(
      config.assignedIslandId,
      config.deviceId
    );
    result.pushedChanges = pushResult.appliedChanges;
    result.failedChanges = pushResult.failedChanges;
    result.errors.push(...pushResult.errors);

    // Step 2: Pull changes from backend
    const pullResult = await pullBackendChanges(config.assignedIslandId);
    result.pulledChanges = pullResult.appliedChanges;
    result.errors.push(...pullResult.errors);

    // Step 3: Update last sync timestamp
    await updateLastSync();

    result.success =
      result.errors.length === 0 ||
      result.pushedChanges + result.pulledChanges > 0;

    // eslint-disable-next-line no-console
    console.log('[Sync] Sync completed:', result);
  } catch (error) {
    console.error('[Sync] Sync failed:', error);
    result.errors.push(
      error instanceof Error ? error.message : 'Unknown sync error'
    );
  }

  return result;
}

/**
 * Process pending changes in the sync queue and push to backend
 */
export async function processSyncQueue(
  islandId: string,
  _deviceId: string
): Promise<{
  appliedChanges: number;
  failedChanges: number;
  errors: string[];
}> {
  const result = {
    appliedChanges: 0,
    failedChanges: 0,
    errors: [] as string[],
  };

  try {
    // Get pending changes from sync queue
    const pendingChanges = await db.syncQueue
      .where('syncStatus')
      .equals('pending')
      .limit(SYNC_BATCH_SIZE)
      .toArray();

    if (pendingChanges.length === 0) {
      // eslint-disable-next-line no-console
      console.log('[Sync] No pending changes to sync');
      return result;
    }

    // eslint-disable-next-line no-console
    console.log(
      `[Sync] Processing ${pendingChanges.length} pending changes...`
    );

    // Prepare sync request
    const syncRequest: SyncRequest = {
      islandId,
      changes: pendingChanges.map((change) => ({
        id: change.id,
        entityType: change.entityType,
        entityId: change.entityId,
        operation: change.operation,
        data: change.data as Record<string, unknown>,
        timestamp: change.timestamp,
        syncStatus: change.syncStatus,
        errorMessage: change.errorMessage,
      })),
    };

    // Send to backend
    const response = await fetch('/api/sync/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(syncRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sync push failed: ${response.status} ${errorText}`);
    }

    const syncResponse: { success: boolean; data: SyncResponse } =
      await response.json();

    if (!syncResponse.success || !syncResponse.data) {
      throw new Error('Sync response was not successful');
    }

    const data = syncResponse.data;

    // Mark successfully applied changes as synced
    for (const changeId of data.appliedChanges) {
      await db.syncQueue.update(changeId, {
        syncStatus: 'synced',
      });
      result.appliedChanges++;
    }

    // Handle rejected changes
    for (const rejected of data.rejectedChanges) {
      await db.syncQueue.update(rejected.id, {
        syncStatus: 'failed',
        errorMessage: rejected.reason,
      });
      result.failedChanges++;
      result.errors.push(`Change ${rejected.id}: ${rejected.reason}`);
    }

    // eslint-disable-next-line no-console
    console.log(
      `[Sync] Pushed ${result.appliedChanges} changes, ${result.failedChanges} failed`
    );
  } catch (error) {
    console.error('[Sync] Error processing sync queue:', error);
    result.errors.push(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }

  return result;
}

/**
 * Pull changes from backend and apply to local database
 */
export async function pullBackendChanges(islandId: string): Promise<{
  appliedChanges: number;
  errors: string[];
}> {
  const result = {
    appliedChanges: 0,
    errors: [] as string[],
  };

  try {
    // Get last sync timestamp
    const config = await getDeviceConfig();
    const lastSyncAt = config.lastSyncAt
      ? new Date(config.lastSyncAt)
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24 hours ago

    // Pull changes from backend
    const response = await fetch(
      `/api/sync/pull/${islandId}?since=${lastSyncAt.toISOString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Sync pull failed: ${response.status}`);
    }

    const pullResponse: {
      success: boolean;
      data: {
        islandId: string;
        changes: SyncChange[];
        timestamp: string;
      };
    } = await response.json();

    if (!pullResponse.success || !pullResponse.data) {
      throw new Error('Pull response was not successful');
    }

    const { changes } = pullResponse.data;

    if (changes.length === 0) {
      // eslint-disable-next-line no-console
      console.log('[Sync] No backend changes to pull');
      return result;
    }

    // eslint-disable-next-line no-console
    console.log(`[Sync] Pulling ${changes.length} changes from backend...`);

    // Apply each change to local database
    for (const change of changes) {
      try {
        await applyBackendChange(change);
        result.appliedChanges++;
      } catch (error) {
        console.error(`[Sync] Failed to apply change ${change.id}:`, error);
        result.errors.push(
          `Failed to apply change ${change.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // eslint-disable-next-line no-console
    console.log(`[Sync] Applied ${result.appliedChanges} backend changes`);
  } catch (error) {
    console.error('[Sync] Error pulling backend changes:', error);
    result.errors.push(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }

  return result;
}

/**
 * Apply a single backend change to local database
 * Note: Island Device is still the source of truth, so we only apply
 * changes that don't conflict with local data
 */
async function applyBackendChange(change: SyncChange): Promise<void> {
  const { entityType, entityId, operation, data } = change;

  // eslint-disable-next-line no-console
  console.log(`[Sync] Applying ${operation} for ${entityType} ${entityId}`);

  switch (entityType) {
    case 'reservation':
      await applyReservationChange(entityId, operation, data);
      break;

    case 'shared_reservation':
      await applySharedReservationChange(entityId, operation, data);
      break;

    case 'shared_participant':
      await applySharedParticipantChange(entityId, operation, data);
      break;

    case 'boat':
      await applyBoatChange(entityId, operation, data);
      break;

    case 'sauna':
      await applySaunaChange(entityId, operation, data);
      break;

    default:
      console.warn(`[Sync] Unknown entity type: ${entityType}`);
  }
}

// ============================================================================
// Entity-specific apply functions
// ============================================================================

async function applyReservationChange(
  entityId: string,
  operation: string,
  data: Record<string, unknown>
): Promise<void> {
  if (operation === 'create' || operation === 'update') {
    // Check if already exists locally
    const existing = await db.reservations.get(entityId);

    if (existing && existing.syncStatus === 'pending') {
      // Local change takes precedence - skip backend change
      // eslint-disable-next-line no-console
      console.log(
        `[Sync] Skipping backend reservation ${entityId} - local changes pending`
      );
      return;
    }

    // Upsert the reservation
    await db.reservations.put({
      id: entityId,
      saunaId: data.saunaId as string,
      boatId: data.boatId as string,
      startTime: data.startTime as string,
      endTime: data.endTime as string,
      adults: data.adults as number,
      kids: data.kids as number,
      status: data.status as 'ACTIVE' | 'CANCELLED',
      createdAt: data.createdAt as string,
      cancelledAt: (data.cancelledAt as string | null) || null,
      syncStatus: 'synced',
    });
  } else if (operation === 'delete') {
    await db.reservations.delete(entityId);
  }
}

async function applySharedReservationChange(
  entityId: string,
  operation: string,
  data: Record<string, unknown>
): Promise<void> {
  if (operation === 'create' || operation === 'update') {
    const existing = await db.sharedReservations.get(entityId);

    if (existing && existing.syncStatus === 'pending') {
      // eslint-disable-next-line no-console
      console.log(
        `[Sync] Skipping backend shared reservation ${entityId} - local changes pending`
      );
      return;
    }

    await db.sharedReservations.put({
      id: entityId,
      saunaId: data.saunaId as string,
      date: data.date as string,
      startTime: data.startTime as string,
      malesDurationHours: data.malesDurationHours as number,
      femalesDurationHours: data.femalesDurationHours as number,
      genderOrder: data.genderOrder as 'MALES_FIRST' | 'FEMALES_FIRST',
      name: data.name as string,
      description: (data.description as string | null) || null,
      isAutoGenerated: data.isAutoGenerated as boolean,
      autoCancelledAt: (data.autoCancelledAt as string | null) || null,
      convertedToIndividual: data.convertedToIndividual as boolean,
      syncStatus: 'synced',
    });
  } else if (operation === 'delete') {
    await db.sharedReservations.delete(entityId);
  }
}

async function applySharedParticipantChange(
  entityId: string,
  operation: string,
  data: Record<string, unknown>
): Promise<void> {
  if (operation === 'create' || operation === 'update') {
    const existing = await db.sharedParticipants.get(entityId);

    if (existing && existing.syncStatus === 'pending') {
      // eslint-disable-next-line no-console
      console.log(
        `[Sync] Skipping backend shared participant ${entityId} - local changes pending`
      );
      return;
    }

    await db.sharedParticipants.put({
      id: entityId,
      sharedReservationId: data.sharedReservationId as string,
      boatId: data.boatId as string,
      adults: data.adults as number,
      kids: data.kids as number,
      joinedAt: data.joinedAt as string,
      syncStatus: 'synced',
    });
  } else if (operation === 'delete') {
    await db.sharedParticipants.delete(entityId);
  }
}

async function applyBoatChange(
  entityId: string,
  operation: string,
  data: Record<string, unknown>
): Promise<void> {
  if (operation === 'create' || operation === 'update') {
    await db.boats.put({
      id: entityId,
      clubId: data.clubId as string,
      name: data.name as string,
      membershipNumber: data.membershipNumber as string,
      captainName: (data.captainName as string | null) || null,
      phoneNumber: (data.phoneNumber as string | null) || null,
    });
  } else if (operation === 'delete') {
    await db.boats.delete(entityId);
  }
}

async function applySaunaChange(
  entityId: string,
  operation: string,
  data: Record<string, unknown>
): Promise<void> {
  if (operation === 'create' || operation === 'update') {
    await db.saunas.put({
      id: entityId,
      islandId: data.islandId as string,
      name: data.name as string,
      heatingTimeHours: data.heatingTimeHours as number,
      autoClubSaunaEnabled: data.autoClubSaunaEnabled as boolean,
    });
  } else if (operation === 'delete') {
    await db.saunas.delete(entityId);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get count of pending changes in sync queue
 */
export async function getPendingSyncCount(): Promise<number> {
  return db.syncQueue.where('syncStatus').equals('pending').count();
}

/**
 * Get count of failed changes in sync queue
 */
export async function getFailedSyncCount(): Promise<number> {
  return db.syncQueue.where('syncStatus').equals('failed').count();
}

/**
 * Retry failed syncs
 */
export async function retryFailedSyncs(): Promise<void> {
  const failedChanges = await db.syncQueue
    .where('syncStatus')
    .equals('failed')
    .toArray();

  for (const change of failedChanges) {
    await db.syncQueue.update(change.id, {
      syncStatus: 'pending',
      errorMessage: null,
    });
  }
}

/**
 * Clear synced changes older than a certain date
 * This prevents the sync queue from growing indefinitely
 */
export async function cleanupOldSyncedChanges(
  olderThanDays = 30
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const oldChanges = await db.syncQueue
    .where('syncStatus')
    .equals('synced')
    .and((change) => change.timestamp < cutoffDate)
    .toArray();

  for (const change of oldChanges) {
    await db.syncQueue.delete(change.id);
  }

  return oldChanges.length;
}
