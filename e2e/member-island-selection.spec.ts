import { test, expect } from '@playwright/test';
import { getTestClubSecret, TEST_ISLANDS } from './helpers/test-fixtures';

test.describe('Member Island Selection Flow', () => {
  let clubSecret: string;

  test.beforeAll(async () => {
    clubSecret = getTestClubSecret();
  });

  test('should display list of islands after authentication', async ({
    page,
  }) => {
    // Authenticate
    await page.goto(`/auth?secret=${clubSecret}`);
    await page.waitForURL(/\/islands/, { timeout: 10000 });

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Should see main heading (not in ClubHeader)
    await expect(
      page.getByRole('heading', { name: /choose your island/i })
    ).toBeVisible();

    // Should see island cards (we have 2 test islands)
    const islandLinks = page.locator('[data-testid="island-link"]');
    await expect(islandLinks).toHaveCount(TEST_ISLANDS.length);
  });

  test('should show island details when clicking on an island', async ({
    page,
  }) => {
    // Authenticate
    await page.goto(`/auth?secret=${clubSecret}`);
    await page.waitForURL(/\/islands/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Get the first island
    const islandLinks = page.locator('[data-testid="island-link"]');
    const firstIsland = islandLinks.first();

    // Click on the island
    await firstIsland.click();

    // Should navigate to island detail page
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('networkidle');

    // Should see the first island's name in ClubHeader title
    await expect(page.locator('header')).toContainText(TEST_ISLANDS[0].name);

    // Should see instruction text for selecting a sauna
    await expect(page.getByTestId('island-instruction')).toBeVisible();
  });

  test('should navigate back to islands list from island detail', async ({
    page,
  }) => {
    // Authenticate
    await page.goto(`/auth?secret=${clubSecret}`);
    await page.waitForURL(/\/islands/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Click on first island
    const islandLinks = page.locator('[data-testid="island-link"]');
    await islandLinks.first().click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('networkidle');

    // Click back button in header (ArrowLeft icon button)
    const backButton = page.locator('header button').first();
    await backButton.click();

    // Should return to islands list
    await page.waitForURL(/\/islands$/);
    await expect(
      page.getByRole('heading', { name: /choose your island/i })
    ).toBeVisible();
  });

  test('should display island sauna count correctly', async ({ page }) => {
    // Authenticate
    await page.goto(`/auth?secret=${clubSecret}`);
    await page.waitForURL(/\/islands/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Check first island's sauna count matches test data
    const islandLinks = page.locator('[data-testid="island-link"]');
    const firstIsland = islandLinks.first();

    // The sauna count is in CardDescription element
    await expect(firstIsland).toContainText(`${TEST_ISLANDS[0].numberOfSaunas} Sauna`);
  });

  test('should allow switching between multiple islands', async ({ page }) => {
    // Authenticate
    await page.goto(`/auth?secret=${clubSecret}`);
    await page.waitForURL(/\/islands/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    const islandLinks = page.locator('[data-testid="island-link"]');

    // Click first island
    await islandLinks.nth(0).click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('networkidle');

    // Should see first island name in header
    await expect(page.locator('header')).toContainText(TEST_ISLANDS[0].name);

    // Go back using header back button
    const backButton = page.locator('header button').first();
    await backButton.click();
    await page.waitForURL(/\/islands$/);
    await page.waitForLoadState('networkidle');

    // Click second island
    await islandLinks.nth(1).click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('networkidle');

    // Should see second island name in header
    await expect(page.locator('header')).toContainText(TEST_ISLANDS[1].name);
  });

  test('should only show islands belonging to authenticated club', async ({
    page,
  }) => {
    // This test verifies club-level data isolation
    // Authenticate
    await page.goto(`/auth?secret=${clubSecret}`);
    await page.waitForURL(/\/islands/, { timeout: 10000 });

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Should see exactly the test club's islands (no more, no less)
    const islandLinks = page.locator('[data-testid="island-link"]');
    await expect(islandLinks).toHaveCount(TEST_ISLANDS.length);

    // Verify the island names match test data
    for (let i = 0; i < TEST_ISLANDS.length; i++) {
      const island = islandLinks.nth(i);
      await expect(island).toContainText(TEST_ISLANDS[i].name);
    }
  });
});
