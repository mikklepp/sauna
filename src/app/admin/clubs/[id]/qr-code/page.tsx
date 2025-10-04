'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Download } from 'lucide-react'
import QRCode from 'qrcode'

interface Club {
  id: string
  name: string
  secret: string
  secretValidFrom: string
  secretValidUntil: string
}

export default function ClubQRCodePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [club, setClub] = useState<Club | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

  const fetchClub = useCallback(async () => {
    try {
      const response = await fetch(`/api/clubs/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch club')
      const data = await response.json()
      setClub(data)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load club')
      router.push('/admin/clubs')
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  const generateQRCode = useCallback(async () => {
    if (!club) return

    try {
      const qrData = JSON.stringify({
        clubId: club.id,
        secret: club.secret,
      })

      const url = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      setQrCodeUrl(url)
    } catch (err) {
      // QR code generation failed silently
    }
  }, [club])

  useEffect(() => {
    fetchClub()
  }, [fetchClub])

  useEffect(() => {
    if (club) {
      generateQRCode()
    }
  }, [club, generateQRCode])

  function downloadQRCode() {
    if (!qrCodeUrl || !club) return

    const link = document.createElement('a')
    link.download = `${club.name.replace(/\s+/g, '-').toLowerCase()}-qr-code.png`
    link.href = qrCodeUrl
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!club) {
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
        <h1 className="text-2xl font-bold mb-2">{club.name} - QR Code</h1>
        <p className="text-gray-600 mb-6">
          Use this QR code to configure Island Devices
        </p>

        <div className="flex flex-col items-center space-y-6">
          {qrCodeUrl && (
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
              <img src={qrCodeUrl} alt="Club QR Code" className="w-96 h-96" />
            </div>
          )}

          <div className="w-full bg-gray-50 border border-gray-200 rounded-md p-4">
            <h3 className="font-semibold mb-2">Secret Information</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Secret:</strong>{' '}
                <code className="bg-white px-2 py-1 rounded border">{club.secret}</code>
              </p>
              <p><strong>Valid From:</strong> {new Date(club.secretValidFrom).toLocaleString()}</p>
              <p><strong>Valid Until:</strong> {new Date(club.secretValidUntil).toLocaleString()}</p>
            </div>
          </div>

          <Button onClick={downloadQRCode} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download QR Code
          </Button>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 w-full">
            <h3 className="font-semibold text-blue-900 mb-2">How to use this QR Code</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Open the Island Device app on a tablet or mobile device</li>
              <li>Scan this QR code with the device camera</li>
              <li>The device will automatically configure with the club credentials</li>
              <li>Select the island to complete the setup</li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  )
}
