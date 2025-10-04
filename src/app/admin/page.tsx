import {
  Building2,
  MapPin,
  Waves,
  Users,
  Calendar,
  Activity,
} from 'lucide-react';

export default async function AdminDashboard() {
  // In a real implementation, fetch these stats from the API
  const stats = {
    clubs: 5,
    islands: 12,
    saunas: 28,
    boats: 150,
    reservationsToday: 42,
    upcomingShared: 8,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-500">
          Overview of the sauna reservation system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Clubs"
          value={stats.clubs}
          icon={<Building2 className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Islands"
          value={stats.islands}
          icon={<MapPin className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Saunas"
          value={stats.saunas}
          icon={<Waves className="h-6 w-6" />}
          color="purple"
        />
        <StatCard
          title="Boats"
          value={stats.boats}
          icon={<Users className="h-6 w-6" />}
          color="orange"
        />
        <StatCard
          title="Reservations Today"
          value={stats.reservationsToday}
          icon={<Activity className="h-6 w-6" />}
          color="red"
        />
        <StatCard
          title="Upcoming Shared"
          value={stats.upcomingShared}
          icon={<Calendar className="h-6 w-6" />}
          color="indigo"
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <QuickActionButton href="/admin/clubs/new">
            Create Club
          </QuickActionButton>
          <QuickActionButton href="/admin/islands/new">
            Add Island
          </QuickActionButton>
          <QuickActionButton href="/admin/boats/import">
            Import Boats
          </QuickActionButton>
          <QuickActionButton href="/admin/shared-reservations/new">
            Schedule Shared Sauna
          </QuickActionButton>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div
          className={`rounded-lg p-3 ${colorClasses[color as keyof typeof colorClasses]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuickActionButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="block rounded-lg border border-gray-200 bg-gray-50 p-4 text-center transition-colors hover:bg-gray-100"
    >
      <span className="font-medium text-gray-700">{children}</span>
    </a>
  );
}
