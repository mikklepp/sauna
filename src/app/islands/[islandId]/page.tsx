'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Waves, Clock, Users, Calendar, ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils';

interface Sauna {
  id: string;
  name: string;
  heatingTimeHours: number;
  isCurrentlyReserved: boolean;
  currentReservation?: any;
  nextAvailable: {
    startTime: string;
    endTime: string;
    reason: string;
  };
  sharedReservationsToday?: Array<{
    id: string;
    name: string;
    startTime: string;
    participants: any[];
  }>;
}

export default function IslandSaunasPage() {
  const router = useRouter();
  const params = useParams();
  const islandId = params.islandId as string;
  
  const [saunas, setSaunas] = useState<Sauna[]>([]);
  const [loading, setLoading] = useState(true);
  const [islandName, setIslandName] = useState('');

  useEffect(() => {
    fetchSaunas();
  }, [islandId]);

  async function fetchSaunas() {
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
          (saunasData.data || []).map(async (sauna: any) => {
            const availRes = await fetch(`/api/saunas/${sauna.id}/next-available`);
            if (availRes.ok) {
              const availData = await availRes.json();
              return { ...sauna, ...availData.data };
            }
            return sauna;
          })
        );
        
        setSaunas(saunasWithAvailability);
      }
    } catch (error) {
      console.error('Failed to fetch saunas:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading saunas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/app/islands')}
            className="mb-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
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
            <Card key={sauna.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Waves className="w-5 h-5 text-blue-600" />
                      {sauna.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {sauna.isCurrentlyReserved ? (
                        <span className="text-red-600 font-medium">Currently in use</span>
                      ) : (
                        <span className="text-green-600 font-medium">Available</span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Next Available Slot */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Next Available</span>
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
                    className="w-full mt-3"
                    onClick={() => router.push(`/app/islands/${islandId}/reserve?saunaId=${sauna.id}`)}
                  >
                    Reserve This Time
                  </Button>
                </div>

                {/* Shared Reservations */}
                {sauna.sharedReservationsToday && sauna.sharedReservationsToday.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Shared Sauna Today
                    </h4>
                    {sauna.sharedReservationsToday.map((shared) => (
                      <div
                        key={shared.id}
                        className="bg-purple-50 border border-purple-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
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
                              {shared.participants.length} {shared.participants.length === 1 ? 'boat' : 'boats'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full mt-2"
                          onClick={() => router.push(`/app/islands/${islandId}/shared/${shared.id}`)}
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
                  onClick={() => router.push(`/app/islands/${islandId}/saunas/${sauna.id}/reservations`)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
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