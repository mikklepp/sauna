'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Search, Check, Users, Calendar } from 'lucide-react';
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

type Step = 'boat' | 'party-size' | 'confirm' | 'success';

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

export default function ReservePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const islandId = params.islandId as string;
  const saunaId = searchParams.get('saunaId') || '';

  const [step, setStep] = useState<Step>('boat');
  const [searchQuery, setSearchQuery] = useState('');
  const [boats, setBoats] = useState<Boat[]>([]);
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [club, setClub] = useState<ClubData | null>(null);
  const [saunaInfo, setSaunaInfo] = useState<{
    sauna: { id: string; name: string };
    nextAvailable: { startTime: string; endTime: string };
  } | null>(null);

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

  const fetchSaunaInfo = useCallback(async () => {
    try {
      const response = await fetch(`/api/saunas/${saunaId}/next-available`);
      if (response.ok) {
        const data = await response.json();
        setSaunaInfo(data.data);
      }
    } catch (error) {
      // Failed to fetch sauna info
    }
  }, [saunaId]);

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
    fetchSaunaInfo();
  }, [fetchClub, fetchSaunaInfo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchBoats();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchBoats]);

  const clubStyles = club
    ? getClubColorStyles(club.primaryColor || undefined, club.secondaryColor || undefined)
    : {};

  async function handleBoatSelect(boat: Boat) {
    setLoading(true);
    setError('');

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

  async function handleConfirmReservation() {
    if (!selectedBoat || !saunaInfo) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saunaId,
          boatId: selectedBoat.id,
          startTime: saunaInfo.nextAvailable.startTime,
          adults,
          kids,
        }),
      });

      if (response.ok) {
        setStep('success');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create reservation');
      }
    } catch (error) {
      setError('Failed to create reservation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" style={clubStyles}>
      {/* Club Header */}
      {club && (
        <ClubHeader
          clubName={club.name}
          clubLogo={club.logoUrl}
          title="Make Reservation"
          subtitle={saunaInfo?.sauna.name}
          showBack
          backHref={`/islands/${islandId}`}
          primaryColor={club.primaryColor || undefined}
          secondaryColor={club.secondaryColor || undefined}
        />
      )}

      {/* Progress Indicator */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            <StepIndicator
              active={step === 'boat'}
              completed={['party-size', 'confirm', 'success'].includes(step)}
              number={1}
              label="Select Boat"
              icon={<Search className="h-4 w-4" />}
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
              label="Party Size"
              icon={<Users className="h-4 w-4" />}
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
              icon={<Check className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto max-w-2xl px-4 py-8">
        {/* Step 1: Boat Selection */}
        {step === 'boat' && (
          <Card className="overflow-hidden border-2 border-gray-200/50 shadow-lg animate-in">
            <CardHeader className="bg-gradient-to-r from-white to-gray-50/50 border-b">
              <CardTitle className="text-club-primary flex items-center gap-2">
                <Search className="h-5 w-5" />
                Select Your Boat
              </CardTitle>
              <CardDescription>
                Search by boat name or membership number
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search boats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 text-base border-2 focus:border-club-primary"
                  data-testid="boat-search-input"
                  aria-label="Boat name or membership number"
                />
              </div>

              {error && (
                <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-600">{error}</p>
                </div>
              )}

              <div className="max-h-96 space-y-3 overflow-y-auto">
                {boats.map((boat) => (
                  <button
                    key={boat.id}
                    onClick={() => handleBoatSelect(boat)}
                    disabled={loading}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white p-4 text-left transition-all hover:border-club-primary hover:bg-club-primary/5 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="boat-result"
                  >
                    <div className="font-semibold text-gray-900 text-lg">{boat.name}</div>
                    {boat.captainName && (
                      <div className="text-sm text-gray-600 mt-1">
                        Captain: {boat.captainName}
                      </div>
                    )}
                    <div className="text-sm font-medium text-club-primary mt-1">
                      #{boat.membershipNumber}
                    </div>
                  </button>
                ))}
                {searchQuery.length >= 2 && boats.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-gray-500 text-lg">No boats found</p>
                    <p className="text-sm text-gray-400 mt-2">Try a different search term</p>
                  </div>
                )}
                {searchQuery.length < 2 && (
                  <div className="py-12 text-center">
                    <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Start typing to search boats</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Party Size */}
        {step === 'party-size' && selectedBoat && (
          <Card className="overflow-hidden border-2 border-gray-200/50 shadow-lg animate-in">
            <CardHeader className="bg-gradient-to-r from-white to-gray-50/50 border-b">
              <CardTitle className="text-club-primary flex items-center gap-2">
                <Users className="h-5 w-5" />
                Party Size
              </CardTitle>
              <CardDescription>
                How many people will be using the sauna?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="rounded-xl border-2 border-club-primary/20 bg-gradient-to-br from-club-primary/5 to-club-primary/10 p-5">
                <div className="font-semibold text-gray-900 text-lg">
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

              <div className="space-y-5">
                <div>
                  <Label htmlFor="adults" className="text-base font-semibold">Adults *</Label>
                  <Input
                    id="adults"
                    type="number"
                    min="1"
                    max="15"
                    value={adults}
                    onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                    className="mt-2 h-12 text-base border-2 focus:border-club-primary"
                  />
                </div>

                <div>
                  <Label htmlFor="kids" className="text-base font-semibold">Kids (optional)</Label>
                  <Input
                    id="kids"
                    type="number"
                    min="0"
                    max="15"
                    value={kids}
                    onChange={(e) => setKids(parseInt(e.target.value) || 0)}
                    className="mt-2 h-12 text-base border-2 focus:border-club-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('boat')}
                  className="flex-1 h-12 border-2"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep('confirm')}
                  disabled={adults < 1}
                  className="flex-1 h-12 bg-club-primary hover:bg-club-primary/90 text-white font-semibold"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && selectedBoat && saunaInfo && (
          <Card className="overflow-hidden border-2 border-gray-200/50 shadow-lg animate-in">
            <CardHeader className="bg-gradient-to-r from-white to-gray-50/50 border-b">
              <CardTitle className="text-club-primary flex items-center gap-2">
                <Check className="h-5 w-5" />
                Confirm Reservation
              </CardTitle>
              <CardDescription>
                Please review your reservation details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="rounded-xl bg-gradient-to-br from-club-primary/10 to-club-secondary/10 p-5 border-2 border-club-primary/20">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Calendar className="h-4 w-4" />
                    Time
                  </div>
                  <div className="text-2xl font-bold text-club-primary">
                    {formatTime(saunaInfo.nextAvailable.startTime)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Duration: 1 hour
                  </div>
                </div>

                <div className="border-b-2 border-gray-100 pb-4">
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Sauna</div>
                  <div className="font-semibold text-lg text-gray-900 mt-1">{saunaInfo.sauna.name}</div>
                </div>

                <div className="border-b-2 border-gray-100 pb-4">
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Boat</div>
                  <div className="font-semibold text-lg text-gray-900 mt-1">{selectedBoat.name}</div>
                  {selectedBoat.captainName && (
                    <div className="text-sm text-gray-600 mt-1">
                      Captain: {selectedBoat.captainName}
                    </div>
                  )}
                  <div className="text-sm font-medium text-club-primary mt-1">
                    #{selectedBoat.membershipNumber}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Party Size</div>
                  <div className="font-semibold text-lg text-gray-900 mt-1 flex items-center gap-2">
                    <Users className="h-5 w-5 text-club-primary" />
                    {adults} {adults === 1 ? 'adult' : 'adults'}
                    {kids > 0 && `, ${kids} ${kids === 1 ? 'kid' : 'kids'}`}
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('party-size')}
                  className="flex-1 h-12 border-2"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirmReservation}
                  disabled={loading}
                  className="flex-1 h-12 bg-club-primary hover:bg-club-primary/90 text-white font-semibold shadow-lg"
                >
                  {loading ? 'Creating...' : 'Confirm Reservation'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {step === 'success' && selectedBoat && saunaInfo && (
          <Card className="overflow-hidden border-2 border-green-200 shadow-2xl animate-in">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg">
                <Check className="h-10 w-10 text-white" strokeWidth={3} />
              </div>
              <h2
                className="mb-3 text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent"
                data-testid="success-title"
              >
                Reservation Confirmed!
              </h2>
              <p className="mb-8 text-lg text-gray-600">Your sauna is ready and waiting</p>

              <div className="mx-auto mb-8 max-w-sm rounded-2xl border-2 border-club-primary/20 bg-gradient-to-br from-club-primary/5 to-club-secondary/10 p-6 text-left shadow-lg">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      <Calendar className="h-4 w-4" />
                      Time
                    </div>
                    <div className="font-bold text-2xl text-club-primary mt-1">
                      {formatTime(saunaInfo.nextAvailable.startTime)}
                    </div>
                  </div>
                  <div className="border-t-2 border-gray-200 pt-3">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Duration</span>
                    <div className="font-semibold text-lg text-gray-900">1 hour</div>
                  </div>
                  <div className="border-t-2 border-gray-200 pt-3">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Sauna</span>
                    <div className="font-semibold text-lg text-gray-900">{saunaInfo.sauna.name}</div>
                  </div>
                  <div className="border-t-2 border-gray-200 pt-3">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Boat</span>
                    <div className="font-semibold text-lg text-gray-900">{selectedBoat.name}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-w-sm mx-auto">
                <Button
                  onClick={() => router.push(`/islands/${islandId}`)}
                  className="w-full h-12 bg-club-primary hover:bg-club-primary/90 text-white font-semibold shadow-lg"
                >
                  Back to Saunas
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/islands/${islandId}/saunas/${saunaId}/reservations`
                    )
                  }
                  className="w-full h-12 border-2 border-club-primary/30 text-club-primary hover:bg-club-primary/5"
                >
                  View All Reservations
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
    <div className="flex flex-col items-center gap-2">
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
      <span className={`text-xs font-medium ${active || completed ? 'text-gray-900' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}
