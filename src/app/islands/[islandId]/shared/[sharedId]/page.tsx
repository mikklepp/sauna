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
    ? getClubColorStyles(club.primaryColor || undefined, club.secondaryColor || undefined)
    : {};

  if (!sharedReservation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100" style={clubStyles}>
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-4 border-t-4 border-club-primary"></div>
          <p className="text-gray-600 text-lg font-medium">Loading shared sauna...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" style={clubStyles}>
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
                  className={`h-full rounded-full transition-all duration-500 bg-club-primary ${['party-size', 'confirm', 'success'].includes(step) ? 'w-full' : 'w-0'}`}
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
                  className={`h-full rounded-full transition-all duration-500 bg-club-primary ${['confirm', 'success'].includes(step) ? 'w-full' : 'w-0'}`}
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
          <Card className="overflow-hidden border-2 border-club-primary/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-white to-gray-50/50 pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-club-primary to-club-secondary shadow-sm">
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
              <div className="rounded-xl border-2 border-club-primary/20 bg-gradient-to-br from-club-primary/5 to-club-secondary/10 p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-club-primary" />
                  <span className="font-semibold text-gray-900 text-lg">Schedule</span>
                </div>
                <div className="whitespace-pre-line text-base text-gray-800 leading-relaxed">
                  {getGenderSchedule()}
                </div>
              </div>

              {/* Participants */}
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-1 w-12 rounded-full bg-club-primary"></div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Current Participants ({sharedReservation.participants.length})
                  </h3>
                </div>
                {sharedReservation.participants.length === 0 ? (
                  <div className="py-12 text-center rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200/50">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-club-primary/10 to-club-secondary/10">
                      <UsersIcon className="h-8 w-8 text-club-primary" />
                    </div>
                    <p className="text-gray-600 font-medium text-lg">
                      No participants yet - be the first!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sharedReservation.participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="rounded-xl border-2 border-gray-200/50 bg-gradient-to-br from-white to-gray-50/50 p-4 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Ship className="h-4 w-4 text-club-primary" />
                              <div className="font-semibold text-gray-900 text-lg">
                                {participant.boat.name}
                              </div>
                            </div>
                            {participant.boat.captainName && (
                              <div className="text-sm text-gray-600 ml-6">
                                Captain: {participant.boat.captainName}
                              </div>
                            )}
                            <div className="text-sm font-medium text-club-primary ml-6">
                              #{participant.boat.membershipNumber}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 rounded-full bg-club-primary/10 px-3 py-1.5">
                            <UsersIcon className="h-4 w-4 text-club-primary" />
                            <span className="text-sm font-semibold text-club-primary">
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
                className="w-full h-12 bg-gradient-to-r from-club-primary to-club-secondary hover:opacity-90 font-semibold text-lg shadow-lg transition-all"
              >
                Join This Shared Sauna
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Boat Selection */}
        {step === 'boat' && (
          <Card className="overflow-hidden border-2 border-club-primary/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-white to-gray-50/50">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Ship className="h-6 w-6 text-club-primary" />
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
                  className="pl-12 h-12 text-base border-2 focus:border-club-primary"
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
                    className="w-full rounded-xl border-2 border-gray-200/50 bg-gradient-to-br from-white to-gray-50/50 p-4 text-left transition-all hover:border-club-primary/40 hover:shadow-md disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Ship className="h-4 w-4 text-club-primary" />
                      <div className="font-semibold text-gray-900 text-lg">{boat.name}</div>
                    </div>
                    {boat.captainName && (
                      <div className="text-sm text-gray-600 ml-6">
                        Captain: {boat.captainName}
                      </div>
                    )}
                    <div className="text-sm font-medium text-club-primary ml-6">
                      #{boat.membershipNumber}
                    </div>
                  </button>
                ))}
                {searchQuery.length >= 2 && boats.length === 0 && (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No boats found</p>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                onClick={() => setStep('details')}
                className="w-full h-11 border-2"
              >
                Back to Details
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Party Size */}
        {step === 'party-size' && selectedBoat && (
          <Card className="overflow-hidden border-2 border-club-primary/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-white to-gray-50/50">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <UsersIcon className="h-6 w-6 text-club-primary" />
                Party Size
              </CardTitle>
              <CardDescription className="text-base">
                How many people will be using the sauna?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="rounded-xl border-2 border-club-primary/20 bg-gradient-to-br from-club-primary/5 to-club-secondary/10 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Ship className="h-5 w-5 text-club-primary" />
                  <div className="font-semibold text-gray-900 text-lg">
                    {selectedBoat.name}
                  </div>
                </div>
                <div className="text-sm font-medium text-club-primary ml-7">
                  #{selectedBoat.membershipNumber}
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <Label htmlFor="adults" className="text-base font-semibold text-gray-900 mb-2 block">
                    Adults *
                  </Label>
                  <Input
                    id="adults"
                    type="number"
                    min="1"
                    max="15"
                    value={adults}
                    onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                    className="h-12 text-base border-2 focus:border-club-primary"
                  />
                </div>

                <div>
                  <Label htmlFor="kids" className="text-base font-semibold text-gray-900 mb-2 block">
                    Kids (optional)
                  </Label>
                  <Input
                    id="kids"
                    type="number"
                    min="0"
                    max="15"
                    value={kids}
                    onChange={(e) => setKids(parseInt(e.target.value) || 0)}
                    className="h-12 text-base border-2 focus:border-club-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('boat')}
                  className="flex-1 h-11 border-2"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep('confirm')}
                  disabled={adults < 1}
                  className="flex-1 h-11 bg-gradient-to-r from-club-primary to-club-secondary hover:opacity-90 font-semibold shadow-lg"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && selectedBoat && (
          <Card className="overflow-hidden border-2 border-club-primary/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-white to-gray-50/50">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Check className="h-6 w-6 text-club-primary" />
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
                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Shared Sauna
                    </div>
                    <div className="font-semibold text-lg text-club-primary">
                      {sharedReservation.name || 'Shared Sauna'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {sharedReservation.sauna.name}
                    </div>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Schedule
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-club-primary mt-0.5" />
                      <div className="whitespace-pre-line text-base text-gray-900 leading-relaxed">
                        {getGenderSchedule()}
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Boat
                    </div>
                    <div className="flex items-start gap-2">
                      <Ship className="h-5 w-5 text-club-primary mt-0.5" />
                      <div>
                        <div className="font-semibold text-lg text-gray-900">
                          {selectedBoat.name}
                        </div>
                        {selectedBoat.captainName && (
                          <div className="text-sm text-gray-600">
                            Captain: {selectedBoat.captainName}
                          </div>
                        )}
                        <div className="text-sm font-medium text-club-primary">
                          #{selectedBoat.membershipNumber}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Party Size
                    </div>
                    <div className="flex items-center gap-2">
                      <UsersIcon className="h-5 w-5 text-club-primary" />
                      <div className="font-semibold text-lg text-gray-900">
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
                  className="flex-1 h-11 border-2"
                >
                  Back
                </Button>
                <Button
                  onClick={handleJoinShared}
                  disabled={loading}
                  className="flex-1 h-11 bg-gradient-to-r from-club-primary to-club-secondary hover:opacity-90 font-semibold shadow-lg"
                >
                  {loading ? 'Joining...' : 'Confirm & Join'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {step === 'success' && selectedBoat && (
          <Card className="overflow-hidden border-2 border-club-primary/20 shadow-lg">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-club-primary to-club-secondary shadow-lg animate-pulse">
                <Check className="h-10 w-10 text-white" />
              </div>
              <h2 className="mb-3 text-3xl font-bold text-gray-900">
                Joined Successfully!
              </h2>
              <p className="mb-8 text-gray-600 text-lg">
                You&apos;re now part of this shared sauna
              </p>

              <div className="mx-auto mb-8 max-w-sm rounded-2xl border-2 border-club-primary/20 bg-gradient-to-br from-club-primary/5 to-club-secondary/10 p-6 text-left shadow-lg">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Event
                    </div>
                    <div className="font-semibold text-lg text-club-primary">
                      {sharedReservation.name || 'Shared Sauna'}
                    </div>
                  </div>
                  <div className="border-t border-gray-300 pt-3">
                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Schedule
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-club-primary mt-0.5" />
                      <div className="whitespace-pre-line text-base text-gray-900 leading-relaxed">
                        {getGenderSchedule()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push(`/islands/${islandId}`)}
                  className="w-full max-w-sm h-12 bg-gradient-to-r from-club-primary to-club-secondary hover:opacity-90 font-semibold text-lg shadow-lg"
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
        className={`flex h-12 w-12 items-center justify-center rounded-full font-semibold transition-all duration-300 shadow-sm ${
          completed
            ? 'bg-club-primary text-white scale-105 shadow-lg'
            : active
              ? 'bg-club-primary text-white ring-4 ring-club-primary/20'
              : 'bg-gray-200 text-gray-500'
        }`}
      >
        {completed ? <Check className="h-6 w-6" /> : icon || number}
      </div>
      <span className={`mt-2 text-xs font-medium ${active || completed ? 'text-club-primary' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}
