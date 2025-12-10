/**
 * Boat Search Component
 *
 * Reusable boat search UI used in both online and offline reservation flows.
 */

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Boat } from '@/hooks/use-boats';

interface BoatSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  boats: Boat[];
  onBoatSelect: (boat: Boat) => void;
  loading?: boolean;
  error?: string | null;
}

export function BoatSearch({
  searchQuery,
  onSearchChange,
  boats,
  onBoatSelect,
  loading = false,
  error,
}: BoatSearchProps) {
  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search boats..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="focus:border-club-primary h-12 border-2 pl-11 text-base"
          data-testid="boat-search-input"
          aria-label="Boat name or membership number"
          autoFocus
        />
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

      {/* Search Results */}
      <div className="max-h-96 space-y-3 overflow-y-auto">
        {boats.map((boat) => (
          <button
            key={boat.id}
            onClick={() => onBoatSelect(boat)}
            disabled={loading}
            className="hover:border-club-primary hover:bg-club-primary/5 w-full rounded-xl border-2 border-gray-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="boat-result"
          >
            <div className="text-lg font-semibold text-gray-900">
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
          </button>
        ))}

        {/* Empty States */}
        {searchQuery.length >= 2 && boats.length === 0 && !loading && (
          <div className="py-12 text-center">
            <p className="text-lg text-gray-500">No boats found</p>
            <p className="mt-2 text-sm text-gray-400">
              Try a different search term
            </p>
          </div>
        )}

        {searchQuery.length < 2 && (
          <div className="py-12 text-center">
            <Search className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">Start typing to search boats</p>
          </div>
        )}

        {loading && (
          <div className="py-12 text-center">
            <div className="border-club-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        )}
      </div>
    </div>
  );
}
