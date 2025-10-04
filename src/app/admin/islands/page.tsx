'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react'

interface Island {
  id: string
  name: string
  numberOfSaunas: number
  club: {
    id: string
    name: string
  }
  _count: {
    saunas: number
  }
}

export default function IslandsPage() {
  const router = useRouter()
  const [islands, setIslands] = useState<Island[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchIslands()
  }, [])

  async function fetchIslands() {
    try {
      setLoading(true)
      const response = await fetch('/api/islands')
      if (!response.ok) throw new Error('Failed to fetch islands')
      const data = await response.json()
      setIslands(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all saunas on this island.`)) {
      return
    }

    try {
      const response = await fetch(`/api/islands/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete island')

      await fetchIslands()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete island')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading islands...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={() => fetchIslands()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Islands</h1>
          <p className="text-gray-600 mt-2">
            Manage islands and their sauna configurations
          </p>
        </div>
        <Button onClick={() => router.push('/admin/islands/new')} data-testid="create-island-button">
          <Plus className="w-4 h-4 mr-2" />
          Add Island
        </Button>
      </div>

      {islands.length === 0 ? (
        <Card className="p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No islands yet</h3>
          <p className="text-gray-600 mb-6">
            Get started by creating your first island
          </p>
          <Button onClick={() => router.push('/admin/islands/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Island
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {islands.map((island) => (
            <Card key={island.id} className="p-6" data-testid="island-item">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{island.name}</h3>
                  <p className="text-sm text-gray-600">
                    {island.club.name}
                  </p>
                </div>
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Configured saunas:</span>
                  <span className="font-medium">{island._count.saunas}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max saunas:</span>
                  <span className="font-medium">{island.numberOfSaunas}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/admin/islands/${island.id}/edit`)}
                  data-testid="edit-island-button"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(island.id, island.name)}
                  data-testid="delete-island-button"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
