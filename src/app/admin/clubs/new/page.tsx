'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

export default function NewClubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    timezone: 'Europe/Helsinki',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a club name');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create club');
      }

      router.push('/admin/clubs');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create club');
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="p-6">
        <h1 className="mb-6 text-2xl font-bold">Create New Club</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Club Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Helsinki Sailing Club"
              required
            />
          </div>

          <div>
            <Label htmlFor="timezone">Timezone *</Label>
            <select
              id="timezone"
              value={formData.timezone}
              onChange={(e) =>
                setFormData({ ...formData, timezone: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="Europe/Helsinki">Europe/Helsinki</option>
              <option value="Europe/Stockholm">Europe/Stockholm</option>
              <option value="Europe/Oslo">Europe/Oslo</option>
              <option value="Europe/Copenhagen">Europe/Copenhagen</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> After creating the club, a secret code will
              be generated automatically. This secret will be used for Island
              Device authentication.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Club'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
