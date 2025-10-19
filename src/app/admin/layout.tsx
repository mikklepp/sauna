'use client';

import Link from 'next/link';
import {
  Building2,
  MapPin,
  Waves,
  Users,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { AdminAuthGuard } from '@/components/admin-auth-guard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  async function handleLogout() {
    try {
      const response = await fetch('/api/auth/admin/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // Use window.location for a full page reload to ensure clean state
        window.location.replace('/admin/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
    <AdminAuthGuard>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
            <p className="mt-1 text-sm text-gray-500">Sauna Reservations</p>
          </div>

          <nav className="flex-1 space-y-1 px-4">
            <NavLink href="/admin" icon={<BarChart3 className="h-5 w-5" />}>
              Dashboard
            </NavLink>
            <NavLink
              href="/admin/clubs"
              icon={<Building2 className="h-5 w-5" />}
            >
              Clubs
            </NavLink>
            <NavLink
              href="/admin/islands"
              icon={<MapPin className="h-5 w-5" />}
            >
              Islands
            </NavLink>
            <NavLink href="/admin/saunas" icon={<Waves className="h-5 w-5" />}>
              Saunas
            </NavLink>
            <NavLink href="/admin/boats" icon={<Users className="h-5 w-5" />}>
              Boats
            </NavLink>
            <NavLink
              href="/admin/shared-reservations"
              icon={<Calendar className="h-5 w-5" />}
            >
              Shared Reservations
            </NavLink>
            <NavLink
              href="/admin/reports"
              icon={<BarChart3 className="h-5 w-5" />}
            >
              Reports
            </NavLink>
            <NavLink
              href="/admin/settings"
              icon={<Settings className="h-5 w-5" />}
            >
              Settings
            </NavLink>
          </nav>

          {/* Logout button at bottom */}
          <div className="border-t border-gray-200 p-4">
            <button
              data-testid="admin-logout-button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </AdminAuthGuard>
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
      className="flex items-center gap-3 rounded-lg px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
