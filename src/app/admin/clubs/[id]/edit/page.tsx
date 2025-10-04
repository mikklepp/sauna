'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

interface Club {
  id: string;
  name: string;
  timezone: string;
  secretValidFrom: string;
  secretValidUntil: string;
}

export default function EditClubPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [club, setClub] = useState<Club | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    timezone: 'Europe/Helsinki',
  });

  const fetchClub = useCallback(async () => {
    try {
      const response = await fetch(`/api/clubs/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch club');
      const data = await response.json();
      setClub(data);
      setFormData({
        name: data.name,
        timezone: data.timezone,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load club');
      router.push('/admin/clubs');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchClub();
  }, [fetchClub]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a club name');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/clubs/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update club');
      }

      router.push('/admin/clubs');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update club');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!club) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="p-6">
        <h1 className="mb-6 text-2xl font-bold">Edit Club</h1>

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

          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold">Secret Information</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <strong>Valid From:</strong>{' '}
                {new Date(club.secretValidFrom).toLocaleString()}
              </p>
              <p>
                <strong>Valid Until:</strong>{' '}
                {new Date(club.secretValidUntil).toLocaleString()}
              </p>
              <p className="mt-2 text-xs">
                Secret codes cannot be changed directly. They are rotated
                automatically.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
