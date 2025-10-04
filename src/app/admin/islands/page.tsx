'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';

interface Island {
  id: string;
  name: string;
  numberOfSaunas: number;
  club: {
    id: string;
    name: string;
  };
  _count: {
    saunas: number;
  };
}

export default function IslandsPage() {
  const router = useRouter();
  const [islands, setIslands] = useState<Island[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIslands();
  }, []);

  async function fetchIslands() {
    try {
      setLoading(true);
      const response = await fetch('/api/islands');
      if (!response.ok) throw new Error('Failed to fetch islands');
      const result = await response.json();
      const data = result.data || result;
      setIslands(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"? This will also delete all saunas on this island.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/islands/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete island');

      await fetchIslands();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete island');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading islands...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-600">Error: {error}</p>
          <Button onClick={() => fetchIslands()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Islands</h1>
          <p className="mt-2 text-gray-600">
            Manage islands and their sauna configurations
          </p>
        </div>
        <Button
          onClick={() => router.push('/admin/islands/new')}
          data-testid="create-island-button"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Island
        </Button>
      </div>

      {islands.length === 0 ? (
        <Card className="p-12 text-center">
          <MapPin className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            No islands yet
          </h3>
          <p className="mb-6 text-gray-600">
            Get started by creating your first island
          </p>
          <Button onClick={() => router.push('/admin/islands/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Island
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {islands.map((island) => (
            <Card key={island.id} className="p-6" data-testid="island-item">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-semibold">{island.name}</h3>
                  <p className="text-sm text-gray-600">{island.club.name}</p>
                </div>
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>

              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Configured saunas:</span>
                  <span className="font-medium">{island._count.saunas}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max saunas:</span>
                  <span className="font-medium">{island.numberOfSaunas}</span>
                </div>
              </div>

              <div className="flex gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    router.push(`/admin/islands/${island.id}/edit`)
                  }
                  data-testid="edit-island-button"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(island.id, island.name)}
                  data-testid="delete-island-button"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
