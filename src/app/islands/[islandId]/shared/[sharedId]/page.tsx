'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Search,
  Users as UsersIcon,
  Clock,
  Check,
  Ship,
  Waves,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatTime } from '@/lib/utils';
import { ClubHeader } from '@/components/club-header';
import { getClubColorStyles } from '@/lib/club-theme';

type Step = 'details' | 'boat' | 'party-size' | 'confirm' | 'success';

interface SharedReservation {
  id: string;
  name: string | null;
  date: string;
  startTime: string;
  malesDurationHours: number;
  femalesDurationHours: number;
  genderOrder: 'MALES_FIRST' | 'FEMALES_FIRST';
  sauna: {
    id: string;
    name: string;
  };
  participants: Array<{
    id: string;
    boat: {
      id: string;
      name: string;
      membershipNumber: string;
      captainName: string | null;
    };
    adults: number;
    kids: number;
  }>;
}

interface Boat {
  id: string;
  name: string;
  membershipNumber: string;
  captainName: string | null;
}

interface ClubData {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

export default function JoinSharedPage() {
  const router = useRouter();
  const params = useParams();
  const islandId = params.islandId as string;
  const sharedId = params.sharedId as string;

  const [step, setStep] = useState<Step>('details');
  const [sharedReservation, setSharedReservation] =
    useState<SharedReservation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [boats, setBoats] = useState<Boat[]>([]);
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [club, setClub] = useState<ClubData | null>(null);

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

  const fetchSharedReservation = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/shared-reservations?saunaId=${sharedId}`
      );
      if (response.ok) {
        const data = await response.json();
        // Find the specific shared reservation
        const shared = data.data?.find(
          (sr: SharedReservation) => sr.id === sharedId
        );
        if (shared) {
          setSharedReservation(shared);
        }
      }
    } catch (error) {
      // Failed to fetch shared reservation
    }
  }, [sharedId]);

  const searchBoats = useCallback(async () => {
    if (searchQuery.length < 2) {
      setBoats([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/boats/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (response.ok) {
        const data = await response.json();
        setBoats(data.data || []);
      }
    } catch (error) {
      // Failed to search boats
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchClub();
    fetchSharedReservation();
  }, [fetchClub, fetchSharedReservation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchBoats();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchBoats]);

  async function handleBoatSelect(boat: Boat) {
    setLoading(true);
    setError('');

    // Check if boat already participating
    if (sharedReservation?.participants.some((p) => p.boat.id === boat.id)) {
      setError('This boat is already participating in this shared sauna');
      setLoading(false);
      return;
    }

    // Check daily limit
    try {
      const response = await fetch(
        `/api/boats/${boat.id}/daily-limit?islandId=${islandId}&date=${new Date().toISOString()}`
      );
      const data = await response.json();

      if (!data.data.canReserve) {
        setError('This boat already has a reservation on the island today');
        setLoading(false);
        return;
      }

      setSelectedBoat(boat);
      setStep('party-size');
    } catch (error) {
      setError('Failed to check boat availability');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinShared() {
    if (!selectedBoat || !sharedReservation) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/shared-reservations/${sharedId}/join`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            boatId: selectedBoat.id,
            adults,
            kids,
          }),
        }
      );

      if (response.ok) {
        setStep('success');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to join shared reservation');
      }
    } catch (error) {
      setError('Failed to join shared reservation');
    } finally {
      setLoading(false);
    }
  }

  function getGenderSchedule(): string {
    if (!sharedReservation) return '';

    const startTime = new Date(sharedReservation.startTime);
    const malesStart =
      sharedReservation.genderOrder === 'MALES_FIRST'
        ? startTime
        : new Date(
            startTime.getTime() +
              sharedReservation.femalesDurationHours * 60 * 60 * 1000
          );
    const femalesStart =
      sharedReservation.genderOrder === 'FEMALES_FIRST'
        ? startTime
        : new Date(
            startTime.getTime() +
              sharedReservation.malesDurationHours * 60 * 60 * 1000
          );

    const malesEnd = new Date(
      malesStart.getTime() +
        sharedReservation.malesDurationHours * 60 * 60 * 1000
    );
    const femalesEnd = new Date(
      femalesStart.getTime() +
        sharedReservation.femalesDurationHours * 60 * 60 * 1000
    );

    return `Women: ${formatTime(femalesStart)} - ${formatTime(femalesEnd)}\nMen: ${formatTime(malesStart)} - ${formatTime(malesEnd)}`;
  }

  const clubStyles = club
    ? getClubColorStyles(
        club.primaryColor || undefined,
        club.secondaryColor || undefined
      )
    : {};

  if (!sharedReservation) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"
        style={clubStyles}
      >
        <div className="text-center">
          <div className="border-club-primary mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-4 border-t-4"></div>
          <p className="text-lg font-medium text-gray-600">
            Loading shared sauna...
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
      {club && step === 'details' && (
        <ClubHeader
          clubName={club.name}
          clubLogo={club.logoUrl}
          title="Join Shared Sauna"
          subtitle={sharedReservation.name || 'Shared Sauna'}
          showBack
          backHref={`/islands/${islandId}`}
          primaryColor={club.primaryColor || undefined}
          secondaryColor={club.secondaryColor || undefined}
        />
      )}

      {/* Progress Indicator */}
      {step !== 'details' && (
        <div className="border-b-2 border-gray-200/50 bg-white shadow-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="mx-auto flex max-w-2xl items-center justify-between">
              <StepIndicator
                active={step === 'boat'}
                completed={['party-size', 'confirm', 'success'].includes(step)}
                number={1}
                label="Boat"
                icon={<Ship className="h-5 w-5" />}
              />
              <div className="mx-3 h-1 flex-1 rounded-full bg-gray-200">
                <div
                  className={`bg-club-primary h-full rounded-full transition-all duration-500 ${['party-size', 'confirm', 'success'].includes(step) ? 'w-full' : 'w-0'}`}
                />
              </div>
              <StepIndicator
                active={step === 'party-size'}
                completed={['confirm', 'success'].includes(step)}
                number={2}
                label="Party"
                icon={<UsersIcon className="h-5 w-5" />}
              />
              <div className="mx-3 h-1 flex-1 rounded-full bg-gray-200">
                <div
                  className={`bg-club-primary h-full rounded-full transition-all duration-500 ${['confirm', 'success'].includes(step) ? 'w-full' : 'w-0'}`}
                />
              </div>
              <StepIndicator
                active={step === 'confirm'}
                completed={step === 'success'}
                number={3}
                label="Confirm"
                icon={<Check className="h-5 w-5" />}
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="container mx-auto max-w-2xl px-4 py-8">
        {/* Step 0: Shared Reservation Details */}
        {step === 'details' && (
          <Card className="border-club-primary/20 overflow-hidden border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-white to-gray-50/50 pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="from-club-primary to-club-secondary flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm">
                  <Waves className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-club-primary">
                    {sharedReservation.name || 'Shared Sauna'}
                  </div>
                  <CardDescription className="mt-1 text-base">
                    {sharedReservation.sauna.name}
                  </CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Schedule */}
              <div className="border-club-primary/20 from-club-primary/5 to-club-secondary/10 rounded-xl border-2 bg-gradient-to-br p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Clock className="text-club-primary h-5 w-5" />
                  <span className="text-lg font-semibold text-gray-900">
                    Schedule
                  </span>
                </div>
                <div className="whitespace-pre-line text-base leading-relaxed text-gray-800">
                  {getGenderSchedule()}
                </div>
              </div>

              {/* Participants */}
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="bg-club-primary h-1 w-12 rounded-full"></div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Current Participants (
                    {sharedReservation.participants.length})
                  </h3>
                </div>
                {sharedReservation.participants.length === 0 ? (
                  <div className="rounded-xl border-2 border-gray-200/50 bg-gradient-to-br from-gray-50 to-gray-100 py-12 text-center">
                    <div className="from-club-primary/10 to-club-secondary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br">
                      <UsersIcon className="text-club-primary h-8 w-8" />
                    </div>
                    <p className="text-lg font-medium text-gray-600">
                      No participants yet - be the first!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sharedReservation.participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="rounded-xl border-2 border-gray-200/50 bg-gradient-to-br from-white to-gray-50/50 p-4 shadow-sm transition-all hover:shadow-md"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <Ship className="text-club-primary h-4 w-4" />
                              <div className="text-lg font-semibold text-gray-900">
                                {participant.boat.name}
                              </div>
                            </div>
                            {participant.boat.captainName && (
                              <div className="ml-6 text-sm text-gray-600">
                                Captain: {participant.boat.captainName}
                              </div>
                            )}
                            <div className="text-club-primary ml-6 text-sm font-medium">
                              #{participant.boat.membershipNumber}
                            </div>
                          </div>
                          <div className="bg-club-primary/10 flex items-center gap-1.5 rounded-full px-3 py-1.5">
                            <UsersIcon className="text-club-primary h-4 w-4" />
                            <span className="text-club-primary text-sm font-semibold">
                              {participant.adults}
                              {participant.kids > 0 && ` +${participant.kids}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={() => setStep('boat')}
                className="from-club-primary to-club-secondary h-12 w-full bg-gradient-to-r text-lg font-semibold shadow-lg transition-all hover:opacity-90"
              >
                Join This Shared Sauna
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Boat Selection */}
        {step === 'boat' && (
          <Card className="border-club-primary/20 overflow-hidden border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-white to-gray-50/50">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Ship className="text-club-primary h-6 w-6" />
                Select Your Boat
              </CardTitle>
              <CardDescription className="text-base">
                Search by boat name or membership number
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="relative">
                <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search boats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="focus:border-club-primary h-12 border-2 pl-12 text-base"
                />
              </div>

              {error && (
                <div className="rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-4 shadow-sm">
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              <div className="max-h-96 space-y-3 overflow-y-auto">
                {boats.map((boat) => (
                  <button
                    key={boat.id}
                    onClick={() => handleBoatSelect(boat)}
                    disabled={loading}
                    className="hover:border-club-primary/40 w-full rounded-xl border-2 border-gray-200/50 bg-gradient-to-br from-white to-gray-50/50 p-4 text-left transition-all hover:shadow-md disabled:opacity-50"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <Ship className="text-club-primary h-4 w-4" />
                      <div className="text-lg font-semibold text-gray-900">
                        {boat.name}
                      </div>
                    </div>
                    {boat.captainName && (
                      <div className="ml-6 text-sm text-gray-600">
                        Captain: {boat.captainName}
                      </div>
                    )}
                    <div className="text-club-primary ml-6 text-sm font-medium">
                      #{boat.membershipNumber}
                    </div>
                  </button>
                ))}
                {searchQuery.length >= 2 && boats.length === 0 && (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-500">No boats found</p>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                onClick={() => setStep('details')}
                className="h-11 w-full border-2"
              >
                Back to Details
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Party Size */}
        {step === 'party-size' && selectedBoat && (
          <Card className="border-club-primary/20 overflow-hidden border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-white to-gray-50/50">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <UsersIcon className="text-club-primary h-6 w-6" />
                Party Size
              </CardTitle>
              <CardDescription className="text-base">
                How many people will be using the sauna?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="border-club-primary/20 from-club-primary/5 to-club-secondary/10 rounded-xl border-2 bg-gradient-to-br p-5 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Ship className="text-club-primary h-5 w-5" />
                  <div className="text-lg font-semibold text-gray-900">
                    {selectedBoat.name}
                  </div>
                </div>
                <div className="text-club-primary ml-7 text-sm font-medium">
                  #{selectedBoat.membershipNumber}
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <Label
                    htmlFor="adults"
                    className="mb-2 block text-base font-semibold text-gray-900"
                  >
                    Adults *
                  </Label>
                  <Input
                    id="adults"
                    type="number"
                    min="1"
                    max="15"
                    value={adults}
                    onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                    className="focus:border-club-primary h-12 border-2 text-base"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="kids"
                    className="mb-2 block text-base font-semibold text-gray-900"
                  >
                    Kids (optional)
                  </Label>
                  <Input
                    id="kids"
                    type="number"
                    min="0"
                    max="15"
                    value={kids}
                    onChange={(e) => setKids(parseInt(e.target.value) || 0)}
                    className="focus:border-club-primary h-12 border-2 text-base"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('boat')}
                  className="h-11 flex-1 border-2"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep('confirm')}
                  disabled={adults < 1}
                  className="from-club-primary to-club-secondary h-11 flex-1 bg-gradient-to-r font-semibold shadow-lg hover:opacity-90"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && selectedBoat && (
          <Card className="border-club-primary/20 overflow-hidden border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-white to-gray-50/50">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Check className="text-club-primary h-6 w-6" />
                Confirm Participation
              </CardTitle>
              <CardDescription className="text-base">
                Review your details before joining
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50 p-5 shadow-sm">
                <div className="space-y-5">
                  <div className="border-b border-gray-300 pb-4">
                    <div className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Shared Sauna
                    </div>
                    <div className="text-club-primary text-lg font-semibold">
                      {sharedReservation.name || 'Shared Sauna'}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {sharedReservation.sauna.name}
                    </div>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Schedule
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="text-club-primary mt-0.5 h-5 w-5" />
                      <div className="whitespace-pre-line text-base leading-relaxed text-gray-900">
                        {getGenderSchedule()}
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Boat
                    </div>
                    <div className="flex items-start gap-2">
                      <Ship className="text-club-primary mt-0.5 h-5 w-5" />
                      <div>
                        <div className="text-lg font-semibold text-gray-900">
                          {selectedBoat.name}
                        </div>
                        {selectedBoat.captainName && (
                          <div className="text-sm text-gray-600">
                            Captain: {selectedBoat.captainName}
                          </div>
                        )}
                        <div className="text-club-primary text-sm font-medium">
                          #{selectedBoat.membershipNumber}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Party Size
                    </div>
                    <div className="flex items-center gap-2">
                      <UsersIcon className="text-club-primary h-5 w-5" />
                      <div className="text-lg font-semibold text-gray-900">
                        {adults} {adults === 1 ? 'adult' : 'adults'}
                        {kids > 0 && `, ${kids} ${kids === 1 ? 'kid' : 'kids'}`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-4 shadow-sm">
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('party-size')}
                  className="h-11 flex-1 border-2"
                >
                  Back
                </Button>
                <Button
                  onClick={handleJoinShared}
                  disabled={loading}
                  className="from-club-primary to-club-secondary h-11 flex-1 bg-gradient-to-r font-semibold shadow-lg hover:opacity-90"
                >
                  {loading ? 'Joining...' : 'Confirm & Join'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {step === 'success' && selectedBoat && (
          <Card className="border-club-primary/20 overflow-hidden border-2 shadow-lg">
            <CardContent className="py-16 text-center">
              <div className="from-club-primary to-club-secondary mx-auto mb-6 flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-gradient-to-br shadow-lg">
                <Check className="h-10 w-10 text-white" />
              </div>
              <h2 className="mb-3 text-3xl font-bold text-gray-900">
                Joined Successfully!
              </h2>
              <p className="mb-8 text-lg text-gray-600">
                You&apos;re now part of this shared sauna
              </p>

              <div className="border-club-primary/20 from-club-primary/5 to-club-secondary/10 mx-auto mb-8 max-w-sm rounded-2xl border-2 bg-gradient-to-br p-6 text-left shadow-lg">
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Event
                    </div>
                    <div className="text-club-primary text-lg font-semibold">
                      {sharedReservation.name || 'Shared Sauna'}
                    </div>
                  </div>
                  <div className="border-t border-gray-300 pt-3">
                    <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Schedule
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="text-club-primary mt-0.5 h-5 w-5" />
                      <div className="whitespace-pre-line text-base leading-relaxed text-gray-900">
                        {getGenderSchedule()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push(`/islands/${islandId}`)}
                  className="from-club-primary to-club-secondary h-12 w-full max-w-sm bg-gradient-to-r text-lg font-semibold shadow-lg hover:opacity-90"
                >
                  Back to Saunas
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function StepIndicator({
  active,
  completed,
  number,
  label,
  icon,
}: {
  active: boolean;
  completed: boolean;
  number: number;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full font-semibold shadow-sm transition-all duration-300 ${
          completed
            ? 'bg-club-primary scale-105 text-white shadow-lg'
            : active
              ? 'bg-club-primary ring-club-primary/20 text-white ring-4'
              : 'bg-gray-200 text-gray-500'
        }`}
      >
        {completed ? <Check className="h-6 w-6" /> : icon || number}
      </div>
      <span
        className={`mt-2 text-xs font-medium ${active || completed ? 'text-club-primary' : 'text-gray-500'}`}
      >
        {label}
      </span>
    </div>
  );
}
