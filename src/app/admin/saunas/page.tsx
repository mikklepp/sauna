'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Plus,
  Pencil,
  Trash2,
  Flame,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

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

export default function SaunasPage() {
  const router = useRouter();
  const [saunas, setSaunas] = useState<Sauna[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSaunas();
  }, []);

  async function fetchSaunas() {
    try {
      setLoading(true);
      const response = await fetch('/api/saunas');
      if (!response.ok) throw new Error('Failed to fetch saunas');
      const result = await response.json();
      const data = result.data || result;
      setSaunas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"? This will also delete all reservations for this sauna.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/saunas/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete sauna');

      await fetchSaunas();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete sauna');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading saunas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-600">Error: {error}</p>
          <Button onClick={() => fetchSaunas()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Saunas</h1>
          <p className="mt-2 text-gray-600">
            Manage saunas and their configurations
          </p>
        </div>
        <Button
          onClick={() => router.push('/admin/saunas/new')}
          data-testid="create-sauna-button"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Sauna
        </Button>
      </div>

      {saunas.length === 0 ? (
        <Card className="p-12 text-center">
          <Flame className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            No saunas yet
          </h3>
          <p className="mb-6 text-gray-600">
            Get started by creating your first sauna
          </p>
          <Button
            onClick={() => router.push('/admin/saunas/new')}
            data-testid="create-sauna-button"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Sauna
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {saunas.map((sauna) => (
            <Card key={sauna.id} className="p-6" data-testid="sauna-item">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-semibold">{sauna.name}</h3>
                  <p className="text-sm text-gray-600">{sauna.island.name}</p>
                  <p className="text-xs text-gray-500">
                    {sauna.island.club.name}
                  </p>
                </div>
                <Flame className="h-5 w-5 text-orange-600" />
              </div>

              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Heating time:</span>
                  <span className="font-medium">{sauna.heatingTimeHours}h</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Auto Club Sauna:</span>
                  {sauna.autoClubSaunaEnabled ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Enabled
                    </span>
                  ) : (
                    <span className="flex items-center text-gray-400">
                      <XCircle className="mr-1 h-4 w-4" />
                      Disabled
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/admin/saunas/${sauna.id}/edit`)}
                  data-testid="edit-sauna-button"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(sauna.id, sauna.name)}
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
