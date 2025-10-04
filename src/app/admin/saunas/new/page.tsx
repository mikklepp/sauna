'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

interface Island {
  id: string;
  name: string;
  club: {
    name: string;
  };
}

export default function NewSaunaPage() {
  const router = useRouter();
  const [islands, setIslands] = useState<Island[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    islandId: '',
    heatingTimeHours: 2,
    autoClubSaunaEnabled: false,
  });

  useEffect(() => {
    fetchIslands();
  }, []);

  async function fetchIslands() {
    try {
      const response = await fetch('/api/islands');
      if (!response.ok) throw new Error('Failed to fetch islands');
      const result = await response.json();
      const data = result.data || result;
      setIslands(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, islandId: data[0].id }));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load islands');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a sauna name');
      return;
    }

    if (!formData.islandId) {
      alert('Please select an island');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/saunas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create sauna');
      }

      router.push('/admin/saunas');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create sauna');
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
        <h1 className="mb-6 text-2xl font-bold">Create New Sauna</h1>

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
            <Label htmlFor="islandId">Island *</Label>
            <select
              id="islandId"
              value={formData.islandId}
              onChange={(e) =>
                setFormData({ ...formData, islandId: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select an island</option>
              {islands.map((island) => (
                <option key={island.id} value={island.id}>
                  {island.name} ({island.club.name})
                </option>
              ))}
            </select>
            {islands.length === 0 && (
              <p className="mt-2 text-sm text-amber-600">
                No islands available. Please create an island first.
              </p>
            )}
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
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || islands.length === 0}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create Sauna'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
