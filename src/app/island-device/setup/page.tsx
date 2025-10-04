'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { initializeDevice } from '@/db/schema';
import { initializeWorkers } from '@/lib/worker-manager';

interface DeviceConfigResponse {
  deviceId: string;
  club: {
    id: string;
    name: string;
    secret: string;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    timezone: string;
  };
  island: {
    id: string;
    name: string;
    clubId: string;
    numberOfSaunas: number;
  };
  saunas: Array<{
    id: string;
    name: string;
    islandId: string;
    heatingTimeHours: number;
    autoClubSaunaEnabled: boolean;
  }>;
  boats: Array<{
    id: string;
    name: string;
    clubId: string;
    membershipNumber: string;
    captainName: string | null;
    phoneNumber: string | null;
  }>;
}

export default function IslandDeviceSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<
    'token' | 'downloading' | 'installing' | 'complete'
  >('token');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfigResponse | null>(
    null
  );

  async function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!token.trim()) {
      setError('Please enter a device token');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('downloading');

    try {
      // Fetch device configuration from backend
      const response = await fetch(`/api/island-device/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Invalid device token');
      }

      const config = await response.json();
      setDeviceConfig(config);

      // Install configuration to IndexedDB
      setStep('installing');
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Visual delay

      await initializeDevice({
        club: config.club,
        island: config.island,
        saunas: config.saunas,
        boats: config.boats,
        deviceId: config.deviceId,
      });

      // Mark as configured in localStorage
      localStorage.setItem('island_device_configured', 'true');
      localStorage.setItem('assigned_island_id', config.island.id);

      // Initialize Web Workers for scheduled jobs
      await initializeWorkers();

      setStep('complete');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to configure device'
      );
      setStep('token');
    } finally {
      setLoading(false);
    }
  }

  function handleComplete() {
    if (deviceConfig?.island?.id) {
      router.push(`/island-device/${deviceConfig.island.id}`);
    } else {
      router.push('/island-device');
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="mb-6"
        disabled={loading}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="p-8">
        <h1 className="mb-2 text-2xl font-bold">Island Device Configuration</h1>
        <p className="mb-8 text-gray-600">
          Configure this device as a dedicated island reservation terminal
        </p>

        {/* Step 1: Enter Token */}
        {step === 'token' && (
          <form onSubmit={handleTokenSubmit} className="space-y-6">
            <div>
              <Label htmlFor="token">Device Configuration Token</Label>
              <Input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter token from admin portal"
                className="font-mono"
                required
                disabled={loading}
              />
              <p className="mt-2 text-sm text-gray-600">
                Get this token from the admin portal by selecting an island and
                generating a device token.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">
                    Configuration Failed
                  </p>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold text-blue-900">
                What happens next?
              </h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Configuration data will be downloaded from the server</li>
                <li>• Island, saunas, and boat data will be stored locally</li>
                <li>• Device will be locked to the assigned island</li>
                <li>• All reservation operations will work offline</li>
              </ul>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Configuring...' : 'Configure Device'}
            </Button>
          </form>
        )}

        {/* Step 2: Downloading */}
        {step === 'downloading' && (
          <div className="py-8 text-center">
            <div className="mb-6 inline-flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-blue-100">
              <Download className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              Downloading Configuration
            </h3>
            <p className="text-gray-600">
              Fetching island data, saunas, and boat information...
            </p>
          </div>
        )}

        {/* Step 3: Installing */}
        {step === 'installing' && (
          <div className="py-8 text-center">
            <div className="mb-6 inline-flex h-16 w-16 animate-spin items-center justify-center rounded-full bg-purple-100">
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Installing Locally</h3>
            <p className="text-gray-600">
              Setting up offline database and configuring device...
            </p>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && deviceConfig && (
          <div className="py-8 text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              Configuration Complete!
            </h3>
            <p className="mb-6 text-gray-600">
              Device successfully configured for {deviceConfig.island.name}
            </p>

            <Card className="mb-6 bg-gray-50 p-6 text-left">
              <h4 className="mb-4 font-semibold">Configuration Summary</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Club:</span>
                  <p className="font-medium">{deviceConfig.club.name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Island:</span>
                  <p className="font-medium">{deviceConfig.island.name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Saunas:</span>
                  <p className="font-medium">
                    {deviceConfig.saunas.length} configured
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Boats:</span>
                  <p className="font-medium">
                    {deviceConfig.boats.length} in club
                  </p>
                </div>
                <div className="border-t pt-3">
                  <span className="flex items-center gap-2 font-medium text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Offline mode ready
                  </span>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              <Button onClick={handleComplete} className="w-full">
                Open Island View
              </Button>
              <p className="text-sm text-gray-500">
                This device will now operate as the source of truth for all
                reservations
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Help Section */}
      <Card className="mt-6 bg-gray-50 p-6">
        <h3 className="mb-3 font-semibold">Need Help?</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Where to get a token?</strong> Admin portal → Islands →
            Select Island → Generate Device Token
          </p>
          <p>
            <strong>Token not working?</strong> Ensure the token hasn&apos;t
            expired and belongs to the correct island
          </p>
          <p>
            <strong>Want to reconfigure?</strong> Go to Settings → Factory Reset
            Device
          </p>
        </div>
      </Card>
    </div>
  );
}
