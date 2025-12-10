/**
 * Party Size Form Component
 *
 * Reusable party size input UI used in both online and offline reservation flows.
 */

import { Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { Boat } from '@/hooks/use-boats';

interface PartySizeFormProps {
  boat: Boat;
  adults: number;
  kids: number;
  onAdultsChange: (value: number) => void;
  onKidsChange: (value: number) => void;
  onBack: () => void;
  onContinue: () => void;
  loading?: boolean;
}

export function PartySizeForm({
  boat,
  adults,
  kids,
  onAdultsChange,
  onKidsChange,
  onBack,
  onContinue,
  loading = false,
}: PartySizeFormProps) {
  return (
    <div className="space-y-6">
      {/* Selected Boat Display */}
      <div className="border-club-primary/20 from-club-primary/5 to-club-primary/10 rounded-xl border-2 bg-gradient-to-br p-5">
        <div className="text-lg font-semibold text-gray-900">{boat.name}</div>
        {boat.captainName && (
          <div className="text-sm text-gray-600">
            Captain: {boat.captainName}
          </div>
        )}
        <div className="text-club-primary text-sm font-medium">
          #{boat.membershipNumber}
        </div>
      </div>

      {/* Party Size Inputs */}
      <div className="space-y-5">
        <div>
          <Label htmlFor="adults" className="text-base font-semibold">
            Adults *
          </Label>
          <Input
            id="adults"
            type="number"
            min="1"
            max="15"
            value={adults}
            onChange={(e) =>
              onAdultsChange(Math.max(1, parseInt(e.target.value) || 1))
            }
            className="focus:border-club-primary mt-2 h-12 border-2 text-base"
          />
        </div>

        <div>
          <Label htmlFor="kids" className="text-base font-semibold">
            Kids (optional)
          </Label>
          <Input
            id="kids"
            type="number"
            min="0"
            max="15"
            value={kids}
            onChange={(e) =>
              onKidsChange(Math.max(0, parseInt(e.target.value) || 0))
            }
            className="focus:border-club-primary mt-2 h-12 border-2 text-base"
          />
        </div>
      </div>

      {/* Total Display */}
      <div className="from-club-primary/10 to-club-secondary/10 border-club-primary/20 rounded-xl border-2 bg-gradient-to-br p-4">
        <div className="flex items-center gap-3">
          <Users className="text-club-primary h-6 w-6" />
          <div>
            <div className="text-sm text-gray-600">Total Party Size</div>
            <div className="text-lg font-bold text-gray-900">
              {adults} {adults === 1 ? 'adult' : 'adults'}
              {kids > 0 && `, ${kids} ${kids === 1 ? 'kid' : 'kids'}`}
            </div>
          </div>
        </div>
      </div>

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
          onClick={onContinue}
          disabled={adults < 1 || loading}
          className="bg-club-primary hover:bg-club-primary/90 h-12 flex-1 font-semibold text-white"
          data-testid="continue-button"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
