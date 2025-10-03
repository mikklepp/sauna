'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Download, CheckCircle2, AlertCircle, Settings } from 'lucide-react'
import { initializeDevice } from '@/db/schema'
import { initializeWorkers } from '@/lib/worker-manager'

export default function IslandDeviceSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<'token' | 'downloading' | 'installing' | 'complete'>('token')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deviceConfig, setDeviceConfig] = useState<any>(null)

  async function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!token.trim()) {
      setError('Please enter a device token')
      return
    }

    setLoading(true)
    setError(null)
    setStep('downloading')

    try {
      // Fetch device configuration from backend
      const response = await fetch(`/api/island-device/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Invalid device token')
      }

      const config = await response.json()
      setDeviceConfig(config)

      // Install configuration to IndexedDB
      setStep('installing')
      await new Promise(resolve => setTimeout(resolve, 1000)) // Visual delay

      await initializeDevice({
        club: config.club,
        island: config.island,
        saunas: config.saunas,
        boats: config.boats,
        deviceId: config.deviceId,
      })

      // Mark as configured in localStorage
      localStorage.setItem('island_device_configured', 'true')
      localStorage.setItem('assigned_island_id', config.island.id)

      // Initialize Web Workers for scheduled jobs
      await initializeWorkers()
      console.log('[Island Device Setup] Workers initialized')

      setStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to configure device')
      setStep('token')
    } finally {
      setLoading(false)
    }
  }

  function handleComplete() {
    if (deviceConfig?.island?.id) {
      router.push(`/island-device/${deviceConfig.island.id}`)
    } else {
      router.push('/island-device')
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="mb-6"
        disabled={loading}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card className="p-8">
        <h1 className="text-2xl font-bold mb-2">Island Device Configuration</h1>
        <p className="text-gray-600 mb-8">
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
              <p className="text-sm text-gray-600 mt-2">
                Get this token from the admin portal by selecting an island and generating a device token.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-900">Configuration Failed</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
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
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6 animate-pulse">
              <Download className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Downloading Configuration</h3>
            <p className="text-gray-600">
              Fetching island data, saunas, and boat information...
            </p>
          </div>
        )}

        {/* Step 3: Installing */}
        {step === 'installing' && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6 animate-spin">
              <Settings className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Installing Locally</h3>
            <p className="text-gray-600">
              Setting up offline database and configuring device...
            </p>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && deviceConfig && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Configuration Complete!</h3>
            <p className="text-gray-600 mb-6">
              Device successfully configured for {deviceConfig.island.name}
            </p>

            <Card className="p-6 mb-6 text-left bg-gray-50">
              <h4 className="font-semibold mb-4">Configuration Summary</h4>
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
                  <p className="font-medium">{deviceConfig.saunas.length} configured</p>
                </div>
                <div>
                  <span className="text-gray-600">Boats:</span>
                  <p className="font-medium">{deviceConfig.boats.length} in club</p>
                </div>
                <div className="pt-3 border-t">
                  <span className="text-green-600 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
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
                This device will now operate as the source of truth for all reservations
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Help Section */}
      <Card className="p-6 mt-6 bg-gray-50">
        <h3 className="font-semibold mb-3">Need Help?</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Where to get a token?</strong> Admin portal → Islands → Select Island → Generate Device Token
          </p>
          <p>
            <strong>Token not working?</strong> Ensure the token hasn&apos;t expired and belongs to the correct island
          </p>
          <p>
            <strong>Want to reconfigure?</strong> Go to Settings → Factory Reset Device
          </p>
        </div>
      </Card>
    </div>
  )
}
