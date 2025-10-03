'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Upload, Download, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface Club {
  id: string
  name: string
}

interface ImportResult {
  success: boolean
  imported: number
  failed: number
  errors?: string[]
}

export default function ImportBoatsPage() {
  const router = useRouter()
  const [clubs, setClubs] = useState<Club[]>([])
  const [clubId, setClubId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

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
        setClubId(data[0].id)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load clubs')
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        alert('Please select a CSV file')
        e.target.value = ''
        return
      }
      setFile(selectedFile)
      setResult(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!file) {
      alert('Please select a CSV file')
      return
    }

    if (!clubId) {
      alert('Please select a club')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('clubId', clubId)

      const response = await fetch('/api/boats/bulk-import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import boats')
      }

      setResult(data)
      setFile(null)

      // Reset file input
      const fileInput = document.getElementById('csvFile') as HTMLInputElement
      if (fileInput) fileInput.value = ''

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to import boats')
    } finally {
      setLoading(false)
    }
  }

  function downloadTemplate() {
    const csv = `name,membershipNumber,captainName,phoneNumber
Sea Spirit,HSC-001,John Smith,+358 40 123 4567
Wave Dancer,HSC-002,Jane Doe,+358 50 234 5678
Blue Horizon,HSC-003,Bob Johnson,`

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'boats-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card className="p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">Import Boats from CSV</h1>
        <p className="text-gray-600 mb-6">
          Upload a CSV file to bulk import boats into your club
        </p>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            CSV Format Requirements
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
            <li>First row must contain headers: name, membershipNumber, captainName, phoneNumber</li>
            <li><strong>name</strong> and <strong>membershipNumber</strong> are required</li>
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
            <Download className="w-4 h-4 mr-2" />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
            {file && (
              <p className="text-sm text-green-600 mt-2 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1" />
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
              <Upload className="w-4 h-4 mr-2" />
              {loading ? 'Importing...' : 'Import Boats'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Import Results */}
      {result && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            {result.success ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-green-600 mr-2" />
                Import Completed
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-red-600 mr-2" />
                Import Failed
              </>
            )}
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-green-800 font-medium">Successfully imported:</span>
              <span className="text-green-900 font-bold text-lg">{result.imported}</span>
            </div>

            {result.failed > 0 && (
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-red-800 font-medium">Failed:</span>
                <span className="text-red-900 font-bold text-lg">{result.failed}</span>
              </div>
            )}

            {result.errors && result.errors.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-red-800 mb-2">Errors:</h3>
                <ul className="space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-start">
                      <XCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
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
  )
}
