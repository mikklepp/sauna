'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface Club {
  id: string;
  name: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors?: string[];
}

export default function ImportBoatsPage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubId, setClubId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    fetchClubs();
  }, []);

  async function fetchClubs() {
    try {
      const response = await fetch('/api/clubs');
      if (!response.ok) throw new Error('Failed to fetch clubs');
      const result = await response.json();
      const data = result.data || result;
      setClubs(data);
      if (data.length > 0) {
        setClubId(data[0].id);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load clubs');
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        alert('Please select a CSV file');
        e.target.value = '';
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      alert('Please select a CSV file');
      return;
    }

    if (!clubId) {
      alert('Please select a club');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clubId', clubId);

      const response = await fetch('/api/boats/bulk-import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import boats');
      }

      setResult(data);
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById('csvFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to import boats');
    } finally {
      setLoading(false);
    }
  }

  function downloadTemplate() {
    const csv = `name,membershipNumber,captainName,phoneNumber
Sea Spirit,HSC-001,John Smith,+358 40 123 4567
Wave Dancer,HSC-002,Jane Doe,+358 50 234 5678
Blue Horizon,HSC-003,Bob Johnson,`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'boats-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="mb-6 p-6">
        <h1 className="mb-2 text-2xl font-bold">Import Boats from CSV</h1>
        <p className="mb-6 text-gray-600">
          Upload a CSV file to bulk import boats into your club
        </p>

        {/* Instructions */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-2 flex items-center font-semibold text-blue-900">
            <AlertCircle className="mr-2 h-4 w-4" />
            CSV Format Requirements
          </h3>
          <ul className="ml-6 list-disc space-y-1 text-sm text-blue-800">
            <li>
              First row must contain headers: name, membershipNumber,
              captainName, phoneNumber
            </li>
            <li>
              <strong>name</strong> and <strong>membershipNumber</strong> are
              required
            </li>
            <li>captainName and phoneNumber are optional</li>
            <li>membershipNumber must be unique within the club</li>
            <li>Use UTF-8 encoding</li>
          </ul>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            className="mt-3"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Template CSV
          </Button>
        </div>

        {/* Import Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="clubId">Select Club *</Label>
            <select
              id="clubId"
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            >
              <option value="">Select a club</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="csvFile">CSV File *</Label>
            <input
              type="file"
              id="csvFile"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
            {file && (
              <p className="mt-2 flex items-center text-sm text-green-600">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Selected: {file.name}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !file || clubs.length === 0}
              className="flex-1"
            >
              <Upload className="mr-2 h-4 w-4" />
              {loading ? 'Importing...' : 'Import Boats'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Import Results */}
      {result && (
        <Card className="p-6">
          <h2 className="mb-4 flex items-center text-xl font-bold">
            {result.success ? (
              <>
                <CheckCircle2 className="mr-2 h-6 w-6 text-green-600" />
                Import Completed
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-6 w-6 text-red-600" />
                Import Failed
              </>
            )}
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
              <span className="font-medium text-green-800">
                Successfully imported:
              </span>
              <span className="text-lg font-bold text-green-900">
                {result.imported}
              </span>
            </div>

            {result.failed > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-red-50 p-3">
                <span className="font-medium text-red-800">Failed:</span>
                <span className="text-lg font-bold text-red-900">
                  {result.failed}
                </span>
              </div>
            )}

            {result.errors && result.errors.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 font-semibold text-red-800">Errors:</h3>
                <ul className="space-y-1">
                  {result.errors.map((error, index) => (
                    <li
                      key={index}
                      className="flex items-start text-sm text-red-700"
                    >
                      <XCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            {result.imported > 0 && (
              <Button
                onClick={() => router.push('/admin/boats')}
                className="flex-1"
              >
                View Boats
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setResult(null)}
              className="flex-1"
            >
              Import More
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
