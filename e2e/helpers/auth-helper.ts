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
 * Waits for islands page to fully load before returning
 * @param page - Playwright page object
 * @param secret - Optional club secret (uses test secret if not provided)
 */
export async function authenticateMember(
  page: Page,
  secret?: string
): Promise<void> {
  const clubSecret = secret || getTestClubSecret();

  // Clear localStorage to ensure welcome page shows
  await page.goto('/auth');
  await page.evaluate(() => localStorage.clear());

  // Navigate to auth page with secret
  await page.goto(`/auth?secret=${clubSecret}`);
  await page.waitForLoadState('load');

  // Wait for redirect to either welcome or islands
  await Promise.race([
    page.waitForURL(/\/welcome/, { timeout: 10000 }),
    page.waitForURL(/\/islands/, { timeout: 10000 }),
  ]);

  // If we're on welcome page, click continue
  if (page.url().includes('/welcome')) {
    // Check if button still exists (page might auto-redirect)
    const continueButton = page.getByTestId('continue-to-reservations');
    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click();
      await page.waitForURL(/\/islands/, { timeout: 10000 });
    } else {
      // Button disappeared, wait for auto-redirect
      await page.waitForURL(/\/islands/, { timeout: 10000 });
    }
  }

  // Ensure islands page is fully loaded before returning
  await page.waitForLoadState('load');
}
