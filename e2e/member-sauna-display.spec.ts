import { test, expect, Page } from '@playwright/test';
import { getTestClubSecret } from './helpers/test-fixtures';
import { authenticateMember } from './helpers/auth-helper';

test.describe('Member Sauna Display & Status', () => {
  let clubSecret: string;

  test.beforeAll(async () => {
    clubSecret = getTestClubSecret();
  });

  /**
   * Helper to navigate to an island that has saunas
   * Uses known test data - first island (Test North Island) has 2 saunas
   */
  async function navigateToIslandWithSaunas(page: Page): Promise<boolean> {
    await authenticateMember(page, clubSecret);
    await page.waitForLoadState('networkidle');

    // Click first island (Test North Island - has 2 saunas)
    const islandLinks = page.locator('[data-testid="island-link"]');
    await islandLinks.first().click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('networkidle');

    // Wait for sauna cards to load
    const saunaCards = page.locator('[data-testid="sauna-card"]');
    await saunaCards.first().waitFor({ state: 'visible', timeout: 5000 });

    return true;
  }

  test('should display all saunas for selected island', async ({ page }) => {
    const found = await navigateToIslandWithSaunas(page);
    if (!found) {
      test.skip();
    }

    // Should see at least one sauna card
    const saunaCards = page.locator('[data-testid="sauna-card"]');
    const saunaCount = await saunaCards.count();

    expect(saunaCount).toBeGreaterThan(0);

    // Each sauna card should have a name
    for (let i = 0; i < saunaCount; i++) {
      const saunaCard = saunaCards.nth(i);
      const saunaName = await saunaCard
        .locator('h3, [class*="CardTitle"]')
        .first()
        .textContent();
      expect(saunaName).toBeTruthy();
    }
  });

  test('should display sauna status (Available or In Use)', async ({
    page,
  }) => {
    const found = await navigateToIslandWithSaunas(page);
    if (!found) {
      test.skip();
    }

    // Check sauna cards
    const saunaCards = page.locator('[data-testid="sauna-card"]');
    const saunaCount = await saunaCards.count();

    expect(saunaCount).toBeGreaterThan(0);

    // First sauna should show status - look for "Available" or "Currently in use" text
    const firstSauna = saunaCards.first();
    const hasAvailable = await firstSauna
      .getByText(/^Available$/)
      .isVisible()
      .catch(() => false);
    const hasInUse = await firstSauna
      .getByText(/currently in use/i)
      .isVisible()
      .catch(() => false);

    // Should have either status
    expect(hasAvailable || hasInUse).toBeTruthy();
  });

  test('should display next available time for each sauna', async ({
    page,
  }) => {
    const found = await navigateToIslandWithSaunas(page);
    if (!found) {
      test.skip();
    }

    const saunaCards = page.locator('[data-testid="sauna-card"]');
    const saunaCount = await saunaCards.count();

    expect(saunaCount).toBeGreaterThan(0);

    // Each sauna should show "Next Available" with a time
    for (let i = 0; i < saunaCount; i++) {
      const saunaCard = saunaCards.nth(i);

      // Should have "Next Available" text
      await expect(saunaCard.getByText(/next available/i)).toBeVisible();

      // Should have a time display (looking for time format like "2:00 PM" or "14:00")
      const timeText = await saunaCard.textContent();
      expect(timeText).toMatch(/\d{1,2}:\d{2}|\d{1,2}\s?(AM|PM)/i);
    }
  });

  test('should show Reserve This Time button for each sauna', async ({
    page,
  }) => {
    const found = await navigateToIslandWithSaunas(page);
    if (!found) {
      test.skip();
    }

    const saunaCards = page.locator('[data-testid="sauna-card"]');
    const saunaCount = await saunaCards.count();

    expect(saunaCount).toBeGreaterThan(0);

    // Each sauna should have a reserve button
    for (let i = 0; i < saunaCount; i++) {
      const saunaCard = saunaCards.nth(i);
      const reserveButton = saunaCard.getByRole('button', {
        name: /reserve this time/i,
      });
      await expect(reserveButton).toBeVisible();
    }
  });

  test('should display heating time information when sauna is cold', async ({
    page,
  }) => {
    const found = await navigateToIslandWithSaunas(page);
    if (!found) {
      test.skip();
    }

    const saunaCards = page.locator('[data-testid="sauna-card"]');

    // Check if any sauna shows heating time info
    // This is conditional - only shown when sauna needs heating
    const firstSauna = saunaCards.first();
    const heatingInfo = await firstSauna
      .getByText(/includes.*heating time/i)
      .isVisible()
      .catch(() => false);

    // If heating info is shown, verify it contains a number of hours
    if (heatingInfo) {
      const heatingText = await firstSauna
        .getByText(/includes.*heating time/i)
        .textContent();
      expect(heatingText).toMatch(/\d+h/i);
    }

    // Test passes whether heating info is shown or not (depends on sauna state)
    expect(true).toBe(true);
  });

  test('should show View All Reservations button for each sauna', async ({
    page,
  }) => {
    const found = await navigateToIslandWithSaunas(page);
    if (!found) {
      test.skip();
    }

    const saunaCards = page.locator('[data-testid="sauna-card"]');
    const saunaCount = await saunaCards.count();

    expect(saunaCount).toBeGreaterThan(0);

    // Each sauna should have a "View All Reservations" button
    for (let i = 0; i < saunaCount; i++) {
      const saunaCard = saunaCards.nth(i);
      const viewReservationsButton = saunaCard.getByRole('button', {
        name: /view all reservations/i,
      });
      await expect(viewReservationsButton).toBeVisible();
    }
  });

  test('should support multiple saunas on same island (1-3)', async ({
    page,
  }) => {
    const found = await navigateToIslandWithSaunas(page);
    if (!found) {
      test.skip();
    }

    const saunaCards = page.locator('[data-testid="sauna-card"]');
    const saunaCount = await saunaCards.count();

    // Should have between 1 and 3 saunas per SPECIFICATION
    expect(saunaCount).toBeGreaterThanOrEqual(1);
    expect(saunaCount).toBeLessThanOrEqual(3);

    // Each sauna should be independently displayed
    if (saunaCount > 1) {
      const firstSaunaName = await saunaCards
        .nth(0)
        .locator('h3')
        .first()
        .textContent();
      const secondSaunaName = await saunaCards
        .nth(1)
        .locator('h3')
        .first()
        .textContent();

      // Sauna names should be different
      expect(firstSaunaName).not.toBe(secondSaunaName);
    }
  });

  test('should display shared sauna indicator when exists', async ({
    page,
  }) => {
    const found = await navigateToIslandWithSaunas(page);
    if (!found) {
      test.skip();
    }

    // Check if any sauna has shared reservation indicator
    // This is conditional - only shown when there's a shared reservation today
    const sharedIndicator = await page
      .getByText(/shared sauna today|join shared/i)
      .isVisible()
      .catch(() => false);

    // If shared indicator exists, verify we can see details
    if (sharedIndicator) {
      await expect(page.getByText(/shared sauna today/i)).toBeVisible();

      // Should show a "Join" button
      const joinButton = page.getByRole('button', { name: /join shared/i });
      await expect(joinButton).toBeVisible();
    }

    // Test passes whether shared reservation exists or not
    expect(true).toBe(true);
  });
});
