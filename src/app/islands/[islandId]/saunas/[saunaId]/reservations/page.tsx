'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Clock, Users, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatTimeRange } from '@/lib/utils';

interface Reservation {
  id: string;
  startTime: string;
  endTime: string;
  adults: number;
  kids: number;
  status: string;
  boat: {
    name: string;
    membershipNumber: string;
    captainName: string | null;
  };
}

export default function ReservationsListPage() {
  const router = useRouter();
  const params = useParams();
  const islandId = params.islandId as string;
  const saunaId = params.saunaId as string;

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saunaName, setSaunaName] = useState('');
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    reservation: Reservation | null;
  }>({
    open: false,
    reservation: null,
  });

  const fetchData = useCallback(async () => {
    try {
      // Get sauna info
      const saunaRes = await fetch(`/api/saunas/${saunaId}`);
      if (saunaRes.ok) {
        const saunaData = await saunaRes.json();
        setSaunaName(saunaData.data.name);
      }

      // Get reservations for today
      const today = new Date().toISOString().split('T')[0];
      const resRes = await fetch(
        `/api/reservations?saunaId=${saunaId}&date=${today}`
      );
      if (resRes.ok) {
        const resData = await resRes.json();
        setReservations(resData.data || []);
      }
    } catch (error) {
      // Failed to fetch data
    } finally {
      setLoading(false);
    }
  }, [saunaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCancelReservation() {
    if (!cancelDialog.reservation) return;

    try {
      const response = await fetch(
        `/api/reservations/${cancelDialog.reservation.id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setReservations(
          reservations.filter((r) => r.id !== cancelDialog.reservation!.id)
        );
        setCancelDialog({ open: false, reservation: null });
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to cancel reservation');
      }
    } catch (error) {
      alert('Failed to cancel reservation');
    }
  }

  function canCancel(reservation: Reservation): boolean {
    const startTime = new Date(reservation.startTime);
    const now = new Date();
    const minutesUntilStart = Math.floor(
      (startTime.getTime() - now.getTime()) / (1000 * 60)
    );
    return minutesUntilStart > 15 && reservation.status === 'ACTIVE';
  }

  function isPast(reservation: Reservation): boolean {
    return new Date(reservation.endTime) < new Date();
  }

  const pastReservations = reservations.filter((r) => isPast(r));
  const futureReservations = reservations.filter((r) => !isPast(r));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading reservations...</p>
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
            onClick={() => router.push(`/islands/${islandId}`)}
            className="mb-2"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Saunas
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{saunaName}</h1>
          <p className="text-gray-500">Today&apos;s Reservations</p>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto max-w-2xl px-4 py-6">
        {reservations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <p className="text-gray-500">
                No reservations for this sauna today
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Future Reservations */}
            {futureReservations.length > 0 && (
              <div>
                <h2 className="mb-3 text-lg font-semibold text-gray-900">
                  Upcoming
                </h2>
                <div className="space-y-3">
                  {futureReservations.map((reservation) => (
                    <ReservationCard
                      key={reservation.id}
                      reservation={reservation}
                      onCancel={() =>
                        setCancelDialog({ open: true, reservation })
                      }
                      canCancel={canCancel(reservation)}
                      isPast={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past Reservations */}
            {pastReservations.length > 0 && (
              <div>
                <h2 className="mb-3 text-lg font-semibold text-gray-900">
                  Earlier Today
                </h2>
                <div className="space-y-3">
                  {pastReservations.map((reservation) => (
                    <ReservationCard
                      key={reservation.id}
                      reservation={reservation}
                      onCancel={() => {}}
                      canCancel={false}
                      isPast={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Cancel Dialog */}
      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) => setCancelDialog({ open, reservation: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Reservation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this reservation?
            </DialogDescription>
          </DialogHeader>
          {cancelDialog.reservation && (
            <div className="py-4">
              <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                <div>
                  <span className="text-sm text-gray-500">Time:</span>
                  <div className="font-medium">
                    {formatTimeRange(
                      cancelDialog.reservation.startTime,
                      cancelDialog.reservation.endTime
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Boat:</span>
                  <div className="font-medium">
                    {cancelDialog.reservation.boat.name}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setCancelDialog({ open: false, reservation: null })
              }
            >
              Keep Reservation
            </Button>
            <Button variant="destructive" onClick={handleCancelReservation}>
              Confirm Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReservationCard({
  reservation,
  onCancel,
  canCancel,
  isPast,
}: {
  reservation: Reservation;
  onCancel: () => void;
  canCancel: boolean;
  isPast: boolean;
}) {
  return (
    <Card className={isPast ? 'opacity-60' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {formatTimeRange(reservation.startTime, reservation.endTime)}
            </CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              {reservation.adults}{' '}
              {reservation.adults === 1 ? 'adult' : 'adults'}
              {reservation.kids > 0 &&
                `, ${reservation.kids} ${reservation.kids === 1 ? 'kid' : 'kids'}`}
            </p>
          </div>
          {!isPast && (
            <div>
              {canCancel ? (
                <Button variant="ghost" size="sm" onClick={onCancel}>
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              ) : (
                <span className="text-xs text-gray-500">
                  Too late to cancel
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <div>
            <span className="font-medium">{reservation.boat.name}</span>
            {reservation.boat.captainName && (
              <span className="text-gray-500">
                {' '}
                • {reservation.boat.captainName}
              </span>
            )}
            <div className="text-xs text-gray-500">
              #{reservation.boat.membershipNumber}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
