/**
 * Mode Detection Hook
 *
 * Determines whether the app is running in online or offline mode
 * based on the current route.
 *
 * Online mode: /islands/* routes - requires internet, uses API
 * Offline mode: /island-device/* routes - offline-first, uses IndexedDB
 */

import { usePathname } from 'next/navigation';

export type AppMode = 'online' | 'offline';

/**
 * Detect current app mode based on route
 */
export function useMode(): AppMode {
  const pathname = usePathname();

  if (pathname.startsWith('/island-device')) {
    return 'offline';
  }

  return 'online';
}

/**
 * Check if app is in offline mode (Island Device)
 */
export function useIsOfflineMode(): boolean {
  return useMode() === 'offline';
}

/**
 * Check if app is in online mode (User access)
 */
export function useIsOnlineMode(): boolean {
  return useMode() === 'online';
}
