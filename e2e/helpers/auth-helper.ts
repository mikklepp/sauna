import { Page } from '@playwright/test';
import { getTestClubSecret } from './test-fixtures';

/**
 * Get a valid club secret for testing
 * Returns the test club secret from fixtures
 */
export async function getValidClubSecret(): Promise<string> {
  return getTestClubSecret();
}

/**
 * Authenticate as a member using the club secret
 * Handles the complete auth flow including welcome page
 * @param page - Playwright page object
 * @param secret - Optional club secret (uses test secret if not provided)
 */
export async function authenticateMember(
  page: Page,
  secret?: string
): Promise<void> {
  const clubSecret = secret || getTestClubSecret();

  // Navigate to auth page with secret
  await page.goto(`/auth?secret=${clubSecret}`);
  await page.waitForLoadState('networkidle');

  // Check if we're on welcome page or if it was skipped (localStorage check)
  const currentUrl = page.url();

  if (currentUrl.includes('/welcome')) {
    // Welcome page is shown - click continue
    await page.getByTestId('continue-to-reservations').click();
    await page.waitForURL(/\/islands/, { timeout: 10000 });
  } else if (currentUrl.includes('/islands')) {
    // Already at islands page - welcome was skipped
    return;
  } else {
    // Wait for one of the two possible redirects
    await Promise.race([
      page.waitForURL(/\/welcome/, { timeout: 10000 }),
      page.waitForURL(/\/islands/, { timeout: 10000 }),
    ]);

    // If we landed on welcome, click continue
    if (page.url().includes('/welcome')) {
      await page.getByTestId('continue-to-reservations').click();
      await page.waitForURL(/\/islands/, { timeout: 10000 });
    }
  }
}
