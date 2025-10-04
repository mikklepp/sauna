'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Ship, Upload, Search } from 'lucide-react';

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

export default function BoatsPage() {
  const router = useRouter();
  const [boats, setBoats] = useState<Boat[]>([]);
  const [filteredBoats, setFilteredBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBoats();
  }, []);

  useEffect(() => {
    // Filter boats based on search query
    if (!searchQuery.trim()) {
      setFilteredBoats(boats);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredBoats(
        boats.filter(
          (boat) =>
            boat.name.toLowerCase().includes(query) ||
            boat.membershipNumber.toLowerCase().includes(query) ||
            boat.captainName?.toLowerCase().includes(query) ||
            boat.club.name.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, boats]);

  async function fetchBoats() {
    try {
      setLoading(true);
      const response = await fetch('/api/boats');
      if (!response.ok) throw new Error('Failed to fetch boats');
      const result = await response.json();
      const data = result.data || result;
      setBoats(data);
      setFilteredBoats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/boats/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete boat');

      await fetchBoats();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete boat');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading boats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-600">Error: {error}</p>
          <Button onClick={() => fetchBoats()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Boats</h1>
          <p className="mt-2 text-gray-600">
            Manage club boats and membership information
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/boats/import')}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button
            onClick={() => router.push('/admin/boats/new')}
            data-testid="create-boat-button"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Boat
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            type="text"
            placeholder="Search boats by name, membership#, captain, or club..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Showing {filteredBoats.length} of {boats.length} boats
        </p>
      </div>

      {boats.length === 0 ? (
        <Card className="p-12 text-center">
          <Ship className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            No boats yet
          </h3>
          <p className="mb-6 text-gray-600">
            Get started by adding boats manually or importing from CSV
          </p>
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/boats/import')}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button
              onClick={() => router.push('/admin/boats/new')}
              data-testid="create-boat-button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Boat
            </Button>
          </div>
        </Card>
      ) : filteredBoats.length === 0 ? (
        <Card className="p-12 text-center">
          <Search className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            No results found
          </h3>
          <p className="mb-6 text-gray-600">Try adjusting your search query</p>
          <Button onClick={() => setSearchQuery('')}>Clear Search</Button>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Boat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Membership #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Captain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Club
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredBoats.map((boat) => (
                <tr
                  key={boat.id}
                  className="hover:bg-gray-50"
                  data-testid="boat-item"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <Ship className="mr-2 h-5 w-5 text-blue-600" />
                      <span className="font-medium text-gray-900">
                        {boat.name}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {boat.membershipNumber}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {boat.captainName || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {boat.phoneNumber || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {boat.club.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/boats/${boat.id}/edit`)
                        }
                        data-testid="edit-boat-button"
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(boat.id, boat.name)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
