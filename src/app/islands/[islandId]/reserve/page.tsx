'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ChevronLeft, Search, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatTime } from '@/lib/utils';

type Step = 'boat' | 'party-size' | 'confirm' | 'success';

interface Boat {
  id: string;
  name: string;
  membershipNumber: string;
  captainName: string | null;
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
  const [saunaInfo, setSaunaInfo] = useState<any>(null);

  useEffect(() => {
    fetchSaunaInfo();
  }, [saunaId]);

  async function fetchSaunaInfo() {
    try {
      const response = await fetch(`/api/saunas/${saunaId}/next-available`);
      if (response.ok) {
        const data = await response.json();
        setSaunaInfo(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch sauna info:', error);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/islands/${islandId}`)}
            className="mb-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Make Reservation</h1>
          {saunaInfo && (
            <p className="text-gray-500">{saunaInfo.sauna.name}</p>
          )}
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <StepIndicator active={step === 'boat'} completed={['party-size', 'confirm', 'success'].includes(step)} number={1} label="Boat" />
            <div className="flex-1 h-0.5 bg-gray-200 mx-2">
              <div className={`h-full transition-all ${['party-size', 'confirm', 'success'].includes(step) ? 'bg-blue-600' : 'bg-gray-200'}`} />
            </div>
            <StepIndicator active={step === 'party-size'} completed={['confirm', 'success'].includes(step)} number={2} label="Party" />
            <div className="flex-1 h-0.5 bg-gray-200 mx-2">
              <div className={`h-full transition-all ${['confirm', 'success'].includes(step) ? 'bg-blue-600' : 'bg-gray-200'}`} />
            </div>
            <StepIndicator active={step === 'confirm'} completed={step === 'success'} number={3} label="Confirm" />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
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
                  data-testid="boat-search-input"
                  aria-label="Boat name or membership number"
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
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
                    data-testid="boat-result"
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
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && selectedBoat && saunaInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Confirm Reservation</CardTitle>
              <CardDescription>Please review your reservation details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <div className="text-sm text-gray-500">Sauna</div>
                  <div className="font-medium">{saunaInfo.sauna.name}</div>
                </div>

                <div className="border-b pb-3">
                  <div className="text-sm text-gray-500">Time</div>
                  <div className="font-medium text-lg">
                    {formatTime(saunaInfo.nextAvailable.startTime)} - {formatTime(saunaInfo.nextAvailable.endTime)}
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
                  onClick={handleConfirmReservation}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Creating...' : 'Confirm Reservation'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {step === 'success' && selectedBoat && saunaInfo && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="success-title">Reservation Confirmed!</h2>
              <p className="text-gray-600 mb-6">Your sauna is reserved</p>

              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left max-w-sm mx-auto">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Time:</span>
                    <div className="font-medium">{formatTime(saunaInfo.nextAvailable.startTime)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Duration:</span>
                    <div className="font-medium">1 hour</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Sauna:</span>
                    <div className="font-medium">{saunaInfo.sauna.name}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push(`/islands/${islandId}`)}
                  className="w-full max-w-sm"
                >
                  Back to Saunas
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/islands/${islandId}/saunas/${saunaId}/reservations`)}
                  className="w-full max-w-sm"
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

function StepIndicator({ active, completed, number, label }: { active: boolean; completed: boolean; number: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
        completed ? 'bg-blue-600 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
      }`}>
        {completed ? <Check className="w-5 h-5" /> : number}
      </div>
      <span className="text-xs mt-1 text-gray-600">{label}</span>
    </div>
  );
}