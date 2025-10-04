'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Waves, ChevronRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

interface IslandData {
  id: string;
  name: string;
  numberOfSaunas: number;
  saunas: Array<{
    id: string;
    name: string;
  }>;
}

export default function IslandsPage() {
  const router = useRouter();
  const [islands, setIslands] = useState<IslandData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIslands = useCallback(async () => {
    try {
      const response = await fetch('/api/islands');
      if (response.ok) {
        const data = await response.json();
        // Transform API response to match expected format
        const transformedIslands = (data.data || []).map(
          (island: IslandData & { _count?: { saunas: number } }) => ({
            ...island,
            numberOfSaunas: island._count?.saunas || island.saunas?.length || 0,
          })
        );
        setIslands(transformedIslands);
      } else {
        // Redirect to auth if session expired
        router.push('/auth');
      }
    } catch (error) {
      // Failed to fetch islands
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchIslands();
  }, [fetchIslands]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading islands...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-2">
            <Waves className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Select Island</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {islands.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <p className="mb-4 text-gray-500">No islands available</p>
              <Button variant="outline" onClick={() => router.push('/auth')}>
                Back to Login
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {islands.map((island) => (
              <Card
                key={island.id}
                className="cursor-pointer transition-shadow hover:shadow-lg"
                onClick={() => router.push(`/islands/${island.id}`)}
                data-testid="island-link"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2">
                        <MapPin className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{island.name}</CardTitle>
                        <CardDescription>
                          {island.numberOfSaunas}{' '}
                          {island.numberOfSaunas === 1 ? 'sauna' : 'saunas'}
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {island.saunas.map((sauna) => (
                      <div
                        key={sauna.id}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <Waves className="h-4 w-4" />
                        <span>{sauna.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
