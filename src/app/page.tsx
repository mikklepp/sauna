import Link from 'next/link';
import { Waves, Users, Calendar, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Waves className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">
              Sauna Reservations
            </span>
          </div>
          <div className="flex gap-4">
            <Link href="/auth">
              <Button variant="outline">Member Access</Button>
            </Link>
            <Link href="/admin">
              <Button>Admin Portal</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="mb-6 text-5xl font-bold text-gray-900">
          Streamlined Sauna Reservations
          <br />
          <span className="text-blue-600">for Island Communities</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
          A complete reservation system with offline-capable Island Devices, web
          access for members, and automated shared sauna scheduling.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/auth">
            <Button size="lg">
              <Smartphone className="mr-2 h-5 w-5" />
              Access with QR Code
            </Button>
          </Link>
          <Link href="/island-device">
            <Button size="lg" variant="outline">
              Island Device Setup
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            icon={<Calendar className="h-12 w-12 text-blue-600" />}
            title="Easy Reservations"
            description="Book next available time slots or join shared sauna sessions with just a few taps."
          />
          <FeatureCard
            icon={<Smartphone className="h-12 w-12 text-green-600" />}
            title="Offline Capable"
            description="Island Devices work without internet, syncing when connection is available."
          />
          <FeatureCard
            icon={<Users className="h-12 w-12 text-purple-600" />}
            title="Shared Saunas"
            description="Automatic Club Sauna scheduling during peak season with smart participant management."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto rounded-lg bg-white px-4 py-16 shadow-lg">
        <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h3 className="mb-4 text-xl font-semibold">For Members</h3>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                  1
                </span>
                <div>
                  <strong>Scan QR Code</strong> - Get instant access to your
                  club&apos;s islands
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                  2
                </span>
                <div>
                  <strong>Select Island & Sauna</strong> - Choose from available
                  saunas
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                  3
                </span>
                <div>
                  <strong>Reserve Time</strong> - Book next available slot or
                  join shared sauna
                </div>
              </li>
            </ol>
          </div>
          <div>
            <h3 className="mb-4 text-xl font-semibold">For Island Devices</h3>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 font-semibold text-green-600">
                  1
                </span>
                <div>
                  <strong>One-Time Setup</strong> - Assign device to specific
                  island
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 font-semibold text-green-600">
                  2
                </span>
                <div>
                  <strong>Works Offline</strong> - All features available
                  without internet
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 font-semibold text-green-600">
                  3
                </span>
                <div>
                  <strong>Auto Sync</strong> - Syncs with backend when
                  connection available
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto mt-16 border-t border-gray-200 px-4 py-8">
        <p className="text-center text-gray-500">
          Built with Next.js, TypeScript, and PWA technology for offline-first
          operation
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
