/**
 * Reservation Summary Component
 *
 * Reusable reservation confirmation UI used in both online and offline flows.
 */

import { Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils';
import type { Boat } from '@/hooks/use-boats';

interface ReservationSummaryProps {
  saunaName: string;
  startTime: string;
  boat: Boat;
  adults: number;
  kids: number;
  onBack: () => void;
  onConfirm: () => void;
  loading?: boolean;
  error?: string | null;
}

export function ReservationSummary({
  saunaName,
  startTime,
  boat,
  adults,
  kids,
  onBack,
  onConfirm,
  loading = false,
  error,
}: ReservationSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Time Display */}
      <div className="from-club-primary/10 to-club-secondary/10 border-club-primary/20 rounded-xl border-2 bg-gradient-to-br p-5">
        <div className="mb-1 flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          Time
        </div>
        <div className="text-club-primary text-2xl font-bold">
          {formatTime(startTime)}
        </div>
        <div className="mt-1 text-sm text-gray-600">Duration: 1 hour</div>
      </div>

      {/* Details */}
      <div className="space-y-4">
        <div className="border-b-2 border-gray-100 pb-4">
          <div className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Sauna
          </div>
          <div className="mt-1 text-lg font-semibold text-gray-900">
            {saunaName}
          </div>
        </div>

        <div className="border-b-2 border-gray-100 pb-4">
          <div className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Boat
          </div>
          <div className="mt-1 text-lg font-semibold text-gray-900">
            {boat.name}
          </div>
          {boat.captainName && (
            <div className="mt-1 text-sm text-gray-600">
              Captain: {boat.captainName}
            </div>
          )}
          <div className="text-club-primary mt-1 text-sm font-medium">
            #{boat.membershipNumber}
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Party Size
          </div>
          <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Users className="text-club-primary h-5 w-5" />
            {adults} {adults === 1 ? 'adult' : 'adults'}
            {kids > 0 && `, ${kids} ${kids === 1 ? 'kid' : 'kids'}`}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="rounded-lg border-2 border-red-200 bg-red-50 p-4"
          data-testid="reservation-error"
        >
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-12 flex-1 border-2"
          disabled={loading}
        >
          Back
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          className="bg-club-primary hover:bg-club-primary/90 h-12 flex-1 font-semibold text-white shadow-lg"
          data-testid="confirm-reservation-button"
        >
          {loading ? 'Creating...' : 'Confirm Reservation'}
        </Button>
      </div>
    </div>
  );
}
