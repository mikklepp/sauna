'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

interface Boat {
  id: string;
  name: string;
  membershipNumber: string;
  captainName: string | null;
  phoneNumber: string | null;
  club: {
    id: string;
    name: string;
  };
}

export default function EditBoatPage() {
  const router = useRouter();
  const params = useParams();
  const boatId = params.id as string;

  const [boat, setBoat] = useState<Boat | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    membershipNumber: '',
    captainName: '',
    phoneNumber: '',
  });

  const fetchBoat = useCallback(async () => {
    try {
      const response = await fetch(`/api/boats/${boatId}`);
      if (!response.ok) throw new Error('Failed to fetch boat');
      const result = await response.json();
      const data = result.data || result;
      setBoat(data);
      setFormData({
        name: data.name,
        membershipNumber: data.membershipNumber,
        captainName: data.captainName || '',
        phoneNumber: data.phoneNumber || '',
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load boat');
      router.push('/admin/boats');
    } finally {
      setLoading(false);
    }
  }, [boatId, router]);

  useEffect(() => {
    fetchBoat();
  }, [fetchBoat]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a boat name');
      return;
    }

    if (!formData.membershipNumber.trim()) {
      alert('Please enter a membership number');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...formData,
        captainName: formData.captainName.trim() || null,
        phoneNumber: formData.phoneNumber.trim() || null,
      };

      const response = await fetch(`/api/boats/${boatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update boat');
      }

      router.push('/admin/boats');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update boat');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading boat...</p>
      </div>
    );
  }

  if (!boat) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="p-6">
        <h1 className="mb-2 text-2xl font-bold">Edit Boat</h1>
        <p className="mb-6 text-gray-600">
          Club: {boat?.club?.name || 'Loading...'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Boat Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Sea Spirit"
              required
            />
          </div>

          <div>
            <Label htmlFor="membershipNumber">Membership Number *</Label>
            <Input
              id="membershipNumber"
              value={formData.membershipNumber}
              onChange={(e) =>
                setFormData({ ...formData, membershipNumber: e.target.value })
              }
              placeholder="e.g., HSC-001"
              required
            />
            <p className="mt-2 text-sm text-gray-600">
              Must be unique within the club.
            </p>
          </div>

          <div>
            <Label htmlFor="captainName">Captain Name (Optional)</Label>
            <Input
              id="captainName"
              value={formData.captainName}
              onChange={(e) =>
                setFormData({ ...formData, captainName: e.target.value })
              }
              placeholder="e.g., John Smith"
            />
          </div>

          <div>
            <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              placeholder="e.g., +358 40 123 4567"
            />
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
