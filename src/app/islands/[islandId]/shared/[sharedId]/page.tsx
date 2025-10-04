'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ChevronLeft,
  Search,
  Users as UsersIcon,
  Clock,
  Check,
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
    fetchSharedReservation();
  }, [fetchSharedReservation]);

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

  if (!sharedReservation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading shared sauna...</p>
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
            onClick={() => router.push(`/app/islands/${islandId}`)}
            className="mb-2"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Join Shared Sauna
          </h1>
          <p className="text-gray-500">
            {sharedReservation.name || 'Shared Sauna'}
          </p>
        </div>
      </header>

      {/* Progress Indicator */}
      {step !== 'details' && (
        <div className="border-b border-gray-200 bg-white">
          <div className="container mx-auto px-4 py-4">
            <div className="mx-auto flex max-w-md items-center justify-between">
              <StepIndicator
                active={step === 'boat'}
                completed={['party-size', 'confirm', 'success'].includes(step)}
                number={1}
                label="Boat"
              />
              <div className="mx-2 h-0.5 flex-1 bg-gray-200">
                <div
                  className={`h-full transition-all ${['party-size', 'confirm', 'success'].includes(step) ? 'bg-purple-600' : 'bg-gray-200'}`}
                />
              </div>
              <StepIndicator
                active={step === 'party-size'}
                completed={['confirm', 'success'].includes(step)}
                number={2}
                label="Party"
              />
              <div className="mx-2 h-0.5 flex-1 bg-gray-200">
                <div
                  className={`h-full transition-all ${['confirm', 'success'].includes(step) ? 'bg-purple-600' : 'bg-gray-200'}`}
                />
              </div>
              <StepIndicator
                active={step === 'confirm'}
                completed={step === 'success'}
                number={3}
                label="Confirm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="container mx-auto max-w-2xl px-4 py-8">
        {/* Step 0: Shared Reservation Details */}
        {step === 'details' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-purple-600" />
                {sharedReservation.name || 'Shared Sauna'}
              </CardTitle>
              <CardDescription>{sharedReservation.sauna.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Schedule */}
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-900">Schedule</span>
                </div>
                <div className="whitespace-pre-line text-sm text-purple-800">
                  {getGenderSchedule()}
                </div>
              </div>

              {/* Participants */}
              <div>
                <h3 className="mb-3 font-medium text-gray-900">
                  Current Participants ({sharedReservation.participants.length})
                </h3>
                {sharedReservation.participants.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-500">
                    No participants yet - be the first!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sharedReservation.participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="font-medium text-gray-900">
                          {participant.boat.name}
                        </div>
                        {participant.boat.captainName && (
                          <div className="text-sm text-gray-600">
                            {participant.boat.captainName}
                          </div>
                        )}
                        <div className="text-sm text-gray-500">
                          {participant.adults}{' '}
                          {participant.adults === 1 ? 'adult' : 'adults'}
                          {participant.kids > 0 &&
                            `, ${participant.kids} ${participant.kids === 1 ? 'kid' : 'kids'}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={() => setStep('boat')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Join This Shared Sauna
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Boat Selection */}
        {step === 'boat' && (
          <Card>
            <CardHeader>
              <CardTitle>Select Your Boat</CardTitle>
              <CardDescription>
                Search by boat name or membership number
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search boats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="max-h-96 space-y-2 overflow-y-auto">
                {boats.map((boat) => (
                  <button
                    key={boat.id}
                    onClick={() => handleBoatSelect(boat)}
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-purple-500 hover:bg-purple-50 disabled:opacity-50"
                  >
                    <div className="font-medium text-gray-900">{boat.name}</div>
                    {boat.captainName && (
                      <div className="text-sm text-gray-600">
                        Captain: {boat.captainName}
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      #{boat.membershipNumber}
                    </div>
                  </button>
                ))}
                {searchQuery.length >= 2 && boats.length === 0 && (
                  <p className="py-8 text-center text-gray-500">
                    No boats found
                  </p>
                )}
              </div>

              <Button
                variant="outline"
                onClick={() => setStep('details')}
                className="w-full"
              >
                Back to Details
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Party Size */}
        {step === 'party-size' && selectedBoat && (
          <Card>
            <CardHeader>
              <CardTitle>Party Size</CardTitle>
              <CardDescription>
                How many people will be using the sauna?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="font-medium text-gray-900">
                  {selectedBoat.name}
                </div>
                <div className="text-sm text-gray-500">
                  #{selectedBoat.membershipNumber}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="adults">Adults *</Label>
                  <Input
                    id="adults"
                    type="number"
                    min="1"
                    max="15"
                    value={adults}
                    onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="kids">Kids (optional)</Label>
                  <Input
                    id="kids"
                    type="number"
                    min="0"
                    max="15"
                    value={kids}
                    onChange={(e) => setKids(parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('boat')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep('confirm')}
                  disabled={adults < 1}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && selectedBoat && (
          <Card>
            <CardHeader>
              <CardTitle>Confirm Participation</CardTitle>
              <CardDescription>
                Review your details before joining
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <div className="text-sm text-gray-500">Shared Sauna</div>
                  <div className="font-medium">
                    {sharedReservation.name || 'Shared Sauna'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {sharedReservation.sauna.name}
                  </div>
                </div>

                <div className="border-b pb-3">
                  <div className="text-sm text-gray-500">Schedule</div>
                  <div className="mt-1 whitespace-pre-line text-sm text-gray-900">
                    {getGenderSchedule()}
                  </div>
                </div>

                <div className="border-b pb-3">
                  <div className="text-sm text-gray-500">Boat</div>
                  <div className="font-medium">{selectedBoat.name}</div>
                  {selectedBoat.captainName && (
                    <div className="text-sm text-gray-600">
                      Captain: {selectedBoat.captainName}
                    </div>
                  )}
                  <div className="text-sm text-gray-500">
                    #{selectedBoat.membershipNumber}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Party Size</div>
                  <div className="font-medium">
                    {adults} {adults === 1 ? 'adult' : 'adults'}
                    {kids > 0 && `, ${kids} ${kids === 1 ? 'kid' : 'kids'}`}
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('party-size')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleJoinShared}
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? 'Joining...' : 'Confirm & Join'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {step === 'success' && selectedBoat && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <Check className="h-8 w-8 text-purple-600" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Joined Successfully!
              </h2>
              <p className="mb-6 text-gray-600">
                You&apos;re now part of this shared sauna
              </p>

              <div className="mx-auto mb-6 max-w-sm rounded-lg bg-purple-50 p-6 text-left">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-purple-700">Event:</span>
                    <div className="font-medium text-purple-900">
                      {sharedReservation.name || 'Shared Sauna'}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-purple-700">Schedule:</span>
                    <div className="whitespace-pre-line text-sm text-purple-900">
                      {getGenderSchedule()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push(`/app/islands/${islandId}`)}
                  className="w-full max-w-sm bg-purple-600 hover:bg-purple-700"
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
}: {
  active: boolean;
  completed: boolean;
  number: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full font-medium transition-colors ${
          completed
            ? 'bg-purple-600 text-white'
            : active
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 text-gray-600'
        }`}
      >
        {completed ? <Check className="h-5 w-5" /> : number}
      </div>
      <span className="mt-1 text-xs text-gray-600">{label}</span>
    </div>
  );
}
