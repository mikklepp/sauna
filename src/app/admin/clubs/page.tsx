'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Edit, Trash2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Island {
  id: string;
  name: string;
}

interface Boat {
  id: string;
  name: string;
}

interface Club {
  id: string;
  name: string;
  secret: string;
  secretValidFrom: string;
  secretValidUntil: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  timezone: string;
  islands: Island[];
  boats: Boat[];
}

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubs();
  }, []);

  async function fetchClubs() {
    try {
      const response = await fetch('/api/clubs');
      if (response.ok) {
        const data = await response.json();
        setClubs(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch clubs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteClub(id: string) {
    if (!confirm('Are you sure you want to delete this club?')) return;

    try {
      const response = await fetch(`/api/clubs/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setClubs(clubs.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete club:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clubs</h1>
          <p className="text-gray-500 mt-2">
            Manage clubs and their configurations
          </p>
        </div>
        <Button onClick={() => window.location.href = '/admin/clubs/new'}>
          <Plus className="w-4 h-4 mr-2" />
          Create Club
        </Button>
      </div>

      {clubs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">No clubs yet</p>
          <Button onClick={() => window.location.href = '/admin/clubs/new'}>
            Create Your First Club
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Secret
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid Until
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Islands
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Boats
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clubs.map((club) => (
                <tr key={club.id} className="hover:bg-gray-50" data-testid="club-item">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {club.logoUrl && (
                        <Image
                          src={club.logoUrl}
                          alt={club.name}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded mr-3"
                          unoptimized
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {club.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {club.timezone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      {club.secret}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(club.secretValidUntil).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {club.islands.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {club.boats.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = `/admin/clubs/${club.id}/qr-code`}
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = `/admin/clubs/${club.id}/edit`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteClub(club.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}