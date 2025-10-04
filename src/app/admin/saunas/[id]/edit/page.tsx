'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

interface Sauna {
  id: string;
  name: string;
  heatingTimeHours: number;
  autoClubSaunaEnabled: boolean;
  island: {
    id: string;
    name: string;
    club: {
      name: string;
    };
  };
}

export default function EditSaunaPage() {
  const router = useRouter();
  const params = useParams();
  const saunaId = params.id as string;

  const [sauna, setSauna] = useState<Sauna | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    heatingTimeHours: 2,
    autoClubSaunaEnabled: false,
  });

  const fetchSauna = useCallback(async () => {
    try {
      const response = await fetch(`/api/saunas/${saunaId}`);
      if (!response.ok) throw new Error('Failed to fetch sauna');
      const result = await response.json();
      const data = result.data || result;
      setSauna(data);
      setFormData({
        name: data.name,
        heatingTimeHours: data.heatingTimeHours,
        autoClubSaunaEnabled: data.autoClubSaunaEnabled,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load sauna');
      router.push('/admin/saunas');
    } finally {
      setLoading(false);
    }
  }, [saunaId, router]);

  useEffect(() => {
    fetchSauna();
  }, [fetchSauna]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a sauna name');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/saunas/${saunaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update sauna');
      }

      router.push('/admin/saunas');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update sauna');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading sauna...</p>
      </div>
    );
  }

  if (!sauna) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="p-6">
        <h1 className="mb-2 text-2xl font-bold">Edit Sauna</h1>
        <p className="mb-1 text-gray-600">
          Island: {sauna?.island?.name || 'Loading...'}
        </p>
        <p className="mb-6 text-sm text-gray-500">
          Club: {sauna?.island?.club?.name || 'Loading...'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Sauna Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Main Sauna"
              required
            />
          </div>

          <div>
            <Label htmlFor="heatingTimeHours">Heating Time (hours) *</Label>
            <select
              id="heatingTimeHours"
              value={formData.heatingTimeHours}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  heatingTimeHours: parseInt(e.target.value),
                })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="3">3 hours</option>
              <option value="4">4 hours</option>
            </select>
            <p className="mt-2 text-sm text-gray-600">
              Time needed to heat the sauna before use.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="autoClubSaunaEnabled"
              checked={formData.autoClubSaunaEnabled}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  autoClubSaunaEnabled: e.target.checked,
                })
              }
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="autoClubSaunaEnabled" className="cursor-pointer">
                Enable Auto Club Sauna
              </Label>
              <p className="mt-1 text-sm text-gray-600">
                Automatically create shared &ldquo;Club Sauna&rdquo;
                reservations during peak season (Jun-Aug daily, May/Sep Fri-Sat)
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
