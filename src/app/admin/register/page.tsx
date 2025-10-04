'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, User, Mail, UserCircle } from 'lucide-react';

export default function AdminRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    email: '',
  });
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          name: formData.name || undefined,
          email: formData.email || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        router.push('/admin');
      } else {
        setError(data.error || 'Failed to create admin account');
      }
    } catch (err) {
      setError('Failed to create admin account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Create Admin Account</h1>
          <p className="mt-2 text-gray-600">Set up the first administrator</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Username *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="pl-10"
                placeholder="admin"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">At least 3 characters</p>
          </div>

          <div>
            <Label htmlFor="name">Full Name (Optional)</Label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="pl-10"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email (Optional)</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="pl-10"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="pl-10"
                placeholder="••••••••"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">At least 8 characters</p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="pl-10"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> This is the first admin account. Additional
              admins can be created later from the admin portal.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Admin Account'}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => router.push('/admin/login')}
              className="text-sm"
            >
              Already have an account? Sign in
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
