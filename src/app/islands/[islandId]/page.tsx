'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Waves, Clock, Users, Calendar } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClubHeader } from '@/components/club-header';
import { formatTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

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
  isClubSauna?: boolean;
  currentReservation?: CurrentReservation;
  nextAvailable: {
    startTime: string;
    endTime: string;
    reason: string;
  };
  sharedReservationsToday?: SharedReservationToday[];
}

interface ClubData {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

export default function IslandSaunasPage() {
  const router = useRouter();
  const params = useParams();
  const islandId = params.islandId as string;

  const [saunas, setSaunas] = useState<Sauna[]>([]);
  const [loading, setLoading] = useState(true);
  const [islandName, setIslandName] = useState('');
  const [club, setClub] = useState<ClubData | null>(null);

  const fetchSaunas = useCallback(async () => {
    try {
      // Get island details
      const islandRes = await fetch(`/api/islands/${islandId}`);
      if (islandRes.ok) {
        const islandData = await islandRes.json();
        setIslandName(islandData.data.name);

        // Extract club info
        if (islandData.data.club) {
          setClub(islandData.data.club);
        }
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-club-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Loading saunas...</p>
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
          title={islandName}
          showBack={true}
          backHref="/islands"
          primaryColor={club.primaryColor || undefined}
          secondaryColor={club.secondaryColor || undefined}
        />
      )}

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <p className="text-lg text-gray-600" data-testid="island-instruction">
            Select a sauna to make a reservation
          </p>
        </div>

        <div className="space-y-4">
          {saunas.map((sauna, index) => (
            <Card
              key={sauna.id}
              className="overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              data-testid="sauna-card"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Waves className="text-club-primary h-6 w-6" />
                      {sauna.name}
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-2">
                      {sauna.isClubSauna ? (
                        <span className="badge-club-sauna">Club Sauna</span>
                      ) : sauna.isCurrentlyReserved ? (
                        <span className="badge-reserved">Reserved</span>
                      ) : (
                        <span className="badge-available">Available</span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Next Available Slot */}
                <div className="border-club-primary/20 from-club-primary/5 to-club-primary/10 rounded-xl border-2 bg-gradient-to-br p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="text-club-primary h-5 w-5" />
                      <span className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                        Next Available
                      </span>
                    </div>
                    <span className="text-club-primary text-2xl font-bold">
                      {formatTime(sauna.nextAvailable.startTime)}
                    </span>
                  </div>
                  {sauna.nextAvailable.reason === 'heating' && (
                    <p className="mb-3 text-sm text-gray-600">
                      Includes {sauna.heatingTimeHours}h heating time
                    </p>
                  )}
                  <Button
                    className="bg-club-primary w-full text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg"
                    size="lg"
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
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
                        <Users className="text-club-secondary h-5 w-5" />
                        Club Sauna Today
                      </h4>
                      {sauna.sharedReservationsToday.map((shared) => (
                        <div
                          key={shared.id}
                          className="border-club-secondary/30 from-club-secondary/10 to-club-secondary/5 rounded-xl border-2 bg-gradient-to-br p-4"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {shared.name || 'Club Sauna'}
                              </p>
                              <p className="text-sm text-gray-600">
                                Starting at {formatTime(shared.startTime)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-club-secondary text-sm font-medium">
                                {shared.participants.length}{' '}
                                {shared.participants.length === 1
                                  ? 'boat'
                                  : 'boats'}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className="border-club-secondary/50 text-club-secondary hover:bg-club-secondary/10 w-full"
                            onClick={() =>
                              router.push(
                                `/islands/${islandId}/shared/${shared.id}`
                              )
                            }
                          >
                            Join Club Sauna
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                {/* View Reservations Link */}
                <div className="border-t pt-4">
                  <Button
                    variant="ghost"
                    className="text-club-primary hover:bg-club-primary/10 w-full"
                    onClick={() =>
                      router.push(
                        `/islands/${islandId}/saunas/${sauna.id}/reservations`
                      )
                    }
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    View All Reservations
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
