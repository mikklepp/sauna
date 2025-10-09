'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Clock, Users, X, Calendar } from 'lucide-react';
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
import { ClubHeader } from '@/components/club-header';
import { getClubColorStyles } from '@/lib/club-theme';

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

interface ClubData {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

export default function ReservationsListPage() {
  const params = useParams();
  const islandId = params.islandId as string;
  const saunaId = params.saunaId as string;

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saunaName, setSaunaName] = useState('');
  const [club, setClub] = useState<ClubData | null>(null);
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    reservation: Reservation | null;
  }>({
    open: false,
    reservation: null,
  });

  const fetchClub = useCallback(async () => {
    try {
      const clubId = localStorage.getItem('club_id');
      if (!clubId) return;

      const response = await fetch(`/api/clubs/${clubId}/config`);
      if (response.ok) {
        const data = await response.json();
        setClub(data.data.club);
      }
    } catch {
      // Failed to fetch club
    }
  }, []);

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
    fetchClub();
    fetchData();
  }, [fetchClub, fetchData]);

  const clubStyles = club
    ? getClubColorStyles(
        club.primaryColor || undefined,
        club.secondaryColor || undefined
      )
    : {};

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="border-club-primary mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-4 border-t-4"></div>
          <p className="text-lg font-medium text-gray-600">
            Loading reservations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
      style={clubStyles}
    >
      {/* Club Header */}
      {club && (
        <ClubHeader
          clubName={club.name}
          clubLogo={club.logoUrl}
          title={saunaName}
          subtitle="Today's Reservations"
          showBack
          backHref={`/islands/${islandId}`}
          primaryColor={club.primaryColor || undefined}
          secondaryColor={club.secondaryColor || undefined}
        />
      )}

      {/* Content */}
      <main className="container mx-auto max-w-2xl px-4 py-8">
        {reservations.length === 0 ? (
          <Card
            className="overflow-hidden border-2 border-gray-200/50 shadow-lg"
            data-testid="empty-state"
          >
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                <Clock className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                No Reservations Yet
              </h3>
              <p className="text-lg text-gray-500">
                No reservations for this sauna today
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Future Reservations */}
            {futureReservations.length > 0 && (
              <div data-testid="upcoming-reservations">
                <div className="mb-4 flex items-center gap-3">
                  <div className="bg-club-primary h-1 w-12 rounded-full"></div>
                  <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                    <Calendar className="text-club-primary h-5 w-5" />
                    Upcoming
                  </h2>
                </div>
                <div className="space-y-4">
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
              <div data-testid="past-reservations">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-1 w-12 rounded-full bg-gray-400"></div>
                  <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                    <Clock className="h-5 w-5 text-gray-400" />
                    Earlier Today
                  </h2>
                </div>
                <div className="space-y-4">
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <X className="h-6 w-6 text-red-600" />
              Cancel Reservation
            </DialogTitle>
            <DialogDescription className="text-base">
              Are you sure you want to cancel this reservation? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {cancelDialog.reservation && (
            <div className="py-4">
              <div className="space-y-4 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-5">
                <div>
                  <div className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Time
                  </div>
                  <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Clock className="text-club-primary h-5 w-5" />
                    {formatTimeRange(
                      cancelDialog.reservation.startTime,
                      cancelDialog.reservation.endTime
                    )}
                  </div>
                </div>
                <div className="border-t border-gray-300 pt-3">
                  <div className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Boat
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {cancelDialog.reservation.boat.name}
                  </div>
                  {cancelDialog.reservation.boat.captainName && (
                    <div className="text-sm text-gray-600">
                      Captain: {cancelDialog.reservation.boat.captainName}
                    </div>
                  )}
                  <div className="text-club-primary text-sm font-medium">
                    #{cancelDialog.reservation.boat.membershipNumber}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() =>
                setCancelDialog({ open: false, reservation: null })
              }
              className="h-11 flex-1 border-2"
            >
              Keep Reservation
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelReservation}
              className="h-11 flex-1 bg-red-600 font-semibold shadow-lg hover:bg-red-700"
            >
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
    <Card
      className={`overflow-hidden border-2 transition-all hover:shadow-lg ${isPast ? 'border-gray-200/50 opacity-70' : 'border-club-primary/20 hover:border-club-primary/40'}`}
      data-testid="reservation-item"
    >
      <CardHeader className="bg-gradient-to-r from-white to-gray-50/50 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Clock className="text-club-primary h-5 w-5" />
              <CardTitle
                className="text-club-primary text-xl"
                data-testid="reservation-time"
              >
                {formatTimeRange(reservation.startTime, reservation.endTime)}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-4 w-4" />
              <p
                className="text-sm font-medium"
                data-testid="reservation-party-size"
              >
                {reservation.adults}{' '}
                {reservation.adults === 1 ? 'adult' : 'adults'}
                {reservation.kids > 0 &&
                  `, ${reservation.kids} ${reservation.kids === 1 ? 'kid' : 'kids'}`}
              </p>
            </div>
          </div>
          {!isPast && (
            <div className="flex-shrink-0">
              {canCancel ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className="h-10 w-10 p-0 hover:bg-red-50 hover:text-red-600"
                  data-testid="cancel-button"
                >
                  <X className="h-5 w-5" />
                </Button>
              ) : (
                <span
                  className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500"
                  data-testid="too-late-message"
                >
                  Too late to cancel
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
          <div
            className="mb-1 text-lg font-semibold text-gray-900"
            data-testid="reservation-boat-name"
          >
            {reservation.boat.name}
          </div>
          {reservation.boat.captainName && (
            <div className="mb-1 text-sm text-gray-600">
              Captain: {reservation.boat.captainName}
            </div>
          )}
          <div className="text-club-primary text-sm font-medium">
            #{reservation.boat.membershipNumber}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
