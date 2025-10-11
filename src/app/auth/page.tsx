'use client';

import { useState, useEffect } from 'react';
import { QrCode, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const dynamic = 'force-dynamic';

// Use a ref to prevent double execution in React Strict Mode
let validationInProgress = false;

export default function AuthPage() {
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-authenticate if secret is provided in URL (QR code flow)
  useEffect(() => {
    // Use window.location to get URL params directly (simpler than useSearchParams)
    if (typeof window !== 'undefined' && !validationInProgress) {
      const urlParams = new URLSearchParams(window.location.search);
      const secretParam = urlParams.get('secret');

      if (secretParam && !validationInProgress) {
        validationInProgress = true;
        setSecret(secretParam);
        // Auto-submit the form
        validateSecret(secretParam);
      }
    }
  }, []);

  async function validateSecret(secretToValidate: string) {
    if (!secretToValidate || secretToValidate.trim().length === 0) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/validate-club-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: secretToValidate }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Use window.location for full page reload to ensure cookies are sent
        window.location.href = '/islands';
      } else {
        validationInProgress = false;
        setError(data.error || 'Invalid club secret');
      }
    } catch (err) {
      validationInProgress = false;
      setError('Failed to validate secret');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    validateSecret(secret);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
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
              <QrCode className="mr-2 h-5 w-5" />
              Scan QR Code
            </Button>
            <p className="mt-2 text-sm text-gray-500">
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
                <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
              <div className="rounded-md border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Validating...' : 'Access Islands'}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-500">
            Don&apos;t have a club secret?{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Contact your club administrator
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
