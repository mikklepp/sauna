import Link from 'next/link';
import { Waves, Users, Calendar, Smartphone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Decorative Background Elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute -right-40 top-20 h-80 w-80 rounded-full bg-purple-400/10 blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-400/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/50 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                <Waves className="h-7 w-7 text-white" strokeWidth={2.5} />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-2xl font-bold text-transparent">
                Sauna Reservations
              </span>
            </div>
            <div className="flex gap-3">
              <Link href="/auth">
                <Button
                  variant="outline"
                  className="border-2 border-blue-200 bg-white/80 font-semibold text-blue-700 backdrop-blur-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
                >
                  Member Access
                </Button>
              </Link>
              <Link href="/admin">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40">
                  Admin Portal
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container relative mx-auto px-4 py-24 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/50 bg-white/60 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            Modern Sauna Management
          </div>
          <h1 className="mb-8 text-6xl font-extrabold leading-tight tracking-tight text-gray-900">
            Streamlined Sauna Reservations
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              for Island Communities
            </span>
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-gray-600">
            A complete reservation system with offline-capable Island Devices,
            web access for members, and automated shared sauna scheduling.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth">
              <Button
                size="lg"
                className="group h-14 bg-gradient-to-r from-blue-600 to-indigo-600 px-8 text-lg font-semibold shadow-xl shadow-blue-500/30 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/40"
              >
                <Smartphone className="mr-2 h-5 w-5 transition-transform group-hover:rotate-12" />
                Access with QR Code
              </Button>
            </Link>
            <Link href="/island-device">
              <Button
                size="lg"
                variant="outline"
                className="h-14 border-2 border-gray-300 bg-white/80 px-8 text-lg font-semibold backdrop-blur-sm transition-all hover:border-gray-400 hover:bg-white hover:shadow-lg"
              >
                Island Device Setup
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container relative mx-auto px-4 py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900">
            Everything You Need
          </h2>
          <p className="text-lg text-gray-600">
            Built for modern island communities
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            icon={<Calendar className="h-12 w-12" />}
            title="Easy Reservations"
            description="Book next available time slots or join shared sauna sessions with just a few taps."
            gradient="from-blue-500 to-indigo-600"
          />
          <FeatureCard
            icon={<Smartphone className="h-12 w-12" />}
            title="Offline Capable"
            description="Island Devices work without internet, syncing when connection is available."
            gradient="from-green-500 to-emerald-600"
          />
          <FeatureCard
            icon={<Users className="h-12 w-12" />}
            title="Shared Saunas"
            description="Automatic Club Sauna scheduling during peak season with smart participant management."
            gradient="from-purple-500 to-pink-600"
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="container relative mx-auto px-4 py-20">
        <div className="overflow-hidden rounded-3xl border border-gray-200/50 bg-white shadow-2xl">
          <div className="p-12">
            <h2 className="mb-16 text-center text-4xl font-bold text-gray-900">
              How It Works
            </h2>
            <div className="grid gap-16 md:grid-cols-2">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2">
                  <Smartphone className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">For Members</h3>
                </div>
                <ol className="space-y-6">
                  <li className="flex gap-4">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white shadow-lg shadow-blue-500/30">
                      1
                    </span>
                    <div>
                      <strong className="text-lg text-gray-900">
                        Scan QR Code
                      </strong>
                      <p className="mt-1 text-gray-600">
                        Get instant access to your club&apos;s islands
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white shadow-lg shadow-blue-500/30">
                      2
                    </span>
                    <div>
                      <strong className="text-lg text-gray-900">
                        Select Island & Sauna
                      </strong>
                      <p className="mt-1 text-gray-600">
                        Choose from available saunas
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white shadow-lg shadow-blue-500/30">
                      3
                    </span>
                    <div>
                      <strong className="text-lg text-gray-900">
                        Reserve Time
                      </strong>
                      <p className="mt-1 text-gray-600">
                        Book next available slot or join shared sauna
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2">
                  <Waves className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">
                    For Island Devices
                  </h3>
                </div>
                <ol className="space-y-6">
                  <li className="flex gap-4">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 font-bold text-white shadow-lg shadow-green-500/30">
                      1
                    </span>
                    <div>
                      <strong className="text-lg text-gray-900">
                        One-Time Setup
                      </strong>
                      <p className="mt-1 text-gray-600">
                        Assign device to specific island
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 font-bold text-white shadow-lg shadow-green-500/30">
                      2
                    </span>
                    <div>
                      <strong className="text-lg text-gray-900">
                        Works Offline
                      </strong>
                      <p className="mt-1 text-gray-600">
                        All features available without internet
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 font-bold text-white shadow-lg shadow-green-500/30">
                      3
                    </span>
                    <div>
                      <strong className="text-lg text-gray-900">
                        Auto Sync
                      </strong>
                      <p className="mt-1 text-gray-600">
                        Syncs with backend when connection available
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative mt-20 border-t border-gray-200/50 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                <Waves className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-xl font-bold text-transparent">
                Sauna Reservations
              </span>
            </div>
            <p className="text-center text-sm text-gray-600">
              Built with Next.js, TypeScript, and PWA technology for
              offline-first operation
            </p>
            <p className="text-center text-xs text-gray-400">
              © {new Date().getFullYear()} Sauna Reservations. Modern island
              community management.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200/50 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      {/* Gradient Background on Hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
      />
      <div className="relative">
        <div
          className={`mb-6 inline-flex rounded-2xl bg-gradient-to-br ${gradient} p-4 shadow-lg transition-transform duration-300 group-hover:scale-110`}
        >
          <div className="text-white">{icon}</div>
        </div>
        <h3 className="mb-3 text-2xl font-bold text-gray-900">{title}</h3>
        <p className="leading-relaxed text-gray-600">{description}</p>
      </div>
    </div>
  );
}
