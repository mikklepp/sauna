'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Download } from 'lucide-react';
import QRCode from 'qrcode';

interface Club {
  id: string;
  name: string;
  secret: string;
  secretValidFrom: string;
  secretValidUntil: string;
}

export default function ClubQRCodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState<Club | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const fetchClub = useCallback(async () => {
    try {
      const response = await fetch(`/api/clubs/${resolvedParams.id}`);
      if (!response.ok) throw new Error('Failed to fetch club');
      const data = await response.json();
      setClub(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load club');
      router.push('/admin/clubs');
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id, router]);

  const generateQRCode = useCallback(async () => {
    if (!club) return;

    try {
      const qrData = JSON.stringify({
        clubId: club.id,
        secret: club.secret,
      });

      const url = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      setQrCodeUrl(url);
    } catch (err) {
      // QR code generation failed silently
    }
  }, [club]);

  useEffect(() => {
    fetchClub();
  }, [fetchClub]);

  useEffect(() => {
    if (club) {
      generateQRCode();
    }
  }, [club, generateQRCode]);

  function downloadQRCode() {
    if (!qrCodeUrl || !club) return;

    const link = document.createElement('a');
    link.download = `${club.name.replace(/\s+/g, '-').toLowerCase()}-qr-code.png`;
    link.href = qrCodeUrl;
    link.click();
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!club) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="p-6">
        <h1 className="mb-2 text-2xl font-bold">{club.name} - QR Code</h1>
        <p className="mb-6 text-gray-600">
          Use this QR code to configure Island Devices
        </p>

        <div className="flex flex-col items-center space-y-6">
          {qrCodeUrl && (
            <div className="rounded-lg border-2 border-gray-200 bg-white p-6">
              <Image
                src={qrCodeUrl}
                alt="Club QR Code"
                width={384}
                height={384}
                className="h-96 w-96"
                unoptimized
              />
            </div>
          )}

          <div className="w-full rounded-md border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold">Secret Information</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <strong>Secret:</strong>{' '}
                <code className="rounded border bg-white px-2 py-1">
                  {club.secret}
                </code>
              </p>
              <p>
                <strong>Valid From:</strong>{' '}
                {new Date(club.secretValidFrom).toLocaleString()}
              </p>
              <p>
                <strong>Valid Until:</strong>{' '}
                {new Date(club.secretValidUntil).toLocaleString()}
              </p>
            </div>
          </div>

          <Button onClick={downloadQRCode} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download QR Code
          </Button>

          <div className="w-full rounded-md border border-blue-200 bg-blue-50 p-4">
            <h3 className="mb-2 font-semibold text-blue-900">
              How to use this QR Code
            </h3>
            <ol className="list-inside list-decimal space-y-1 text-sm text-blue-800">
              <li>Open the Island Device app on a tablet or mobile device</li>
              <li>Scan this QR code with the device camera</li>
              <li>
                The device will automatically configure with the club
                credentials
              </li>
              <li>Select the island to complete the setup</li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  );
}
