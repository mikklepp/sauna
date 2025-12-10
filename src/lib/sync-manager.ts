/**
 * Sync Manager for Island Device
 *
 * Manages periodic synchronization and handles online/offline events.
 * This runs in the main thread and is initialized when the Island Device starts.
 */

import { syncNow, type SyncResult } from './sync-service';

// ============================================================================
// Types
// ============================================================================

export interface SyncManagerStatus {
  isRunning: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  lastSyncResult: SyncResult | null;
  nextSyncAt: Date | null;
  syncInterval: number; // in milliseconds
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_SYNC_INTERVAL_MS = 60 * 60 * 1000; // 60 minutes
const MIN_SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes minimum

// ============================================================================
// Sync Manager Class
// ============================================================================

class SyncManager {
  private isRunning = false;
  private isSyncing = false;
  private syncIntervalId: NodeJS.Timeout | null = null;
  private syncInterval = DEFAULT_SYNC_INTERVAL_MS;
  private lastSyncAt: Date | null = null;
  private lastSyncResult: SyncResult | null = null;
  private onlineListener: (() => void) | null = null;
  private offlineListener: (() => void) | null = null;

  /**
   * Start the sync manager
   * This sets up periodic sync and online/offline event listeners
   */
  start(syncIntervalMinutes = 60): void {
    if (this.isRunning) {
      // eslint-disable-next-line no-console
      console.log('[Sync Manager] Already running');
      return;
    }

    // eslint-disable-next-line no-console
    console.log(
      `[Sync Manager] Starting with ${syncIntervalMinutes} minute interval`
    );

    this.syncInterval = Math.max(
      syncIntervalMinutes * 60 * 1000,
      MIN_SYNC_INTERVAL_MS
    );
    this.isRunning = true;

    // Run initial sync immediately (if online)
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.performSync().catch(console.error);
    }

    // Set up periodic sync
    this.syncIntervalId = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        this.performSync().catch(console.error);
      }
    }, this.syncInterval);

    // Listen for online event to trigger immediate sync
    if (typeof window !== 'undefined') {
      this.onlineListener = () => {
        // eslint-disable-next-line no-console
        console.log('[Sync Manager] Device came online, triggering sync');
        this.performSync().catch(console.error);
      };

      this.offlineListener = () => {
        // eslint-disable-next-line no-console
        console.log('[Sync Manager] Device went offline');
      };

      window.addEventListener('online', this.onlineListener);
      window.addEventListener('offline', this.offlineListener);
    }

    // eslint-disable-next-line no-console
    console.log('[Sync Manager] Started successfully');
  }

  /**
   * Stop the sync manager
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    // eslint-disable-next-line no-console
    console.log('[Sync Manager] Stopping');

    // Clear interval
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }

    // Remove event listeners
    if (typeof window !== 'undefined' && this.onlineListener) {
      window.removeEventListener('online', this.onlineListener);
      this.onlineListener = null;
    }

    if (typeof window !== 'undefined' && this.offlineListener) {
      window.removeEventListener('offline', this.offlineListener);
      this.offlineListener = null;
    }

    this.isRunning = false;
    // eslint-disable-next-line no-console
    console.log('[Sync Manager] Stopped');
  }

  /**
   * Trigger a sync manually
   */
  async triggerSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('Device is offline');
    }

    return this.performSync();
  }

  /**
   * Get current status
   */
  getStatus(): SyncManagerStatus {
    const nextSyncAt = this.lastSyncAt
      ? new Date(this.lastSyncAt.getTime() + this.syncInterval)
      : null;

    return {
      isRunning: this.isRunning,
      isSyncing: this.isSyncing,
      lastSyncAt: this.lastSyncAt,
      lastSyncResult: this.lastSyncResult,
      nextSyncAt,
      syncInterval: this.syncInterval,
    };
  }

  /**
   * Update sync interval
   */
  setSyncInterval(minutes: number): void {
    const newInterval = Math.max(minutes * 60 * 1000, MIN_SYNC_INTERVAL_MS);

    if (newInterval === this.syncInterval) {
      return;
    }

    // eslint-disable-next-line no-console
    console.log(`[Sync Manager] Updating sync interval to ${minutes} minutes`);

    this.syncInterval = newInterval;

    // Restart interval if running
    if (this.isRunning && this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = setInterval(() => {
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          this.performSync().catch(console.error);
        }
      }, this.syncInterval);
    }
  }

  /**
   * Internal method to perform sync
   */
  private async performSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      // eslint-disable-next-line no-console
      console.log('[Sync Manager] Sync already in progress, skipping');
      return {
        success: false,
        pushedChanges: 0,
        pulledChanges: 0,
        failedChanges: 0,
        errors: ['Sync already in progress'],
        lastSyncAt: new Date(),
      };
    }

    // eslint-disable-next-line no-console
    console.log('[Sync Manager] Starting sync...');
    this.isSyncing = true;

    try {
      const result = await syncNow();
      this.lastSyncResult = result;
      this.lastSyncAt = new Date();

      if (result.success) {
        // eslint-disable-next-line no-console
        console.log(
          `[Sync Manager] Sync completed successfully. Pushed: ${result.pushedChanges}, Pulled: ${result.pulledChanges}`
        );
      } else {
        console.error('[Sync Manager] Sync failed:', result.errors);
      }

      return result;
    } catch (error) {
      console.error('[Sync Manager] Sync error:', error);
      const errorResult: SyncResult = {
        success: false,
        pushedChanges: 0,
        pulledChanges: 0,
        failedChanges: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        lastSyncAt: new Date(),
      };
      this.lastSyncResult = errorResult;
      return errorResult;
    } finally {
      this.isSyncing = false;
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const syncManager = new SyncManager();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Start automatic syncing
 * Call this when the Island Device is initialized
 */
export function startAutoSync(syncIntervalMinutes = 60): void {
  syncManager.start(syncIntervalMinutes);
}

/**
 * Stop automatic syncing
 * Call this when the Island Device is shut down or reset
 */
export function stopAutoSync(): void {
  syncManager.stop();
}

/**
 * Manually trigger a sync
 */
export async function manualSync(): Promise<SyncResult> {
  return syncManager.triggerSync();
}

/**
 * Get sync status
 */
export function getSyncStatus(): SyncManagerStatus {
  return syncManager.getStatus();
}

/**
 * Update sync interval (in minutes)
 */
export function setSyncInterval(minutes: number): void {
  syncManager.setSyncInterval(minutes);
}
