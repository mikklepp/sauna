'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  const checkAuth = useCallback(async () => {
    // Skip auth check for login/register pages
    if (pathname === '/admin/login' || pathname === '/admin/register') {
      setIsChecking(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/admin/me', {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        // Check if setup is needed
        const setupResponse = await fetch('/api/auth/admin/setup-status', {
          credentials: 'same-origin',
        });
        if (setupResponse.ok) {
          const setupData = await setupResponse.json();
          if (setupData.needsSetup) {
            router.push('/admin/register');
            return;
          }
        }

        // Redirect to login
        router.push('/admin/login');
        return;
      }

      setIsChecking(false);
    } catch (err) {
      console.error('Auth check failed:', err);
      router.push('/admin/login');
    }
  }, [pathname, router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
