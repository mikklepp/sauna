'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  getSyncStatus,
  manualSync,
  type SyncManagerStatus,
} from '@/lib/sync-manager';
import { getPendingSyncCount, getFailedSyncCount } from '@/lib/sync-service';
import { formatDistanceToNow } from 'date-fns';

interface SyncStatusProps {
  compact?: boolean;
}

export function SyncStatus({ compact = false }: SyncStatusProps) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [syncStatus, setSyncStatus] = useState<SyncManagerStatus | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const loadStatus = useCallback(async () => {
    const status = getSyncStatus();
    setSyncStatus(status);

    const pending = await getPendingSyncCount();
    setPendingCount(pending);

    const failed = await getFailedSyncCount();
    setFailedCount(failed);
  }, []);

  const handleManualSync = useCallback(async () => {
    if (!isOnline || syncing) return;

    setSyncing(true);
    try {
      await manualSync();
      await loadStatus();
    } catch (error) {
      console.error('[SyncStatus] Manual sync failed:', error);
    } finally {
      setSyncing(false);
    }
  }, [isOnline, syncing, loadStatus]);

  useEffect(() => {
    loadStatus();

    // Reload status every 10 seconds
    const interval = setInterval(loadStatus, 10000);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadStatus]);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Online/Offline Indicator */}
        <div className="flex items-center gap-2 text-sm">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-green-600" />
              <span className="text-green-600">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-amber-600" />
              <span className="text-amber-600">Offline</span>
            </>
          )}
        </div>

        {/* Pending Changes Badge */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            <Clock className="h-3 w-3" />
            {pendingCount} pending
          </div>
        )}

        {/* Failed Changes Badge */}
        {failedCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
            <AlertCircle className="h-3 w-3" />
            {failedCount} failed
          </div>
        )}

        {/* Sync Button */}
        {isOnline && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSync}
            disabled={syncing || (syncStatus?.isSyncing ?? false)}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                syncing || syncStatus?.isSyncing ? 'animate-spin' : ''
              }`}
            />
            Sync
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Sync Status</h3>
          {isOnline ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Wifi className="h-4 w-4" />
              Online
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <WifiOff className="h-4 w-4" />
              Offline
            </div>
          )}
        </div>

        {/* Offline Warning */}
        {!isOnline && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <WifiOff className="mt-0.5 h-4 w-4 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                Offline Mode Active
              </p>
              <p className="mt-1 text-xs text-amber-700">
                Changes will sync automatically when connection is restored.
              </p>
            </div>
          </div>
        )}

        {/* Status Details */}
        <div className="space-y-2 text-sm">
          {/* Last Sync */}
          {syncStatus?.lastSyncAt && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last sync:</span>
              <span className="font-medium">
                {formatDistanceToNow(syncStatus.lastSyncAt, {
                  addSuffix: true,
                })}
              </span>
            </div>
          )}

          {/* Next Sync */}
          {syncStatus?.nextSyncAt && isOnline && !syncStatus.isSyncing && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Next sync:</span>
              <span className="font-medium">
                {formatDistanceToNow(syncStatus.nextSyncAt, {
                  addSuffix: true,
                })}
              </span>
            </div>
          )}

          {/* Pending Changes */}
          {pendingCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pending changes:</span>
              <span className="flex items-center gap-1.5 font-medium text-blue-600">
                <Clock className="h-3.5 w-3.5" />
                {pendingCount}
              </span>
            </div>
          )}

          {/* Failed Changes */}
          {failedCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Failed changes:</span>
              <span className="flex items-center gap-1.5 font-medium text-red-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {failedCount}
              </span>
            </div>
          )}

          {/* All Synced */}
          {pendingCount === 0 &&
            failedCount === 0 &&
            syncStatus?.lastSyncAt && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>All changes synced</span>
              </div>
            )}
        </div>

        {/* Last Sync Result */}
        {syncStatus?.lastSyncResult && (
          <div className="space-y-1.5 rounded-lg border bg-gray-50 p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pushed:</span>
              <span className="font-medium">
                {syncStatus.lastSyncResult.pushedChanges}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pulled:</span>
              <span className="font-medium">
                {syncStatus.lastSyncResult.pulledChanges}
              </span>
            </div>
            {syncStatus.lastSyncResult.failedChanges > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Failed:</span>
                <span className="font-medium text-red-600">
                  {syncStatus.lastSyncResult.failedChanges}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Sync Button */}
        {isOnline && (
          <Button
            className="w-full"
            variant="outline"
            onClick={handleManualSync}
            disabled={syncing || (syncStatus?.isSyncing ?? false)}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                syncing || syncStatus?.isSyncing ? 'animate-spin' : ''
              }`}
            />
            {syncing || syncStatus?.isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        )}

        {/* Errors */}
        {syncStatus?.lastSyncResult?.errors &&
          syncStatus.lastSyncResult.errors.length > 0 && (
            <div className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-medium text-red-900">Sync Errors:</p>
              {syncStatus.lastSyncResult.errors.map((error, i) => (
                <p key={i} className="text-xs text-red-700">
                  • {error}
                </p>
              ))}
            </div>
          )}
      </div>
    </Card>
  );
}
