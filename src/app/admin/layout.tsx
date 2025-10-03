import Link from 'next/link';
import { Building2, MapPin, Waves, Users, Calendar, BarChart3, Settings } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Sauna Reservations</p>
        </div>
        
        <nav className="px-4 space-y-1">
          <NavLink href="/admin" icon={<BarChart3 className="w-5 h-5" />}>
            Dashboard
          </NavLink>
          <NavLink href="/admin/clubs" icon={<Building2 className="w-5 h-5" />}>
            Clubs
          </NavLink>
          <NavLink href="/admin/islands" icon={<MapPin className="w-5 h-5" />}>
            Islands
          </NavLink>
          <NavLink href="/admin/saunas" icon={<Waves className="w-5 h-5" />}>
            Saunas
          </NavLink>
          <NavLink href="/admin/boats" icon={<Users className="w-5 h-5" />}>
            Boats
          </NavLink>
          <NavLink href="/admin/shared-reservations" icon={<Calendar className="w-5 h-5" />}>
            Shared Reservations
          </NavLink>
          <NavLink href="/admin/reports" icon={<BarChart3 className="w-5 h-5" />}>
            Reports
          </NavLink>
          <NavLink href="/admin/settings" icon={<Settings className="w-5 h-5" />}>
            Settings
          </NavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}