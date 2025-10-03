'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Waves, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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

  useEffect(() => {
    fetchIslands();
  }, []);

  async function fetchIslands() {
    try {
      const response = await fetch('/api/islands');
      if (response.ok) {
        const data = await response.json();
        setIslands(data.data || []);
      } else {
        // Redirect to auth if session expired
        router.push('/app/auth');
      }
    } catch (error) {
      console.error('Failed to fetch islands:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading islands...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-2">
            <Waves className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Select Island</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {islands.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No islands available</p>
              <Button variant="outline" onClick={() => router.push('/app/auth')}>
                Back to Login
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {islands.map((island) => (
              <Card
                key={island.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/app/islands/${island.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MapPin className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{island.name}</CardTitle>
                        <CardDescription>
                          {island.numberOfSaunas} {island.numberOfSaunas === 1 ? 'sauna' : 'saunas'}
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {island.saunas.map((sauna) => (
                      <div
                        key={sauna.id}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <Waves className="w-4 h-4" />
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