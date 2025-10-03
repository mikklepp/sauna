'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthPage() {
  const router = useRouter();
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/validate-club-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        router.push('/app/islands');
      } else {
        setError(data.error || 'Invalid club secret');
      }
    } catch (err) {
      setError('Failed to validate secret');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Member Access</CardTitle>
          <CardDescription>
            Scan your club QR code or enter your club secret
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Scanner Option */}
          <div className="text-center">
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => {
                // In real implementation, this would open camera for QR scanning
                alert('QR scanner would open here');
              }}
            >
              <QrCode className="w-5 h-5 mr-2" />
              Scan QR Code
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Use your device camera to scan club QR code
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                Or enter manually
              </span>
            </div>
          </div>

          {/* Manual Entry Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secret">Club Secret</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="secret"
                  type="text"
                  placeholder="Enter club secret"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value.toUpperCase())}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Validating...' : 'Access Islands'}
            </Button>
          </form>

          <p className="text-xs text-center text-gray-500">
            Don't have a club secret?{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Contact your club administrator
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}