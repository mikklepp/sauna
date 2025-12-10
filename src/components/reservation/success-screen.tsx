/**
 * Success Screen Component
 *
 * Reusable reservation success UI used in both online and offline flows.
 */

import { Check, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils';
import type { Boat } from '@/hooks/use-boats';

interface SuccessScreenProps {
  saunaName: string;
  startTime: string;
  boat: Boat;
  adults: number;
  kids: number;
  onViewReservations: () => void;
  onBackToSaunas: () => void;
  onMakeAnother?: () => void;
  showSyncStatus?: React.ReactNode;
}

export function SuccessScreen({
  saunaName,
  startTime,
  boat,
  adults,
  kids,
  onViewReservations,
  onBackToSaunas,
  onMakeAnother,
  showSyncStatus,
}: SuccessScreenProps) {
  return (
    <div className="py-12 text-center">
      {/* Success Icon */}
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg">
        <Check className="h-10 w-10 text-white" strokeWidth={3} />
      </div>

      {/* Title */}
      <h2
        className="mb-3 bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-3xl font-bold text-transparent"
        data-testid="success-title"
      >
        Reservation Confirmed!
      </h2>
      <p className="mb-8 text-lg text-gray-600">
        Your sauna is ready and waiting
      </p>

      {/* Reservation Summary */}
      <div className="border-club-primary/20 from-club-primary/5 to-club-secondary/10 mx-auto mb-8 max-w-sm rounded-2xl border-2 bg-gradient-to-br p-6 text-left shadow-lg">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              <Calendar className="h-4 w-4" />
              Time
            </div>
            <div className="text-club-primary mt-1 text-2xl font-bold">
              {formatTime(startTime)}
            </div>
          </div>
          <div className="border-t-2 border-gray-200 pt-3">
            <span className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Duration
            </span>
            <div className="text-lg font-semibold text-gray-900">1 hour</div>
          </div>
          <div className="border-t-2 border-gray-200 pt-3">
            <span className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Sauna
            </span>
            <div className="text-lg font-semibold text-gray-900">
              {saunaName}
            </div>
          </div>
          <div className="border-t-2 border-gray-200 pt-3">
            <span className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Boat
            </span>
            <div className="text-lg font-semibold text-gray-900">
              {boat.name}
            </div>
          </div>
          <div className="border-t-2 border-gray-200 pt-3">
            <span className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Party
            </span>
            <div className="text-lg font-semibold text-gray-900">
              {adults + kids} {adults + kids === 1 ? 'person' : 'people'}
            </div>
          </div>
        </div>
      </div>

      {/* Sync Status (offline mode only) */}
      {showSyncStatus && (
        <div className="mx-auto mb-6 max-w-sm">{showSyncStatus}</div>
      )}

      {/* Actions */}
      <div className="mx-auto max-w-sm space-y-3">
        <Button
          onClick={onBackToSaunas}
          className="bg-club-primary hover:bg-club-primary/90 h-12 w-full font-semibold text-white shadow-lg"
        >
          Back to Saunas
        </Button>
        <Button
          variant="outline"
          onClick={onViewReservations}
          className="border-club-primary/30 text-club-primary hover:bg-club-primary/5 h-12 w-full border-2"
        >
          View All Reservations
        </Button>
        {onMakeAnother && (
          <Button
            variant="ghost"
            onClick={onMakeAnother}
            className="h-12 w-full text-gray-600"
          >
            Make Another Reservation
          </Button>
        )}
      </div>
    </div>
  );
}
