'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bookmark, Share, Home, CheckCircle2 } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const [isIOS, setIsIOS] = useState(false);
  const [clubName, setClubName] = useState<string>('');

  useEffect(() => {
    // Detect iOS
    const iOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);

    // Get club name from session if available
    fetchClubInfo();

    // Check if already shown
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (hasSeenWelcome === 'true') {
      // Already seen, redirect to islands
      router.replace('/islands');
    }
  }, [router]);

  async function fetchClubInfo() {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        if (data.data?.club) {
          setClubName(data.data.club.name);
        }
      }
    } catch (err) {
      // Ignore error, club name is optional
    }
  }

  function handleContinue() {
    // Mark as seen
    localStorage.setItem('hasSeenWelcome', 'true');
    router.push('/islands');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-2xl p-8">
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Welcome{clubName ? ` to ${clubName}` : ''}!
          </h1>
          <p className="text-lg text-gray-600">
            You&apos;re all set to make reservations
          </p>
        </div>

        <div className="mb-8 rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
          <div className="mb-4 flex items-start gap-3">
            {isIOS ? (
              <Home className="mt-1 h-6 w-6 flex-shrink-0 text-blue-600" />
            ) : (
              <Bookmark className="mt-1 h-6 w-6 flex-shrink-0 text-blue-600" />
            )}
            <div>
              <h2 className="mb-2 text-xl font-semibold text-blue-900">
                {isIOS ? 'Add to Home Screen' : 'Bookmark This Page'}
              </h2>
              <p className="mb-4 text-sm text-blue-800">
                {isIOS
                  ? 'Add this app to your home screen for quick access anytime:'
                  : 'Save this page to your bookmarks for easy access:'}
              </p>

              {isIOS ? (
                <ol className="space-y-3 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-semibold">
                      1
                    </span>
                    <span className="pt-0.5">
                      Tap the{' '}
                      <Share className="mx-1 inline h-4 w-4 text-blue-600" />{' '}
                      Share button at the bottom of your screen
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-semibold">
                      2
                    </span>
                    <span className="pt-0.5">
                      Scroll down and tap{' '}
                      <strong>&quot;Add to Home Screen&quot;</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-semibold">
                      3
                    </span>
                    <span className="pt-0.5">
                      Tap <strong>&quot;Add&quot;</strong> in the top right
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-semibold">
                      4
                    </span>
                    <span className="pt-0.5">
                      Find the app icon on your home screen
                    </span>
                  </li>
                </ol>
              ) : (
                <ol className="space-y-3 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-semibold">
                      1
                    </span>
                    <span className="pt-0.5">
                      Press{' '}
                      <kbd className="rounded bg-white px-2 py-1 shadow">
                        Ctrl+D
                      </kbd>{' '}
                      (Windows) or{' '}
                      <kbd className="rounded bg-white px-2 py-1 shadow">
                        ⌘+D
                      </kbd>{' '}
                      (Mac)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-semibold">
                      2
                    </span>
                    <span className="pt-0.5">
                      Or tap the{' '}
                      <Bookmark className="mx-1 inline h-4 w-4 text-blue-600" />{' '}
                      bookmark icon in your browser
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-semibold">
                      3
                    </span>
                    <span className="pt-0.5">
                      Give it a name and save it to your bookmarks bar
                    </span>
                  </li>
                </ol>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 space-y-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
          <p className="font-semibold">
            Why add to {isIOS ? 'home screen' : 'bookmarks'}?
          </p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
              <span>
                Stay logged in until December 31st - no need to scan QR again
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
              <span>Quick access from anywhere</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
              <span>Make reservations on the go</span>
            </li>
            {isIOS && (
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <span>Works like a native app on your device</span>
              </li>
            )}
          </ul>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleContinue} className="flex-1">
            Skip for Now
          </Button>
          <Button onClick={handleContinue} className="flex-1">
            Continue to Reservations
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          You can always access this later from your{' '}
          {isIOS ? 'home screen or' : ''} browser
        </p>
      </Card>
    </div>
  );
}
