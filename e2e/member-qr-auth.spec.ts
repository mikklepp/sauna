import { test, expect } from '@playwright/test';
import { getValidClubSecret } from './helpers/auth-helper';

test.describe('Member QR Code Authentication Flow', () => {
  let clubSecret: string;

  test.beforeAll(async () => {
    clubSecret = await getValidClubSecret();
  });

  test('should authenticate member via QR code URL with secret parameter', async ({ page }) => {
    // Listen to console logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Simulate scanning QR code - navigate to auth page with secret parameter
    await page.goto(`/auth?secret=${clubSecret}`);
    await page.waitForLoadState('networkidle');

    // Give a moment for useEffect to run
    await page.waitForTimeout(1000);

    // Page should auto-authenticate and redirect to islands
    await page.waitForURL(/\/islands/, { timeout: 10000 });

    // Should see islands page header
    await expect(page.getByRole('heading', { name: /select island/i })).toBeVisible();

    // Should see at least one island (or "No islands available" message)
    const islandLinks = page.locator('[data-testid="island-link"]');
    const noIslandsMessage = page.getByText(/no islands available/i);

    // Either we have islands or the "no islands" message
    const hasIslands = await islandLinks.count() > 0;
    const hasNoIslandsMessage = await noIslandsMessage.isVisible().catch(() => false);

    expect(hasIslands || hasNoIslandsMessage).toBeTruthy();
  });

  test('should show error for invalid secret in URL', async ({ page }) => {
    // Navigate with invalid secret
    await page.goto('/auth?secret=INVALID123');

    // Should stay on auth page
    await page.waitForLoadState('networkidle');

    // Should show error message
    await expect(page.getByText(/invalid club secret/i)).toBeVisible({ timeout: 5000 });
  });

  test('should allow manual secret entry if URL parameter is not provided', async ({ page }) => {
    // Navigate to auth page without secret
    await page.goto('/auth');

    // Should see the manual entry form
    await expect(page.getByLabel(/club secret/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /access islands/i })).toBeVisible();

    // Fill in the secret manually
    await page.getByLabel(/club secret/i).fill(clubSecret);
    await page.getByRole('button', { name: /access islands/i }).click();

    // Should redirect to islands
    await page.waitForURL(/\/islands/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /select island/i })).toBeVisible();
  });

  test('should handle expired or future-dated secrets gracefully', async ({ page }) => {
    // This test assumes you have a way to create an expired secret
    // For now, we'll test with a clearly invalid secret format
    await page.goto('/auth?secret=EXPIRED');

    // Should show error
    await expect(page.getByText(/invalid club secret/i)).toBeVisible({ timeout: 5000 });
  });
});
