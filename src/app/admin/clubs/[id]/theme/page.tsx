'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, Palette, CheckCircle2 } from 'lucide-react';

interface Club {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

export default function ClubThemePage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.id as string;

  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    primaryColor: '#1e40af',
    secondaryColor: '#7c3aed',
    logoUrl: null as string | null,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const fetchClub = useCallback(async () => {
    try {
      const response = await fetch(`/api/clubs/${clubId}`);
      if (!response.ok) throw new Error('Failed to fetch club');
      const data = await response.json();
      setClub(data);
      setFormData({
        primaryColor: data.primaryColor || '#1e40af',
        secondaryColor: data.secondaryColor || '#7c3aed',
        logoUrl: data.logoUrl,
      });
      setLogoPreview(data.logoUrl);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load club');
      router.push('/admin/clubs');
    } finally {
      setLoading(false);
    }
  }, [clubId, router]);

  useEffect(() => {
    fetchClub();
  }, [fetchClub]);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        e.target.value = '';
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        e.target.value = '';
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function uploadLogo(): Promise<string | null> {
    if (!logoFile) return formData.logoUrl;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', logoFile);

      const response = await fetch(`/api/clubs/${clubId}/theme/upload-logo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload logo');

      const data = await response.json();
      return data.url;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload logo');
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      // Upload logo if there's a new file
      let logoUrl = formData.logoUrl;
      if (logoFile) {
        logoUrl = await uploadLogo();
        if (!logoUrl && logoFile) {
          // Upload failed
          setSaving(false);
          return;
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
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update theme');
      }

      alert('Theme updated successfully!');
      await fetchClub();
      setLogoFile(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update theme');
    } finally {
      setSaving(false);
    }
  }

  function checkContrast(
    bgColor: string,
    fgColor: string = '#ffffff'
  ): boolean {
    // Simple contrast check (WCAG AA requires 4.5:1 for normal text)
    // This is a simplified version
    const getLuminance = (hex: string) => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };

    const l1 = getLuminance(bgColor);
    const l2 = getLuminance(fgColor);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    return ratio >= 4.5;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading club theme...</p>
      </div>
    );
  }

  if (!club) {
    return null;
  }

  const primaryContrast = checkContrast(formData.primaryColor);
  const secondaryContrast = checkContrast(formData.secondaryColor);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Form Section */}
        <Card className="p-6">
          <h1 className="mb-2 text-2xl font-bold">Theme Editor</h1>
          <p className="mb-6 text-gray-600">Club: {club.name}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload */}
            <div>
              <Label htmlFor="logo">Club Logo</Label>
              <div className="mt-2 space-y-3">
                {logoPreview && (
                  <div className="relative flex h-24 items-center justify-center rounded-lg bg-gray-100 p-4">
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      fill
                      className="object-contain"
                      unoptimized
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
                    <Upload className="mr-2 h-4 w-4" />
                    {logoPreview ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                  {logoFile && (
                    <span className="flex items-center text-sm text-green-600">
                      <CheckCircle2 className="mr-1 h-4 w-4" />
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
                  onChange={(e) =>
                    setFormData({ ...formData, primaryColor: e.target.value })
                  }
                  className="h-10 w-20 cursor-pointer rounded border border-gray-300"
                />
                <Input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) =>
                    setFormData({ ...formData, primaryColor: e.target.value })
                  }
                  placeholder="#1e40af"
                  className="flex-1"
                />
              </div>
              {!primaryContrast && (
                <p className="mt-1 flex items-center text-xs text-amber-600">
                  ⚠️ Low contrast with white text - may not be accessible
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
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
                  onChange={(e) =>
                    setFormData({ ...formData, secondaryColor: e.target.value })
                  }
                  className="h-10 w-20 cursor-pointer rounded border border-gray-300"
                />
                <Input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) =>
                    setFormData({ ...formData, secondaryColor: e.target.value })
                  }
                  placeholder="#7c3aed"
                  className="flex-1"
                />
              </div>
              {!secondaryContrast && (
                <p className="mt-1 flex items-center text-xs text-amber-600">
                  ⚠️ Low contrast with white text - may not be accessible
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
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
                {saving
                  ? 'Saving...'
                  : uploading
                    ? 'Uploading...'
                    : 'Save Theme'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Preview Section */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center text-xl font-bold">
            <Palette className="mr-2 h-5 w-5" />
            Live Preview
          </h2>

          <div className="space-y-4">
            {/* Logo Preview */}
            {logoPreview && (
              <div className="rounded-lg border bg-white p-4">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Navigation Bar
                </p>
                <div className="flex items-center gap-2">
                  <div className="relative h-8 w-32">
                    <Image
                      src={logoPreview}
                      alt="Logo"
                      fill
                      className="object-contain object-left"
                      unoptimized
                    />
                  </div>
                  <span className="font-semibold">{club.name}</span>
                </div>
              </div>
            )}

            {/* Primary Color Preview */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">
                Primary Button
              </p>
              <button
                style={{ backgroundColor: formData.primaryColor }}
                className="rounded-md px-4 py-2 font-medium text-white"
              >
                Make Reservation
              </button>
            </div>

            {/* Secondary Color Preview */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">
                Shared Sauna Badge
              </p>
              <span
                className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium"
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
            <div className="rounded-lg border p-4">
              <p className="mb-3 text-sm font-medium text-gray-700">
                Sauna Card
              </p>
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <h3 className="mb-2 font-semibold">Main Sauna</h3>
                <p className="mb-3 text-sm text-gray-600">
                  Next available: 18:00
                </p>
                <button
                  style={{ backgroundColor: formData.primaryColor }}
                  className="w-full rounded-md px-4 py-2 text-sm font-medium text-white"
                >
                  Reserve Now
                </button>
              </div>
            </div>

            {/* Contrast Check Summary */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-semibold">
                Accessibility Check
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {primaryContrast ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <span className="text-amber-600">⚠️</span>
                  )}
                  <span
                    className={
                      primaryContrast ? 'text-green-700' : 'text-amber-700'
                    }
                  >
                    Primary color contrast: {primaryContrast ? 'Good' : 'Low'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {secondaryContrast ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <span className="text-amber-600">⚠️</span>
                  )}
                  <span
                    className={
                      secondaryContrast ? 'text-green-700' : 'text-amber-700'
                    }
                  >
                    Secondary color contrast:{' '}
                    {secondaryContrast ? 'Good' : 'Low'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
