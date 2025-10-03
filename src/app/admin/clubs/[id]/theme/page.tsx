'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Upload, Palette, CheckCircle2 } from 'lucide-react'

interface Club {
  id: string
  name: string
  logoUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
}

export default function ClubThemePage() {
  const router = useRouter()
  const params = useParams()
  const clubId = params.id as string

  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    primaryColor: '#1e40af',
    secondaryColor: '#7c3aed',
    logoUrl: null as string | null,
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    fetchClub()
  }, [clubId])

  async function fetchClub() {
    try {
      const response = await fetch(`/api/clubs/${clubId}`)
      if (!response.ok) throw new Error('Failed to fetch club')
      const data = await response.json()
      setClub(data)
      setFormData({
        primaryColor: data.primaryColor || '#1e40af',
        secondaryColor: data.secondaryColor || '#7c3aed',
        logoUrl: data.logoUrl,
      })
      setLogoPreview(data.logoUrl)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load club')
      router.push('/admin/clubs')
    } finally {
      setLoading(false)
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        e.target.value = ''
        return
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB')
        e.target.value = ''
        return
      }

      setLogoFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function uploadLogo(): Promise<string | null> {
    if (!logoFile) return formData.logoUrl

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', logoFile)

      const response = await fetch(`/api/clubs/${clubId}/theme/upload-logo`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to upload logo')

      const data = await response.json()
      return data.url
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload logo')
      return null
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      // Upload logo if there's a new file
      let logoUrl = formData.logoUrl
      if (logoFile) {
        logoUrl = await uploadLogo()
        if (!logoUrl && logoFile) {
          // Upload failed
          setSaving(false)
          return
        }
      }

      // Update theme
      const response = await fetch(`/api/clubs/${clubId}/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          logoUrl,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update theme')
      }

      alert('Theme updated successfully!')
      await fetchClub()
      setLogoFile(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update theme')
    } finally {
      setSaving(false)
    }
  }

  function checkContrast(bgColor: string, fgColor: string = '#ffffff'): boolean {
    // Simple contrast check (WCAG AA requires 4.5:1 for normal text)
    // This is a simplified version
    const getLuminance = (hex: string) => {
      const rgb = parseInt(hex.slice(1), 16)
      const r = (rgb >> 16) & 0xff
      const g = (rgb >> 8) & 0xff
      const b = (rgb >> 0) & 0xff
      const a = [r, g, b].map(v => {
        v /= 255
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
      })
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
    }

    const l1 = getLuminance(bgColor)
    const l2 = getLuminance(fgColor)
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
    return ratio >= 4.5
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading club theme...</p>
      </div>
    )
  }

  if (!club) {
    return null
  }

  const primaryContrast = checkContrast(formData.primaryColor)
  const secondaryContrast = checkContrast(formData.secondaryColor)

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Form Section */}
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-2">Theme Editor</h1>
          <p className="text-gray-600 mb-6">
            Club: {club.name}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload */}
            <div>
              <Label htmlFor="logo">Club Logo</Label>
              <div className="mt-2 space-y-3">
                {logoPreview && (
                  <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="max-h-24 max-w-full object-contain"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="logo"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo')?.click()}
                    disabled={saving || uploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {logoPreview ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                  {logoFile && (
                    <span className="text-sm text-green-600 flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      {logoFile.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Recommended: PNG or SVG, max 2MB
                </p>
              </div>
            </div>

            {/* Primary Color */}
            <div>
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="color"
                  id="primaryColor"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="h-10 w-20 cursor-pointer rounded border border-gray-300"
                />
                <Input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  placeholder="#1e40af"
                  className="flex-1"
                />
              </div>
              {!primaryContrast && (
                <p className="text-xs text-amber-600 mt-1 flex items-center">
                  ⚠️ Low contrast with white text - may not be accessible
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Used for buttons, headers, and primary UI elements
              </p>
            </div>

            {/* Secondary Color */}
            <div>
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="color"
                  id="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="h-10 w-20 cursor-pointer rounded border border-gray-300"
                />
                <Input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  placeholder="#7c3aed"
                  className="flex-1"
                />
              </div>
              {!secondaryContrast && (
                <p className="text-xs text-amber-600 mt-1 flex items-center">
                  ⚠️ Low contrast with white text - may not be accessible
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Used for shared reservations and accent elements
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving || uploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || uploading}
                className="flex-1"
              >
                {saving ? 'Saving...' : uploading ? 'Uploading...' : 'Save Theme'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Preview Section */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            Live Preview
          </h2>

          <div className="space-y-4">
            {/* Logo Preview */}
            {logoPreview && (
              <div className="border rounded-lg p-4 bg-white">
                <p className="text-sm font-medium text-gray-700 mb-2">Navigation Bar</p>
                <div className="flex items-center gap-2">
                  <img src={logoPreview} alt="Logo" className="h-8 object-contain" />
                  <span className="font-semibold">{club.name}</span>
                </div>
              </div>
            )}

            {/* Primary Color Preview */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Primary Button</p>
              <button
                style={{ backgroundColor: formData.primaryColor }}
                className="px-4 py-2 text-white rounded-md font-medium"
              >
                Make Reservation
              </button>
            </div>

            {/* Secondary Color Preview */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Shared Sauna Badge</p>
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border"
                style={{
                  backgroundColor: `${formData.secondaryColor}20`,
                  color: formData.secondaryColor,
                  borderColor: `${formData.secondaryColor}40`,
                }}
              >
                Shared Sauna
              </span>
            </div>

            {/* Card Preview */}
            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Sauna Card</p>
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold mb-2">Main Sauna</h3>
                <p className="text-sm text-gray-600 mb-3">Next available: 18:00</p>
                <button
                  style={{ backgroundColor: formData.primaryColor }}
                  className="w-full px-4 py-2 text-white rounded-md font-medium text-sm"
                >
                  Reserve Now
                </button>
              </div>
            </div>

            {/* Contrast Check Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2">Accessibility Check</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {primaryContrast ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <span className="text-amber-600">⚠️</span>
                  )}
                  <span className={primaryContrast ? 'text-green-700' : 'text-amber-700'}>
                    Primary color contrast: {primaryContrast ? 'Good' : 'Low'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {secondaryContrast ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <span className="text-amber-600">⚠️</span>
                  )}
                  <span className={secondaryContrast ? 'text-green-700' : 'text-amber-700'}>
                    Secondary color contrast: {secondaryContrast ? 'Good' : 'Low'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
