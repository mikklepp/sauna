'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ArrowLeft,
  RefreshCw,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Cog,
} from 'lucide-react';
import {
  getDeviceConfig,
  clearDeviceData,
  updateLastSync,
  exportDatabase,
} from '@/db/schema';
import {
  getWorkerStatus,
  runWorkerNow,
  terminateWorkers,
} from '@/lib/worker-manager';

interface DeviceConfig {
  isConfigured: boolean;
  deviceId?: string;
  assignedIslandId?: string;
  lastSyncAt?: string;
}

interface WorkerResult {
  created?: number;
  skipped?: number;
  evaluated?: number;
  cancelled?: number;
  converted?: number;
}

interface WorkerInfo {
  isRunning: boolean;
  lastRun?: Date;
  lastResult?: WorkerResult;
  error?: string;
}

type WorkerStatus = Record<
  'club-sauna-generator' | 'club-sauna-evaluator',
  WorkerInfo
>;

export default function IslandDeviceSettingsPage() {
  const router = useRouter();
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>(
    'idle'
  );
  const [syncMessage, setSyncMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null);
  const [runningWorker, setRunningWorker] = useState<string | null>(null);

  useEffect(() => {
    loadDeviceConfig();
    loadWorkerStatus();

    // Refresh worker status every 10 seconds
    const interval = setInterval(loadWorkerStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadDeviceConfig() {
    try {
      const config = await getDeviceConfig();
      setDeviceConfig(config);
    } catch (err) {
      console.error('Failed to load device config:', err);
    } finally {
      setLoading(false);
    }
  }

  function loadWorkerStatus() {
    try {
      const status = getWorkerStatus();
      setWorkerStatus(status);
    } catch (err) {
      console.error('Failed to load worker status:', err);
    }
  }

  async function handleRunWorker(
    type: 'club-sauna-generator' | 'club-sauna-evaluator'
  ) {
    setRunningWorker(type);
    try {
      const result = await runWorkerNow(type);
      alert(
        `${type} completed successfully:\n${JSON.stringify(result, null, 2)}`
      );
      loadWorkerStatus();
    } catch (err) {
      alert(
        `${type} failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setRunningWorker(null);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncStatus('idle');
    setSyncMessage('');

    try {
      // Check if online
      if (!navigator.onLine) {
        throw new Error(
          'Device is offline. Sync requires internet connection.'
        );
      }

      // Sync with backend
      const response = await fetch('/api/sync/device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: deviceConfig?.deviceId,
          islandId: deviceConfig?.assignedIslandId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }

      const result = await response.json();

      // Update last sync time
      await updateLastSync();
      await loadDeviceConfig();

      setSyncStatus('success');
      setSyncMessage(`Successfully synced ${result.synced || 0} changes`);
    } catch (err) {
      setSyncStatus('error');
      setSyncMessage(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  async function handleFactoryReset() {
    if (
      !confirm(
        'Are you sure you want to factory reset this device? All local data will be deleted and the device will need to be reconfigured.'
      )
    ) {
      return;
    }

    if (!confirm('This action cannot be undone. Are you absolutely sure?')) {
      return;
    }

    try {
      // Terminate all workers first
      terminateWorkers();

      await clearDeviceData();
      localStorage.removeItem('island_device_configured');
      localStorage.removeItem('assigned_island_id');

      alert('Device has been reset successfully');
      router.push('/island-device');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reset device');
    }
  }

  async function handleExportData() {
    try {
      const data = await exportDatabase();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `island-device-backup-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert('Database exported successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export database');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <h1 className="mb-8 text-3xl font-bold">Device Settings</h1>

      {/* Device Info */}
      <Card className="mb-6 p-6">
        <h2 className="mb-4 text-xl font-bold">Device Information</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Status:</span>
            {deviceConfig?.isConfigured ? (
              <span className="flex items-center font-medium text-green-600">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Configured
              </span>
            ) : (
              <span className="flex items-center font-medium text-amber-600">
                <AlertTriangle className="mr-1 h-4 w-4" />
                Not Configured
              </span>
            )}
          </div>

          {deviceConfig?.deviceId && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Device ID:</span>
              <span className="font-mono text-sm">
                {deviceConfig.deviceId.substring(0, 12)}...
              </span>
            </div>
          )}

          {deviceConfig?.assignedIslandId && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Assigned Island:</span>
              <span className="font-mono text-sm">
                {deviceConfig.assignedIslandId.substring(0, 12)}...
              </span>
            </div>
          )}

          {deviceConfig?.lastSyncAt && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last Sync:</span>
              <span className="text-sm">
                {new Date(deviceConfig.lastSyncAt).toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-gray-600">Connection:</span>
            {navigator.onLine ? (
              <span className="flex items-center font-medium text-green-600">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Online
              </span>
            ) : (
              <span className="flex items-center font-medium text-amber-600">
                <XCircle className="mr-1 h-4 w-4" />
                Offline
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Sync Section */}
      <Card className="mb-6 p-6">
        <h2 className="mb-4 text-xl font-bold">Synchronization</h2>
        <p className="mb-4 text-gray-600">
          Sync local changes with the backend server. This requires an internet
          connection.
        </p>

        {syncStatus === 'success' && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Sync Successful</p>
              <p className="mt-1 text-sm text-green-700">{syncMessage}</p>
            </div>
          </div>
        )}

        {syncStatus === 'error' && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <div>
              <p className="font-medium text-red-900">Sync Failed</p>
              <p className="mt-1 text-sm text-red-700">{syncMessage}</p>
            </div>
          </div>
        )}

        <Button
          onClick={handleSync}
          disabled={syncing || !navigator.onLine || !deviceConfig?.isConfigured}
          className="w-full"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`}
          />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </Button>

        {!navigator.onLine && (
          <p className="mt-2 text-sm text-amber-600">
            Device is offline. Sync will resume automatically when online.
          </p>
        )}
      </Card>

      {/* Data Management */}
      <Card className="mb-6 p-6">
        <h2 className="mb-4 text-xl font-bold">Data Management</h2>

        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={handleExportData}
            disabled={!deviceConfig?.isConfigured}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Database Backup
          </Button>

          <p className="text-sm text-gray-600">
            Export all local data as JSON for backup or debugging purposes.
          </p>
        </div>
      </Card>

      {/* Scheduled Workers */}
      <Card className="mb-6 p-6">
        <h2 className="mb-4 text-xl font-bold">Scheduled Workers</h2>
        <p className="mb-4 text-gray-600">
          Background workers that run automatically on schedule to manage Club
          Sauna reservations.
        </p>

        {workerStatus ? (
          <div className="space-y-4">
            {/* Club Sauna Generator */}
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Cog className="h-4 w-4" />
                    Club Sauna Generator
                  </h3>
                  <p className="text-sm text-gray-600">
                    Runs daily at midnight (00:00)
                  </p>
                </div>
                {workerStatus['club-sauna-generator']?.isRunning && (
                  <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                    Running
                  </span>
                )}
              </div>

              {workerStatus['club-sauna-generator']?.lastRun && (
                <div className="mb-2 text-sm text-gray-600">
                  <span className="font-medium">Last run:</span>{' '}
                  {new Date(
                    workerStatus['club-sauna-generator'].lastRun
                  ).toLocaleString()}
                </div>
              )}

              {workerStatus['club-sauna-generator']?.lastResult && (
                <div className="mb-3 text-sm text-gray-600">
                  <span className="font-medium">Last result:</span>{' '}
                  {workerStatus['club-sauna-generator'].lastResult.created}{' '}
                  created,{' '}
                  {workerStatus['club-sauna-generator'].lastResult.skipped}{' '}
                  skipped
                </div>
              )}

              {workerStatus['club-sauna-generator']?.error && (
                <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                  Error: {workerStatus['club-sauna-generator'].error}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRunWorker('club-sauna-generator')}
                disabled={runningWorker === 'club-sauna-generator'}
                className="w-full"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${runningWorker === 'club-sauna-generator' ? 'animate-spin' : ''}`}
                />
                {runningWorker === 'club-sauna-generator'
                  ? 'Running...'
                  : 'Run Now (Test)'}
              </Button>
            </div>

            {/* Club Sauna Evaluator */}
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Cog className="h-4 w-4" />
                    Club Sauna Evaluator
                  </h3>
                  <p className="text-sm text-gray-600">
                    Runs daily at 20:00 (8 PM)
                  </p>
                </div>
                {workerStatus['club-sauna-evaluator']?.isRunning && (
                  <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                    Running
                  </span>
                )}
              </div>

              {workerStatus['club-sauna-evaluator']?.lastRun && (
                <div className="mb-2 text-sm text-gray-600">
                  <span className="font-medium">Last run:</span>{' '}
                  {new Date(
                    workerStatus['club-sauna-evaluator'].lastRun
                  ).toLocaleString()}
                </div>
              )}

              {workerStatus['club-sauna-evaluator']?.lastResult && (
                <div className="mb-3 text-sm text-gray-600">
                  <span className="font-medium">Last result:</span>{' '}
                  {workerStatus['club-sauna-evaluator'].lastResult.evaluated}{' '}
                  evaluated,{' '}
                  {workerStatus['club-sauna-evaluator'].lastResult.cancelled}{' '}
                  cancelled,{' '}
                  {workerStatus['club-sauna-evaluator'].lastResult.converted}{' '}
                  converted
                </div>
              )}

              {workerStatus['club-sauna-evaluator']?.error && (
                <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                  Error: {workerStatus['club-sauna-evaluator'].error}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRunWorker('club-sauna-evaluator')}
                disabled={runningWorker === 'club-sauna-evaluator'}
                className="w-full"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${runningWorker === 'club-sauna-evaluator' ? 'animate-spin' : ''}`}
                />
                {runningWorker === 'club-sauna-evaluator'
                  ? 'Running...'
                  : 'Run Now (Test)'}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Workers not initialized</p>
        )}
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50 p-6">
        <h2 className="mb-4 text-xl font-bold text-red-900">Danger Zone</h2>
        <p className="mb-4 text-gray-700">
          Factory reset will delete all local data and reset the device to its
          initial state. The device will need to be reconfigured before use.
        </p>

        <Button
          variant="outline"
          onClick={handleFactoryReset}
          disabled={!deviceConfig?.isConfigured}
          className="w-full border-red-300 text-red-700 hover:bg-red-100"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Factory Reset Device
        </Button>
      </Card>

      {/* Help */}
      <Card className="mt-6 bg-gray-50 p-6">
        <h3 className="mb-3 font-semibold">Troubleshooting</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Sync not working?</strong> Ensure the device has internet
            connection and is properly configured.
          </p>
          <p>
            <strong>Data conflicts?</strong> Island Device data always wins.
            Backend changes are overwritten by local changes.
          </p>
          <p>
            <strong>Need to reassign island?</strong> Perform a factory reset
            and reconfigure with a new token.
          </p>
        </div>
      </Card>
    </div>
  );
}
