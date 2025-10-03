'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Pencil, Trash2, Flame, CheckCircle2, XCircle } from 'lucide-react'

interface Sauna {
  id: string
  name: string
  heatingTimeHours: number
  autoClubSaunaEnabled: boolean
  island: {
    id: string
    name: string
    club: {
      name: string
    }
  }
}

export default function SaunasPage() {
  const router = useRouter()
  const [saunas, setSaunas] = useState<Sauna[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSaunas()
  }, [])

  async function fetchSaunas() {
    try {
      setLoading(true)
      const response = await fetch('/api/saunas')
      if (!response.ok) throw new Error('Failed to fetch saunas')
      const data = await response.json()
      setSaunas(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all reservations for this sauna.`)) {
      return
    }

    try {
      const response = await fetch(`/api/saunas/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete sauna')

      await fetchSaunas()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete sauna')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading saunas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={() => fetchSaunas()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Saunas</h1>
          <p className="text-gray-600 mt-2">
            Manage saunas and their configurations
          </p>
        </div>
        <Button onClick={() => router.push('/admin/saunas/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Sauna
        </Button>
      </div>

      {saunas.length === 0 ? (
        <Card className="p-12 text-center">
          <Flame className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No saunas yet</h3>
          <p className="text-gray-600 mb-6">
            Get started by creating your first sauna
          </p>
          <Button onClick={() => router.push('/admin/saunas/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Sauna
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {saunas.map((sauna) => (
            <Card key={sauna.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{sauna.name}</h3>
                  <p className="text-sm text-gray-600">
                    {sauna.island.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {sauna.island.club.name}
                  </p>
                </div>
                <Flame className="w-5 h-5 text-orange-600" />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Heating time:</span>
                  <span className="font-medium">{sauna.heatingTimeHours}h</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-600">Auto Club Sauna:</span>
                  {sauna.autoClubSaunaEnabled ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Enabled
                    </span>
                  ) : (
                    <span className="flex items-center text-gray-400">
                      <XCircle className="w-4 h-4 mr-1" />
                      Disabled
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/admin/saunas/${sauna.id}/edit`)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(sauna.id, sauna.name)}
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
