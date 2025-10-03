'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'

interface Island {
  id: string
  name: string
  numberOfSaunas: number
  clubId: string
  club: {
    id: string
    name: string
  }
}

export default function EditIslandPage() {
  const router = useRouter()
  const params = useParams()
  const islandId = params.id as string

  const [island, setIsland] = useState<Island | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    numberOfSaunas: 1,
  })

  useEffect(() => {
    fetchIsland()
  }, [islandId])

  async function fetchIsland() {
    try {
      const response = await fetch(`/api/islands/${islandId}`)
      if (!response.ok) throw new Error('Failed to fetch island')
      const data = await response.json()
      setIsland(data)
      setFormData({
        name: data.name,
        numberOfSaunas: data.numberOfSaunas,
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load island')
      router.push('/admin/islands')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Please enter an island name')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/islands/${islandId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update island')
      }

      router.push('/admin/islands')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update island')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading island...</p>
      </div>
    )
  }

  if (!island) {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-2">Edit Island</h1>
        <p className="text-gray-600 mb-6">
          Club: {island.club.name}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Island Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Suomenlinna Island"
              required
            />
          </div>

          <div>
            <Label htmlFor="numberOfSaunas">Number of Saunas *</Label>
            <select
              id="numberOfSaunas"
              value={formData.numberOfSaunas}
              onChange={(e) => setFormData({ ...formData, numberOfSaunas: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="1">1 Sauna</option>
              <option value="2">2 Saunas</option>
              <option value="3">3 Saunas</option>
            </select>
            <p className="text-sm text-gray-600 mt-2">
              This sets the maximum number of saunas that can be configured for this island.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
