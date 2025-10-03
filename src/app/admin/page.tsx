import { Building2, MapPin, Waves, Users, Calendar, Activity } from 'lucide-react';

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
        <p className="text-gray-500 mt-2">
          Overview of the sauna reservation system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Clubs"
          value={stats.clubs}
          icon={<Building2 className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Islands"
          value={stats.islands}
          icon={<MapPin className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Saunas"
          value={stats.saunas}
          icon={<Waves className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Boats"
          value={stats.boats}
          icon={<Users className="w-6 h-6" />}
          color="orange"
        />
        <StatCard
          title="Reservations Today"
          value={stats.reservationsToday}
          icon={<Activity className="w-6 h-6" />}
          color="red"
        />
        <StatCard
          title="Upcoming Shared"
          value={stats.upcomingShared}
          icon={<Calendar className="w-6 h-6" />}
          color="indigo"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
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
      className="block p-4 text-center bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
    >
      <span className="font-medium text-gray-700">{children}</span>
    </a>
  );
}