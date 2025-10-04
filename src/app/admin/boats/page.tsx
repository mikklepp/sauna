'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Pencil, Trash2, Ship, Upload, Search } from 'lucide-react'

interface Boat {
  id: string
  name: string
  membershipNumber: string
  captainName: string | null
  phoneNumber: string | null
  club: {
    id: string
    name: string
  }
}

export default function BoatsPage() {
  const router = useRouter()
  const [boats, setBoats] = useState<Boat[]>([])
  const [filteredBoats, setFilteredBoats] = useState<Boat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchBoats()
  }, [])

  useEffect(() => {
    // Filter boats based on search query
    if (!searchQuery.trim()) {
      setFilteredBoats(boats)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredBoats(
        boats.filter(boat =>
          boat.name.toLowerCase().includes(query) ||
          boat.membershipNumber.toLowerCase().includes(query) ||
          boat.captainName?.toLowerCase().includes(query) ||
          boat.club.name.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, boats])

  async function fetchBoats() {
    try {
      setLoading(true)
      const response = await fetch('/api/boats')
      if (!response.ok) throw new Error('Failed to fetch boats')
      const result = await response.json()
      const data = result.data || result
      setBoats(data)
      setFilteredBoats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/boats/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete boat')

      await fetchBoats()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete boat')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading boats...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={() => fetchBoats()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Boats</h1>
          <p className="text-gray-600 mt-2">
            Manage club boats and membership information
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/boats/import')}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={() => router.push("/admin/boats/new")} data-testid="create-boat-button">
            <Plus className="w-4 h-4 mr-2" />
            Add Boat
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search boats by name, membership#, captain, or club..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Showing {filteredBoats.length} of {boats.length} boats
        </p>
      </div>

      {boats.length === 0 ? (
        <Card className="p-12 text-center">
          <Ship className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No boats yet</h3>
          <p className="text-gray-600 mb-6">
            Get started by adding boats manually or importing from CSV
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => router.push('/admin/boats/import')}>
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button onClick={() => router.push("/admin/boats/new")} data-testid="create-boat-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Boat
            </Button>
          </div>
        </Card>
      ) : filteredBoats.length === 0 ? (
        <Card className="p-12 text-center">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search query
          </p>
          <Button onClick={() => setSearchQuery('')}>
            Clear Search
          </Button>
        </Card>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Boat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membership #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Captain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Club
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBoats.map((boat) => (
                <tr key={boat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Ship className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="font-medium text-gray-900">{boat.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {boat.membershipNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {boat.captainName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {boat.phoneNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {boat.club.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/boats/${boat.id}/edit`)}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(boat.id, boat.name)}
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
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
  )
}
