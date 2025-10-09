'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Waves } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClubHeader } from '@/components/club-header';

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

interface ClubData {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

export default function IslandsPage() {
  const router = useRouter();
  const [islands, setIslands] = useState<IslandData[]>([]);
  const [club, setClub] = useState<ClubData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/islands');
      if (response.ok) {
        const data = await response.json();
        // Transform API response to match expected format
        const transformedIslands = (data.data || []).map(
          (
            island: IslandData & {
              _count?: { saunas: number };
              club?: ClubData;
            }
          ) => ({
            ...island,
            numberOfSaunas: island._count?.saunas || island.saunas?.length || 0,
          })
        );
        setIslands(transformedIslands);

        // Extract club info from first island
        if (data.data && data.data.length > 0 && data.data[0].club) {
          setClub(data.data[0].club);
        }
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
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-club-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Loading islands...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Club Header */}
      {club && (
        <ClubHeader
          clubName={club.name}
          clubLogo={club.logoUrl}
          primaryColor={club.primaryColor || undefined}
          secondaryColor={club.secondaryColor || undefined}
        />
      )}

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            Choose Your Island
          </h1>
          <p className="text-lg text-gray-600">
            Select an island to view available saunas
          </p>
        </div>

        {islands.length === 0 ? (
          <Card className="mx-auto max-w-md animate-in">
            <CardContent className="py-12 text-center">
              <MapPin className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <p className="mb-4 text-gray-500">No islands available</p>
              <Button variant="outline" onClick={() => router.push('/auth')}>
                Back to Login
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {islands.map((island, index) => (
              <Card
                key={island.id}
                className="group cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                onClick={() => router.push(`/islands/${island.id}`)}
                data-testid="island-link"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Island Image Placeholder / Gradient */}
                <div className="bg-club-gradient relative h-40">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin className="h-16 w-16 text-white/30" />
                  </div>
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  {/* Island Name Overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                      {island.name}
                    </h3>
                  </div>
                </div>

                <CardHeader>
                  <CardDescription className="text-base">
                    {island.numberOfSaunas}{' '}
                    {island.numberOfSaunas === 1 ? 'Sauna' : 'Saunas'} Available
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2">
                    {island.saunas.slice(0, 3).map((sauna) => (
                      <div
                        key={sauna.id}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <Waves className="text-club-primary h-4 w-4" />
                        <span>{sauna.name}</span>
                      </div>
                    ))}
                    {island.saunas.length > 3 && (
                      <div className="text-sm text-gray-500">
                        +{island.saunas.length - 3} more
                      </div>
                    )}
                  </div>

                  <Button
                    className="bg-club-primary mt-4 w-full text-white hover:opacity-90"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/islands/${island.id}`);
                    }}
                  >
                    View Saunas
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
