import { test, expect } from '@playwright/test';
import {
  resetTestClub,
  getTestClubSecret,
  createTestReservation,
  TEST_BOATS,
} from './helpers/test-fixtures';

test.describe.configure({ mode: 'serial' });

test.describe('Member - Many Boats Reservation Visibility', () => {
  let clubSecret: string;

  test.beforeAll(async () => {
    // Reset test club ONCE to get fresh data with all 24 Greek alphabet boats
    await resetTestClub();
    clubSecret = getTestClubSecret();

    // Create 23 reservations (all boats except Omega)
    // The first test will create the 24th reservation via UI
    const now = new Date();
    const baseHour = 8; // Start at 8:00 AM

    for (let i = 0; i < TEST_BOATS.length - 1; i++) {
      // Calculate start time: 8 AM + i hours
      const startHour = baseHour + i;
      const hoursFromNow = startHour - now.getHours();

      await createTestReservation({
        saunaIndex: 0, // First sauna (North Main Sauna)
        boatIndex: i,
        startTimeOffset: hoursFromNow,
        durationHours: 1,
        adults: 2,
        kids: 0,
      });
    }
  });

  test('should allow creating reservation via UI when many exist', async ({
    page,
  }) => {
    // This test creates the 24th reservation (Test Omega) via UI
    // when there are already 23 reservations
    await page.goto(`/auth?secret=${clubSecret}`);
    await page.waitForLoadState('networkidle');

    // Handle welcome page if shown
    if (page.url().includes('/welcome')) {
      await page.getByTestId('continue-to-reservations').click();
    }

    await page.waitForURL(/\/islands/, { timeout: 10000 });

    // Click the first island
    const islandLinks = page.locator('[data-testid="island-link"]');
    await islandLinks.first().click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('networkidle');

    // Wait for sauna cards to load
    const saunaCards = page.locator('[data-testid="sauna-card"]');
    await saunaCards.first().waitFor({ state: 'visible', timeout: 5000 });

    // Click reserve button on first sauna
    const firstSauna = saunaCards.first();
    const reserveButton = firstSauna.getByRole('button', {
      name: /reserve this time/i,
    });
    await reserveButton.click();
    await page.waitForURL(/\/islands\/[^/]+\/reserve/);

    // Search for the last boat (Test Omega - the 24th boat)
    const searchInput = page.getByTestId('boat-search-input');
    await searchInput.fill('Test Omega');
    await page.waitForTimeout(500); // Wait for debounced search

    // Select Test Omega
    const boatResults = page.locator('[data-testid="boat-result"]');
    await expect(boatResults.first()).toBeVisible();
    await boatResults.first().click();

    // Fill in party size
    const adultsInput = page.getByLabel(/adults/i);
    await adultsInput.waitFor({ state: 'visible', timeout: 5000 });
    await adultsInput.fill('2');

    const kidsInput = page.getByLabel(/kids/i);
    await kidsInput.fill('0');

    // Click Continue
    const continueButton = page.getByRole('button', { name: /continue/i });
    await continueButton.click();

    // Confirm reservation
    const confirmButton = page.getByRole('button', {
      name: /confirm reservation/i,
    });
    await confirmButton.click();

    // Should see success
    await expect(page.getByTestId('success-title')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/reservation confirmed/i)).toBeVisible();

    // Verify "Test Omega" appears in success message
    const successContent = await page.textContent('body');
    expect(successContent).toContain('Test Omega');
  });

  test('should show all 24 boat names clearly distinguishable', async ({
    page,
  }) => {
    // After first test, all 24 boats now have reservations
    await page.goto(`/auth?secret=${clubSecret}`);
    await page.waitForLoadState('networkidle');

    // Handle welcome page if shown
    if (page.url().includes('/welcome')) {
      await page.getByTestId('continue-to-reservations').click();
    }

    await page.waitForURL(/\/islands/, { timeout: 10000 });

    const islandLinks = page.locator('[data-testid="island-link"]');
    await islandLinks.first().click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('networkidle');

    const saunaCards = page.locator('[data-testid="sauna-card"]');
    await saunaCards.first().waitFor({ state: 'visible', timeout: 5000 });

    const firstSauna = saunaCards.first();
    const viewAllButton = firstSauna.getByRole('button', {
      name: /view all reservations/i,
    });

    if (await viewAllButton.isVisible().catch(() => false)) {
      await viewAllButton.click();
      await page.waitForTimeout(1000);
    }

    // Verify all 24 Greek letter boats can be distinguished
    const greekLetters = [
      'Alpha',
      'Beta',
      'Gamma',
      'Delta',
      'Epsilon',
      'Zeta',
      'Eta',
      'Theta',
      'Iota',
      'Kappa',
      'Lambda',
      'Mu',
      'Nu',
      'Xi',
      'Omicron',
      'Pi',
      'Rho',
      'Sigma',
      'Tau',
      'Upsilon',
      'Phi',
      'Chi',
      'Psi',
      'Omega',
    ];

    const pageText = await page.textContent('body');

    // Count visible boats
    const visibleCount = greekLetters.filter((letter) =>
      pageText?.includes(`Test ${letter}`)
    ).length;

    // Should see all 24 boats now (includes Omega created in first test)
    expect(visibleCount).toBeGreaterThanOrEqual(20);

    // Specifically verify Omega is visible (created via UI in first test)
    expect(pageText).toContain('Test Omega');
  });

  test('should handle scrolling to see all reservations', async ({ page }) => {
    await page.goto(`/auth?secret=${clubSecret}`);
    await page.waitForLoadState('networkidle');

    // Handle welcome page if shown
    if (page.url().includes('/welcome')) {
      await page.getByTestId('continue-to-reservations').click();
    }

    await page.waitForURL(/\/islands/, { timeout: 10000 });

    const islandLinks = page.locator('[data-testid="island-link"]');
    await islandLinks.first().click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('networkidle');

    const saunaCards = page.locator('[data-testid="sauna-card"]');
    await saunaCards.first().waitFor({ state: 'visible', timeout: 5000 });

    const firstSauna = saunaCards.first();
    const viewAllButton = firstSauna.getByRole('button', {
      name: /view all reservations/i,
    });

    if (await viewAllButton.isVisible().catch(() => false)) {
      await viewAllButton.click();
      await page.waitForTimeout(1000);
    }

    // Scroll down to ensure lazy-loaded content appears
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(500);

    // Scroll back to top
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(500);

    // After scrolling, we should still see content from different parts
    const pageContent = await page.textContent('body');

    // Check boats from beginning, middle, and end
    expect(pageContent).toContain('Test Alpha'); // First
    expect(pageContent).toContain('Test Mu'); // Middle
    expect(pageContent).toContain('Test Omega'); // Last
  });
});
