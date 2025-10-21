import { test, expect } from '@playwright/test';
import { authenticateMember } from './helpers/auth-helper';
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
    await authenticateMember(page, clubSecret);

    // Wait for page to load
    await page.waitForLoadState('load');

    // Should see main heading (not in ClubHeader)
    await expect(
      page.getByRole('heading', { name: /choose your island/i })
    ).toBeVisible();

    // Should see at least the test islands (may have leftovers from previous runs)
    const islandLinks = page.locator('[data-testid="island-link"]');
    const count = await islandLinks.count();
    expect(count).toBeGreaterThanOrEqual(TEST_ISLANDS.length);

    // Verify our test islands are present
    await expect(page.getByText('Test North Island')).toBeVisible();
    await expect(page.getByText('Test South Island')).toBeVisible();
  });

  test('should show island details when clicking on an island', async ({
    page,
  }) => {
    // Authenticate
    await authenticateMember(page, clubSecret);
    await page.waitForLoadState('load');

    // Get the first island
    const islandLinks = page.locator('[data-testid="island-link"]');
    const firstIsland = islandLinks.first();

    // Click on the island
    await firstIsland.click();

    // Should navigate to island detail page
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('load');

    // Should see the first island's name in ClubHeader title (wait for it to load)
    await expect(page.locator('header')).toContainText(TEST_ISLANDS[0].name, {
      timeout: 10000,
    });

    // Should see instruction text for selecting a sauna
    await expect(page.getByTestId('island-instruction')).toBeVisible();
  });

  test('should navigate back to islands list from island detail', async ({
    page,
  }) => {
    // Authenticate
    await authenticateMember(page, clubSecret);
    await page.waitForLoadState('load');

    // Click on first island
    const islandLinks = page.locator('[data-testid="island-link"]');
    await islandLinks.first().click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('load');

    // Click back button in header (wait for it to be available)
    const backButton = page.locator('header button').first();
    await backButton.waitFor({ state: 'visible', timeout: 5000 });
    await backButton.click();

    // Should return to islands list
    await page.waitForURL(/\/islands$/);
    await expect(
      page.getByRole('heading', { name: /choose your island/i })
    ).toBeVisible();
  });

  test('should display island sauna count correctly', async ({ page }) => {
    // Authenticate
    await authenticateMember(page, clubSecret);
    await page.waitForLoadState('load');

    // Check first island's sauna count matches test data
    const islandLinks = page.locator('[data-testid="island-link"]');
    const firstIsland = islandLinks.first();

    // The sauna count is in CardDescription element
    await expect(firstIsland).toContainText(
      `${TEST_ISLANDS[0].numberOfSaunas} Sauna`
    );
  });

  test('should allow switching between multiple islands', async ({ page }) => {
    // Authenticate
    await authenticateMember(page, clubSecret);
    await page.waitForLoadState('load');

    const islandLinks = page.locator('[data-testid="island-link"]');

    // Click first island
    await islandLinks.nth(0).click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('load');

    // Should see first island name in header (wait for it to load)
    await expect(page.locator('header')).toContainText(TEST_ISLANDS[0].name, {
      timeout: 10000,
    });

    // Go back using header back button
    const backButton = page.locator('header button').first();
    await backButton.click();
    await page.waitForURL(/\/islands$/);
    await page.waitForLoadState('load');

    // Click second island
    await islandLinks.nth(1).click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('load');

    // Should see second island name in header (wait for it to load)
    await expect(page.locator('header')).toContainText(TEST_ISLANDS[1].name, {
      timeout: 10000,
    });
  });

  test('should only show islands belonging to authenticated club', async ({
    page,
  }) => {
    // This test verifies club-level data isolation
    // Authenticate
    await authenticateMember(page, clubSecret);

    // Wait for page to load
    await page.waitForLoadState('load');

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
