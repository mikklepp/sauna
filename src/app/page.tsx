import Link from 'next/link';
import { Waves, Users, Calendar, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Waves className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">
              Sauna Reservations
            </span>
          </div>
          <div className="flex gap-4">
            <Link href="/app/auth">
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
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Streamlined Sauna Reservations
          <br />
          <span className="text-blue-600">for Island Communities</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          A complete reservation system with offline-capable Island Devices,
          web access for members, and automated shared sauna scheduling.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/app/auth">
            <Button size="lg">
              <Smartphone className="w-5 h-5 mr-2" />
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
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Calendar className="w-12 h-12 text-blue-600" />}
            title="Easy Reservations"
            description="Book next available time slots or join shared sauna sessions with just a few taps."
          />
          <FeatureCard
            icon={<Smartphone className="w-12 h-12 text-green-600" />}
            title="Offline Capable"
            description="Island Devices work without internet, syncing when connection is available."
          />
          <FeatureCard
            icon={<Users className="w-12 h-12 text-purple-600" />}
            title="Shared Saunas"
            description="Automatic Club Sauna scheduling during peak season with smart participant management."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-xl font-semibold mb-4">For Members</h3>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                  1
                </span>
                <div>
                  <strong>Scan QR Code</strong> - Get instant access to your club's islands
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                  2
                </span>
                <div>
                  <strong>Select Island & Sauna</strong> - Choose from available saunas
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                  3
                </span>
                <div>
                  <strong>Reserve Time</strong> - Book next available slot or join shared sauna
                </div>
              </li>
            </ol>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">For Island Devices</h3>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold">
                  1
                </span>
                <div>
                  <strong>One-Time Setup</strong> - Assign device to specific island
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold">
                  2
                </span>
                <div>
                  <strong>Works Offline</strong> - All features available without internet
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold">
                  3
                </span>
                <div>
                  <strong>Auto Sync</strong> - Syncs with backend when connection available
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t border-gray-200">
        <p className="text-center text-gray-500">
          Built with Next.js, TypeScript, and PWA technology for offline-first operation
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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}