import { test, expect } from '@playwright/test';
import { getTestClubSecret, TEST_ISLANDS } from './helpers/test-fixtures';

test.describe('Member QR Code Authentication Flow', () => {
  let clubSecret: string;

  test.beforeAll(async () => {
    clubSecret = getTestClubSecret();
  });

  test('should authenticate member via QR code URL with secret parameter', async ({
    page,
  }) => {
    // Simulate scanning QR code - navigate to auth page with secret parameter
    await page.goto(`/auth?secret=${clubSecret}`);
    await page.waitForLoadState('load');

    // Give a moment for useEffect to run
    await page.waitForTimeout(1000);

    // Page should auto-authenticate and redirect to welcome page
    await page.waitForURL(/\/welcome/, { timeout: 10000 });

    // Click continue to proceed to islands
    await page.getByTestId('continue-to-reservations').click();

    // Should redirect to islands
    await page.waitForURL(/\/islands/, { timeout: 10000 });

    // Should see islands page header
    await expect(
      page.getByRole('heading', { name: /choose your island/i })
    ).toBeVisible();

    // Should see test islands (we have 2 test islands)
    const islandLinks = page.locator('[data-testid="island-link"]');
    await expect(islandLinks).toHaveCount(TEST_ISLANDS.length);
  });

  test('should show error for invalid secret in URL', async ({ page }) => {
    // Navigate with invalid secret
    await page.goto('/auth?secret=INVALID123');

    // Should stay on auth page
    await page.waitForLoadState('load');

    // Should show error message
    await expect(page.getByText(/invalid club secret/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('should allow manual secret entry if URL parameter is not provided', async ({
    page,
  }) => {
    // Navigate to auth page without secret
    await page.goto('/auth');

    // Should see the manual entry form
    await expect(page.getByLabel(/club secret/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /access islands/i })
    ).toBeVisible();

    // Fill in the secret manually
    await page.getByLabel(/club secret/i).fill(clubSecret);
    await page.getByRole('button', { name: /access islands/i }).click();

    // Should redirect to welcome page first
    await page.waitForURL(/\/welcome/, { timeout: 10000 });

    // Click continue to proceed to islands
    await page.getByTestId('continue-to-reservations').click();

    // Should redirect to islands
    await page.waitForURL(/\/islands/, { timeout: 10000 });
    await expect(
      page.getByRole('heading', { name: /choose your island/i })
    ).toBeVisible();
  });

  test('should handle expired or future-dated secrets gracefully', async ({
    page,
  }) => {
    // This test assumes you have a way to create an expired secret
    // For now, we'll test with a clearly invalid secret format
    await page.goto('/auth?secret=EXPIRED');

    // Should show error
    await expect(page.getByText(/invalid club secret/i)).toBeVisible({
      timeout: 5000,
    });
  });
});
