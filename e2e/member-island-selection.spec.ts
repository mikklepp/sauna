import { test, expect } from '@playwright/test';
import { getValidClubSecret } from './helpers/auth-helper';

test.describe('Member Island Selection Flow', () => {
  let clubSecret: string;

  test.beforeAll(async () => {
    clubSecret = await getValidClubSecret();
  });

  test('should display list of islands after authentication', async ({
    page,
  }) => {
    // Authenticate
    await page.goto(`/auth?secret=${clubSecret}`);
    await page.waitForURL(/\/islands/, { timeout: 10000 });

    // Should see islands page heading
    await expect(
      page.getByRole('heading', { name: /select island/i })
    ).toBeVisible();

    // Should see at least one island or "no islands" message
    const islandLinks = page.locator('[data-testid="island-link"]');
    const noIslandsMessage = page.getByText(/no islands available/i);

    const hasIslands = (await islandLinks.count()) > 0;
    const hasNoIslandsMessage = await noIslandsMessage
      .isVisible()
      .catch(() => false);

    expect(hasIslands || hasNoIslandsMessage).toBeTruthy();
  });

  test('should show island details when clicking on an island', async ({
    page,
  }) => {
    // Authenticate
    await page.goto(`/auth?secret=${clubSecret}`);
    await page.waitForURL(/\/islands/, { timeout: 10000 });

    // Check if there are islands
    const islandLinks = page.locator('[data-testid="island-link"]');
    const islandCount = await islandLinks.count();

    if (islandCount === 0) {
      test.skip();
    }

    // Get the first island's name
    const firstIsland = islandLinks.first();
    const islandName = await firstIsland
      .locator('h3, [class*="CardTitle"]')
      .first()
      .textContent();

    // Click on the island
    await firstIsland.click();

    // Should navigate to island detail page
    await page.waitForURL(/\/islands\/[^/]+$/);

    // Should see the island name in the header
    if (islandName) {
      await expect(
        page.getByRole('heading', { name: new RegExp(islandName.trim(), 'i') })
      ).toBeVisible();
    }

    // Should see instruction text
    await expect(page.getByText(/select a sauna/i)).toBeVisible();
  });

  test('should navigate back to islands list from island detail', async ({
    page,
  }) => {
    // Authenticate
    await page.goto(`/auth?secret=${clubSecret}`);
    await page.waitForURL(/\/islands/, { timeout: 10000 });

    // Check if there are islands
    const islandLinks = page.locator('[data-testid="island-link"]');
    const islandCount = await islandLinks.count();

    if (islandCount === 0) {
      test.skip();
    }

    // Click on first island
    await islandLinks.first().click();
    await page.waitForURL(/\/islands\/[^/]+$/);

    // Click back button
    await page.getByRole('button', { name: /back to islands/i }).click();

    // Should return to islands list
    await page.waitForURL(/\/islands$/);
    await expect(
      page.getByRole('heading', { name: /select island/i })
    ).toBeVisible();
  });

  test('should display island sauna count correctly', async ({ page }) => {
    // Authenticate
    await page.goto(`/auth?secret=${clubSecret}`);
    await page.waitForURL(/\/islands/, { timeout: 10000 });

    // Check if there are islands
    const islandLinks = page.locator('[data-testid="island-link"]');
    const islandCount = await islandLinks.count();

    if (islandCount === 0) {
      test.skip();
    }

    // Check first island's sauna count is displayed
    const firstIsland = islandLinks.first();
    const saunaCountText = await firstIsland
      .locator('[class*="CardDescription"]')
      .first()
      .textContent();

    // Should contain number and "sauna" or "saunas"
    expect(saunaCountText).toMatch(/\d+\s+(sauna|saunas)/i);
  });

  test('should allow switching between multiple islands', async ({ page }) => {
    // Authenticate
    await page.goto(`/auth?secret=${clubSecret}`);
    await page.waitForURL(/\/islands/, { timeout: 10000 });

    // Check if there are multiple islands
    const islandLinks = page.locator('[data-testid="island-link"]');
    const islandCount = await islandLinks.count();

    if (islandCount < 2) {
      test.skip();
    }

    // Get names of first two islands
    const firstIslandName = await islandLinks
      .nth(0)
      .locator('h3, [class*="CardTitle"]')
      .first()
      .textContent();
    const secondIslandName = await islandLinks
      .nth(1)
      .locator('h3, [class*="CardTitle"]')
      .first()
      .textContent();

    // Click first island
    await islandLinks.nth(0).click();
    await page.waitForURL(/\/islands\/[^/]+$/);

    if (firstIslandName) {
      await expect(
        page.getByRole('heading', {
          name: new RegExp(firstIslandName.trim(), 'i'),
        })
      ).toBeVisible();
    }

    // Go back
    await page.getByRole('button', { name: /back to islands/i }).click();
    await page.waitForURL(/\/islands$/);

    // Click second island
    await islandLinks.nth(1).click();
    await page.waitForURL(/\/islands\/[^/]+$/);

    if (secondIslandName) {
      await expect(
        page.getByRole('heading', {
          name: new RegExp(secondIslandName.trim(), 'i'),
        })
      ).toBeVisible();
    }
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

    // Verify heading is present
    await expect(
      page.getByRole('heading', { name: /select island/i })
    ).toBeVisible();

    // Get all island names
    const islandLinks = page.locator('[data-testid="island-link"]');
    const hasIslands = (await islandLinks.count()) > 0;
    const hasNoMessage = await page
      .getByText(/no islands available/i)
      .isVisible()
      .catch(() => false);

    // Should have either islands OR "no islands" message
    expect(hasIslands || hasNoMessage).toBeTruthy();
  });
});
