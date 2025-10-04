'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Waves, Clock, Users, Calendar, ChevronLeft } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils';

interface Participant {
  id: string;
  adults: number;
  kids: number;
  boat: {
    id: string;
    name: string;
  };
}

interface SharedReservationToday {
  id: string;
  name: string;
  startTime: string;
  participants: Participant[];
}

interface CurrentReservation {
  id: string;
  startTime: string;
  endTime: string;
  boat: {
    name: string;
  };
}

interface Sauna {
  id: string;
  name: string;
  heatingTimeHours: number;
  isCurrentlyReserved: boolean;
  currentReservation?: CurrentReservation;
  nextAvailable: {
    startTime: string;
    endTime: string;
    reason: string;
  };
  sharedReservationsToday?: SharedReservationToday[];
}

export default function IslandSaunasPage() {
  const router = useRouter();
  const params = useParams();
  const islandId = params.islandId as string;

  const [saunas, setSaunas] = useState<Sauna[]>([]);
  const [loading, setLoading] = useState(true);
  const [islandName, setIslandName] = useState('');

  const fetchSaunas = useCallback(async () => {
    try {
      // Get island details
      const islandRes = await fetch(`/api/islands/${islandId}`);
      if (islandRes.ok) {
        const islandData = await islandRes.json();
        setIslandName(islandData.data.name);
      }

      // Get saunas with availability
      const saunasRes = await fetch(`/api/saunas?islandId=${islandId}`);
      if (saunasRes.ok) {
        const saunasData = await saunasRes.json();

        // Fetch availability for each sauna
        const saunasWithAvailability = await Promise.all(
          (saunasData.data || []).map(
            async (sauna: {
              id: string;
              name: string;
              heatingTimeHours: number;
            }) => {
              const availRes = await fetch(
                `/api/saunas/${sauna.id}/next-available`
              );
              if (availRes.ok) {
                const availData = await availRes.json();
                return { ...sauna, ...availData.data };
              }
              return sauna;
            }
          )
        );

        setSaunas(saunasWithAvailability);
      }
    } catch (error) {
      // Failed to fetch saunas
    } finally {
      setLoading(false);
    }
  }, [islandId]);

  useEffect(() => {
    fetchSaunas();
  }, [fetchSaunas]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading saunas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/islands')}
            className="mb-2"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Islands
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{islandName}</h1>
          <p className="text-gray-500">Select a sauna to make a reservation</p>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-4">
          {saunas.map((sauna) => (
            <Card
              key={sauna.id}
              className="transition-shadow hover:shadow-lg"
              data-testid="sauna-card"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Waves className="h-5 w-5 text-blue-600" />
                      {sauna.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {sauna.isCurrentlyReserved ? (
                        <span className="font-medium text-red-600">
                          Currently in use
                        </span>
                      ) : (
                        <span className="font-medium text-green-600">
                          Available
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Next Available Slot */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        Next Available
                      </span>
                    </div>
                    <span className="text-lg font-bold text-blue-900">
                      {formatTime(sauna.nextAvailable.startTime)}
                    </span>
                  </div>
                  {sauna.nextAvailable.reason === 'heating' && (
                    <p className="text-xs text-blue-700">
                      Includes {sauna.heatingTimeHours}h heating time
                    </p>
                  )}
                  <Button
                    className="mt-3 w-full"
                    onClick={() =>
                      router.push(
                        `/islands/${islandId}/reserve?saunaId=${sauna.id}`
                      )
                    }
                    data-testid="reserve-button"
                  >
                    Reserve This Time
                  </Button>
                </div>

                {/* Shared Reservations */}
                {sauna.sharedReservationsToday &&
                  sauna.sharedReservationsToday.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="mb-3 flex items-center gap-2 font-medium text-gray-900">
                        <Users className="h-4 w-4" />
                        Shared Sauna Today
                      </h4>
                      {sauna.sharedReservationsToday.map((shared) => (
                        <div
                          key={shared.id}
                          className="rounded-lg border border-purple-200 bg-purple-50 p-4"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-purple-900">
                                {shared.name || 'Shared Sauna'}
                              </p>
                              <p className="text-sm text-purple-700">
                                Starting at {formatTime(shared.startTime)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-purple-700">
                                {shared.participants.length}{' '}
                                {shared.participants.length === 1
                                  ? 'boat'
                                  : 'boats'}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className="mt-2 w-full"
                            onClick={() =>
                              router.push(
                                `/islands/${islandId}/shared/${shared.id}`
                              )
                            }
                          >
                            Join Shared Sauna
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                {/* View Reservations Link */}
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() =>
                    router.push(
                      `/islands/${islandId}/saunas/${sauna.id}/reservations`
                    )
                  }
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  View All Reservations
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
