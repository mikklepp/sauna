'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'

interface Club {
  id: string
  name: string
}

export default function NewBoatPage() {
  const router = useRouter()
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    membershipNumber: '',
    clubId: '',
    captainName: '',
    phoneNumber: '',
  })

  useEffect(() => {
    fetchClubs()
  }, [])

  async function fetchClubs() {
    try {
      const response = await fetch('/api/clubs')
      if (!response.ok) throw new Error('Failed to fetch clubs')
      const data = await response.json()
      setClubs(data)
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, clubId: data[0].id }))
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load clubs')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Please enter a boat name')
      return
    }

    if (!formData.membershipNumber.trim()) {
      alert('Please enter a membership number')
      return
    }

    if (!formData.clubId) {
      alert('Please select a club')
      return
    }

    setLoading(true)

    try {
      const payload = {
        ...formData,
        captainName: formData.captainName.trim() || null,
        phoneNumber: formData.phoneNumber.trim() || null,
      }

      const response = await fetch('/api/boats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create boat')
      }

      router.push('/admin/boats')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create boat')
      setLoading(false)
    }
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
        <h1 className="text-2xl font-bold mb-6">Add New Boat</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Boat Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Sea Spirit"
              required
            />
          </div>

          <div>
            <Label htmlFor="membershipNumber">Membership Number *</Label>
            <Input
              id="membershipNumber"
              value={formData.membershipNumber}
              onChange={(e) => setFormData({ ...formData, membershipNumber: e.target.value })}
              placeholder="e.g., HSC-001"
              required
            />
            <p className="text-sm text-gray-600 mt-2">
              Must be unique within the club.
            </p>
          </div>

          <div>
            <Label htmlFor="clubId">Club *</Label>
            <select
              id="clubId"
              value={formData.clubId}
              onChange={(e) => setFormData({ ...formData, clubId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a club</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
            {clubs.length === 0 && (
              <p className="text-sm text-amber-600 mt-2">
                No clubs available. Please create a club first.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="captainName">Captain Name (Optional)</Label>
            <Input
              id="captainName"
              value={formData.captainName}
              onChange={(e) => setFormData({ ...formData, captainName: e.target.value })}
              placeholder="e.g., John Smith"
            />
          </div>

          <div>
            <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="e.g., +358 40 123 4567"
            />
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
              disabled={loading || clubs.length === 0}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create Boat'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
