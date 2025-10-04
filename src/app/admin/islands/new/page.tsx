'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

interface Club {
  id: string;
  name: string;
}

export default function NewIslandPage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    clubId: '',
    numberOfSaunas: 1,
  });

  useEffect(() => {
    fetchClubs();
  }, []);

  async function fetchClubs() {
    try {
      const response = await fetch('/api/clubs');
      if (!response.ok) throw new Error('Failed to fetch clubs');
      const result = await response.json();
      const data = result.data || result;
      setClubs(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, clubId: data[0].id }));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load clubs');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter an island name');
      return;
    }

    if (!formData.clubId) {
      alert('Please select a club');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/islands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create island');
      }

      router.push('/admin/islands');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create island');
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
        <h1 className="mb-6 text-2xl font-bold">Create New Island</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Island Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Suomenlinna Island"
              required
            />
          </div>

          <div>
            <Label htmlFor="clubId">Club *</Label>
            <select
              id="clubId"
              value={formData.clubId}
              onChange={(e) =>
                setFormData({ ...formData, clubId: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a club</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
            {clubs.length === 0 && (
              <p className="mt-2 text-sm text-amber-600">
                No clubs available. Please create a club first.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="numberOfSaunas">Number of Saunas *</Label>
            <select
              id="numberOfSaunas"
              value={formData.numberOfSaunas}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  numberOfSaunas: parseInt(e.target.value),
                })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="1">1 Sauna</option>
              <option value="2">2 Saunas</option>
              <option value="3">3 Saunas</option>
            </select>
            <p className="mt-2 text-sm text-gray-600">
              This sets the maximum number of saunas that can be configured for
              this island.
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
            <Button
              type="submit"
              disabled={loading || clubs.length === 0}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create Island'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
