'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Download, BarChart3, TrendingUp, Ship } from 'lucide-react';

interface Club {
  id: string;
  name: string;
}

interface Sauna {
  id: string;
  name: string;
  island: { name: string };
}

interface Boat {
  id: string;
  name: string;
  membershipNumber: string;
}

interface SaunaReport {
  totalIndividualReservations: number;
  totalSharedReservations: number;
  totalAdultsIndividual: number;
  totalKidsIndividual: number;
  totalAdultsShared: number;
  totalKidsShared: number;
  uniqueBoatsIndividual: number;
  uniqueBoatsShared: number;
  uniqueBoatsTotal: number;
}

interface BoatReport {
  individualReservations: number;
  sharedReservationsCount: number;
  totalAdults: number;
  totalKids: number;
}

export default function ReportsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [saunas, setSaunas] = useState<Sauna[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [reportType, setReportType] = useState<'sauna' | 'boat' | 'club'>(
    'sauna'
  );
  const [selectedClubId, setSelectedClubId] = useState('');
  const [selectedSaunaId, setSelectedSaunaId] = useState('');
  const [selectedBoatId, setSelectedBoatId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<SaunaReport | BoatReport | null>(
    null
  );

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchSaunas = useCallback(async () => {
    try {
      const response = await fetch('/api/saunas');
      if (!response.ok) throw new Error('Failed to fetch saunas');
      const data = await response.json();
      const clubSaunas = data.filter(
        (s: Sauna) => s.island && clubs.find((c) => c.id === selectedClubId)
      );
      setSaunas(clubSaunas);
      if (clubSaunas.length > 0) {
        setSelectedSaunaId(clubSaunas[0].id);
      }
    } catch (err) {
      // Failed to load saunas
    }
  }, [clubs, selectedClubId]);

  const fetchBoats = useCallback(async () => {
    try {
      const response = await fetch(`/api/clubs/${selectedClubId}/boats`);
      if (!response.ok) throw new Error('Failed to fetch boats');
      const data = await response.json();
      setBoats(data);
      if (data.length > 0) {
        setSelectedBoatId(data[0].id);
      }
    } catch (err) {
      // Failed to load boats
    }
  }, [selectedClubId]);

  useEffect(() => {
    if (selectedClubId) {
      fetchSaunas();
      fetchBoats();
    }
  }, [selectedClubId, fetchSaunas, fetchBoats]);

  async function fetchClubs() {
    try {
      const response = await fetch('/api/clubs');
      if (!response.ok) throw new Error('Failed to fetch clubs');
      const data = await response.json();
      setClubs(data);
      if (data.length > 0) {
        setSelectedClubId(data[0].id);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load clubs');
    }
  }

  async function generateReport() {
    setLoading(true);
    setReportData(null);

    try {
      let url = '';
      if (reportType === 'sauna' && selectedSaunaId) {
        url = `/api/reports/sauna/${selectedSaunaId}?year=${year}`;
      } else if (reportType === 'boat' && selectedBoatId) {
        url = `/api/reports/boat/${selectedBoatId}?year=${year}`;
      } else if (reportType === 'club' && selectedClubId) {
        url = `/api/reports/club/${selectedClubId}?year=${year}`;
      }

      if (!url) {
        alert('Please select all required fields');
        setLoading(false);
        return;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to generate report');
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }

  async function exportReport(format: 'csv' | 'pdf') {
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: reportType,
          id:
            reportType === 'sauna'
              ? selectedSaunaId
              : reportType === 'boat'
                ? selectedBoatId
                : selectedClubId,
          year,
          format,
        }),
      });

      if (!response.ok) throw new Error('Failed to export report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${year}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export report');
    }
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="mt-2 text-gray-600">
          Generate annual usage reports and statistics
        </p>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="mb-2 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <h3 className="font-semibold">Sauna Reports</h3>
          </div>
          <p className="text-sm text-gray-600">
            View usage statistics per sauna including individual and shared
            reservations
          </p>
        </Card>

        <Card className="p-6">
          <div className="mb-2 flex items-center gap-3">
            <Ship className="h-8 w-8 text-green-600" />
            <h3 className="font-semibold">Boat Reports</h3>
          </div>
          <p className="text-sm text-gray-600">
            Track reservation history and usage patterns per boat
          </p>
        </Card>

        <Card className="p-6">
          <div className="mb-2 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <h3 className="font-semibold">Club Reports</h3>
          </div>
          <p className="text-sm text-gray-600">
            Aggregate statistics across all islands and saunas in the club
          </p>
        </Card>
      </div>

      <Card className="mb-6 p-6">
        <h2 className="mb-6 text-xl font-bold">Generate Report</h2>

        <div className="space-y-6">
          {/* Report Type Selection */}
          <div>
            <Label>Report Type</Label>
            <div className="mt-2 flex gap-2">
              <Button
                variant={reportType === 'sauna' ? 'default' : 'outline'}
                onClick={() => setReportType('sauna')}
              >
                Sauna
              </Button>
              <Button
                variant={reportType === 'boat' ? 'default' : 'outline'}
                onClick={() => setReportType('boat')}
              >
                Boat
              </Button>
              <Button
                variant={reportType === 'club' ? 'default' : 'outline'}
                onClick={() => setReportType('club')}
              >
                Club
              </Button>
            </div>
          </div>

          {/* Year Selection */}
          <div>
            <Label htmlFor="year">Year</Label>
            <select
              id="year"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Club Selection (always shown) */}
          <div>
            <Label htmlFor="club">Club</Label>
            <select
              id="club"
              value={selectedClubId}
              onChange={(e) => setSelectedClubId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a club</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sauna Selection (conditional) */}
          {reportType === 'sauna' && (
            <div>
              <Label htmlFor="sauna">Sauna</Label>
              <select
                id="sauna"
                value={selectedSaunaId}
                onChange={(e) => setSelectedSaunaId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a sauna</option>
                {saunas.map((sauna) => (
                  <option key={sauna.id} value={sauna.id}>
                    {sauna.name} ({sauna.island.name})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Boat Selection (conditional) */}
          {reportType === 'boat' && (
            <div>
              <Label htmlFor="boat">Boat</Label>
              <select
                id="boat"
                value={selectedBoatId}
                onChange={(e) => setSelectedBoatId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a boat</option>
                {boats.map((boat) => (
                  <option key={boat.id} value={boat.id}>
                    {boat.name} ({boat.membershipNumber})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            onClick={generateReport}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </Card>

      {/* Report Results */}
      {reportData && (
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">Report Results - {year}</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReport('csv')}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReport('pdf')}
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>

          {reportType === 'sauna' &&
            'totalIndividualReservations' in reportData && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-700">
                    Individual Reservations
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {reportData.totalIndividualReservations}
                  </p>
                  <p className="mt-1 text-xs text-blue-600">For invoicing</p>
                </div>

                <div className="rounded-lg bg-purple-50 p-4">
                  <p className="text-sm font-medium text-purple-700">
                    Shared Reservations
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {reportData.totalSharedReservations}
                  </p>
                  <p className="mt-1 text-xs text-purple-600">Not invoiced</p>
                </div>

                <div className="rounded-lg bg-green-50 p-4">
                  <p className="text-sm font-medium text-green-700">
                    Unique Boats (Total)
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {reportData.uniqueBoatsTotal}
                  </p>
                  <p className="mt-1 text-xs text-green-600">
                    Individual: {reportData.uniqueBoatsIndividual}, Shared:{' '}
                    {reportData.uniqueBoatsShared}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-700">
                    Adults (Individual)
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reportData.totalAdultsIndividual}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-700">
                    Kids (Individual)
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reportData.totalKidsIndividual}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-700">
                    Adults (Shared)
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reportData.totalAdultsShared}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-700">
                    Kids (Shared)
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reportData.totalKidsShared}
                  </p>
                </div>
              </div>
            )}

          {reportType === 'boat' && 'individualReservations' in reportData && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-700">
                  Individual Reservations
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {reportData.individualReservations}
                </p>
                <p className="mt-1 text-xs text-blue-600">For invoicing</p>
              </div>

              <div className="rounded-lg bg-purple-50 p-4">
                <p className="text-sm font-medium text-purple-700">
                  Shared Participations
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {reportData.sharedReservationsCount}
                </p>
                <p className="mt-1 text-xs text-purple-600">Not invoiced</p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-700">
                  Total Adults
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData.totalAdults}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-700">Total Kids</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData.totalKids}
                </p>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
