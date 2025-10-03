'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Search, Users as UsersIcon, Clock, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [sharedReservation, setSharedReservation] = useState<SharedReservation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [boats, setBoats] = useState<Boat[]>([]);
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSharedReservation();
  }, [sharedId]);

  async function fetchSharedReservation() {
    try {
      const response = await fetch(`/api/shared-reservations?saunaId=${sharedId}`);
      if (response.ok) {
        const data = await response.json();
        // Find the specific shared reservation
        const shared = data.data?.find((sr: any) => sr.id === sharedId);
        if (shared) {
          setSharedReservation(shared);
        }
      }
    } catch (error) {
      console.error('Failed to fetch shared reservation:', error);
    }
  }

  async function searchBoats() {
    if (searchQuery.length < 2) {
      setBoats([]);
      return;
    }

    try {
      const response = await fetch(`/api/boats/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setBoats(data.data || []);
      }
    } catch (error) {
      console.error('Failed to search boats:', error);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      searchBoats();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function handleBoatSelect(boat: Boat) {
    setLoading(true);
    setError('');

    // Check if boat already participating
    if (sharedReservation?.participants.some(p => p.boat.id === boat.id)) {
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
      const response = await fetch(`/api/shared-reservations/${sharedId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boatId: selectedBoat.id,
          adults,
          kids,
        }),
      });

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
    const malesStart = sharedReservation.genderOrder === 'MALES_FIRST' ? startTime : new Date(startTime.getTime() + sharedReservation.femalesDurationHours * 60 * 60 * 1000);
    const femalesStart = sharedReservation.genderOrder === 'FEMALES_FIRST' ? startTime : new Date(startTime.getTime() + sharedReservation.malesDurationHours * 60 * 60 * 1000);
    
    const malesEnd = new Date(malesStart.getTime() + sharedReservation.malesDurationHours * 60 * 60 * 1000);
    const femalesEnd = new Date(femalesStart.getTime() + sharedReservation.femalesDurationHours * 60 * 60 * 1000);

    return `Women: ${formatTime(femalesStart)} - ${formatTime(femalesEnd)}\nMen: ${formatTime(malesStart)} - ${formatTime(malesEnd)}`;
  }

  if (!sharedReservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared sauna...</p>
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
            onClick={() => router.push(`/app/islands/${islandId}`)}
            className="mb-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Join Shared Sauna</h1>
          <p className="text-gray-500">{sharedReservation.name || 'Shared Sauna'}</p>
        </div>
      </header>

      {/* Progress Indicator */}
      {step !== 'details' && (
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between max-w-md mx-auto">
              <StepIndicator 
                active={step === 'boat'} 
                completed={['party-size', 'confirm', 'success'].includes(step)} 
                number={1} 
                label="Boat" 
              />
              <div className="flex-1 h-0.5 bg-gray-200 mx-2">
                <div className={`h-full transition-all ${['party-size', 'confirm', 'success'].includes(step) ? 'bg-purple-600' : 'bg-gray-200'}`} />
              </div>
              <StepIndicator 
                active={step === 'party-size'} 
                completed={['confirm', 'success'].includes(step)} 
                number={2} 
                label="Party" 
              />
              <div className="flex-1 h-0.5 bg-gray-200 mx-2">
                <div className={`h-full transition-all ${['confirm', 'success'].includes(step) ? 'bg-purple-600' : 'bg-gray-200'}`} />
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
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Step 0: Shared Reservation Details */}
        {step === 'details' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-purple-600" />
                {sharedReservation.name || 'Shared Sauna'}
              </CardTitle>
              <CardDescription>{sharedReservation.sauna.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Schedule */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-purple-900">Schedule</span>
                </div>
                <div className="text-sm text-purple-800 whitespace-pre-line">
                  {getGenderSchedule()}
                </div>
              </div>

              {/* Participants */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">
                  Current Participants ({sharedReservation.participants.length})
                </h3>
                {sharedReservation.participants.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No participants yet - be the first!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sharedReservation.participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3"
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
                          {participant.adults} {participant.adults === 1 ? 'adult' : 'adults'}
                          {participant.kids > 0 && `, ${participant.kids} ${participant.kids === 1 ? 'kid' : 'kids'}`}
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
              <CardDescription>Search by boat name or membership number</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search boats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {boats.map((boat) => (
                  <button
                    key={boat.id}
                    onClick={() => handleBoatSelect(boat)}
                    disabled={loading}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors disabled:opacity-50"
                  >
                    <div className="font-medium text-gray-900">{boat.name}</div>
                    {boat.captainName && (
                      <div className="text-sm text-gray-600">Captain: {boat.captainName}</div>
                    )}
                    <div className="text-sm text-gray-500">#{boat.membershipNumber}</div>
                  </button>
                ))}
                {searchQuery.length >= 2 && boats.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No boats found</p>
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
              <CardDescription>How many people will be using the sauna?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-medium text-gray-900">{selectedBoat.name}</div>
                <div className="text-sm text-gray-500">#{selectedBoat.membershipNumber}</div>
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
                <Button variant="outline" onClick={() => setStep('boat')} className="flex-1">
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
              <CardDescription>Review your details before joining</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <div className="text-sm text-gray-500">Shared Sauna</div>
                  <div className="font-medium">{sharedReservation.name || 'Shared Sauna'}</div>
                  <div className="text-sm text-gray-600">{sharedReservation.sauna.name}</div>
                </div>

                <div className="border-b pb-3">
                  <div className="text-sm text-gray-500">Schedule</div>
                  <div className="text-sm text-gray-900 whitespace-pre-line mt-1">
                    {getGenderSchedule()}
                  </div>
                </div>

                <div className="border-b pb-3">
                  <div className="text-sm text-gray-500">Boat</div>
                  <div className="font-medium">{selectedBoat.name}</div>
                  {selectedBoat.captainName && (
                    <div className="text-sm text-gray-600">Captain: {selectedBoat.captainName}</div>
                  )}
                  <div className="text-sm text-gray-500">#{selectedBoat.membershipNumber}</div>
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
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('party-size')} className="flex-1">
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
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Joined Successfully!</h2>
              <p className="text-gray-600 mb-6">You&apos;re now part of this shared sauna</p>

              <div className="bg-purple-50 rounded-lg p-6 mb-6 text-left max-w-sm mx-auto">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-purple-700">Event:</span>
                    <div className="font-medium text-purple-900">
                      {sharedReservation.name || 'Shared Sauna'}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-purple-700">Schedule:</span>
                    <div className="text-sm text-purple-900 whitespace-pre-line">
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

function StepIndicator({ active, completed, number, label }: { active: boolean; completed: boolean; number: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
        completed ? 'bg-purple-600 text-white' : active ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
      }`}>
        {completed ? <Check className="w-5 h-5" /> : number}
      </div>
      <span className="text-xs mt-1 text-gray-600">{label}</span>
    </div>
  );
}