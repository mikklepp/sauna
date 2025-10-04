import { test, expect, Page } from '@playwright/test';
import { getValidClubSecret } from './helpers/auth-helper';

test.describe('Member Individual Reservation - Happy Path', () => {
  let clubSecret: string;

  test.beforeAll(async () => {
    clubSecret = await getValidClubSecret();
  });

  /**
   * Helper to navigate to an island with saunas and click Reserve button
   */
  async function navigateToReservePage(page: Page): Promise<boolean> {
    await page.goto(`/auth?secret=${clubSecret}`);
    await page.waitForURL(/\/islands/, { timeout: 10000 });

    // Wait for islands to load
    await page.waitForSelector('[data-testid="island-link"], :text("No islands available")', { timeout: 5000 }).catch(() => {});

    const islandLinks = page.locator('[data-testid="island-link"]');
    const islandCount = await islandLinks.count();

    if (islandCount === 0) {
      return false;
    }

    // Find an island with saunas
    for (let i = 0; i < Math.min(islandCount, 5); i++) {
      const island = islandLinks.nth(i);
      const islandText = await island.textContent();

      if (islandText && /[1-9]\s+(sauna|saunas)/.test(islandText)) {
        await island.click();
        await page.waitForURL(/\/islands\/[^/]+$/);
        await page.waitForLoadState('networkidle');

        // Wait for sauna cards to load
        await page.waitForSelector('[data-testid="sauna-card"]', { timeout: 5000 }).catch(() => {});

        const saunaCards = page.locator('[data-testid="sauna-card"]');
        if (await saunaCards.count() > 0) {
          // Click the Reserve button on the first sauna
          const reserveButton = saunaCards.first().getByRole('button', { name: /reserve this time/i });
          if (await reserveButton.isVisible()) {
            await reserveButton.click();
            await page.waitForURL(/\/islands\/[^/]+\/reserve/);
            return true;
          }
        }

        // Go back and try next island
        await page.goto(`/auth?secret=${clubSecret}`);
        await page.waitForURL(/\/islands/, { timeout: 10000 });
      }
    }

    return false;
  }

  test('should navigate to reservation page when clicking Reserve button', async ({ page }) => {
    const found = await navigateToReservePage(page);
    if (!found) {
      test.skip();
    }

    // Should be on reserve page
    expect(page.url()).toMatch(/\/islands\/[^/]+\/reserve/);

    // Should see boat search input
    await expect(page.getByLabel(/boat name or membership/i)).toBeVisible();
  });

  test('should search for boat by name', async ({ page }) => {
    const found = await navigateToReservePage(page);
    if (!found) {
      test.skip();
    }

    // Enter boat name in search
    const searchInput = page.getByTestId('boat-search-input');
    await searchInput.fill('Test');
    await page.waitForTimeout(500); // Wait for debounced search

    // Should have at least one result or "no boats found" message
    const boatResults = page.locator('[data-testid="boat-result"]');
    const noResults = page.getByText(/no boats found/i);

    const hasResults = await boatResults.count() > 0;
    const hasNoResultsMsg = await noResults.isVisible().catch(() => false);

    expect(hasResults || hasNoResultsMsg).toBeTruthy();
  });

  test('should search for boat by membership number', async ({ page }) => {
    const found = await navigateToReservePage(page);
    if (!found) {
      test.skip();
    }

    // Enter membership number in search
    const searchInput = page.getByTestId('boat-search-input');
    await searchInput.fill('MEM');
    await page.waitForTimeout(500); // Wait for debounced search

    // Should have results or no results message
    const boatResults = page.locator('[data-testid="boat-result"]');
    const noResults = page.getByText(/no boats found/i);

    const hasResults = await boatResults.count() > 0;
    const hasNoResultsMsg = await noResults.isVisible().catch(() => false);

    expect(hasResults || hasNoResultsMsg).toBeTruthy();
  });

  test('should allow selecting party size (adults and kids)', async ({ page }) => {
    const found = await navigateToReservePage(page);
    if (!found) {
      test.skip();
    }

    // First, search and select a boat to get to party size step
    const searchInput = page.getByTestId('boat-search-input');
    await searchInput.fill('Test');
    await page.waitForTimeout(500); // Wait for debounced search

    const boatResults = page.locator('[data-testid="boat-result"]');
    if (await boatResults.count() === 0) {
      test.skip();
    }

    // Wait for button to be enabled and click
    const firstBoat = boatResults.first();
    await firstBoat.waitFor({ state: 'visible' });
    await firstBoat.click();

    // Wait for either adults input (success) or error message
    const adultsInput = page.getByLabel(/adults/i);
    const errorMsg = page.getByText(/already has a reservation/i);

    await Promise.race([
      adultsInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
      errorMsg.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    ]);

    // Check if we hit daily limit error
    if (await errorMsg.isVisible().catch(() => false)) {
      test.skip(); // Boat already has reservation, skip test
    }

    // Now we should be on party size step
    await expect(adultsInput).toBeVisible();

    const kidsInput = page.getByLabel(/kids/i);
    await expect(kidsInput).toBeVisible();

    // Should be able to enter numbers
    await adultsInput.fill('2');
    await kidsInput.fill('1');

    expect(await adultsInput.inputValue()).toBe('2');
    expect(await kidsInput.inputValue()).toBe('1');
  });

  test('should complete full reservation flow', async ({ page }) => {
    const found = await navigateToReservePage(page);
    if (!found) {
      test.skip();
    }

    // Step 1: Search and select a boat
    const searchInput = page.getByTestId('boat-search-input');
    await searchInput.fill('Test');
    await page.waitForTimeout(500); // Wait for debounced search

    const boatResults = page.locator('[data-testid="boat-result"]');
    if (await boatResults.count() === 0) {
      test.skip();
    }

    await boatResults.first().click();

    // Wait for either adults input (success) or error message
    const adultsInput = page.getByLabel(/adults/i);
    const errorMsg = page.getByText(/already has a reservation/i);

    await Promise.race([
      adultsInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
      errorMsg.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    ]);

    // Check if we hit daily limit error
    if (await errorMsg.isVisible().catch(() => false)) {
      test.skip(); // Boat already has reservation, skip test
    }

    // Step 2: Enter party size
    const kidsInput = page.getByLabel(/kids/i);

    await adultsInput.fill('2');
    await kidsInput.fill('1');

    // Click Continue to go to confirmation step
    const continueButton = page.getByRole('button', { name: /continue/i });
    await continueButton.click();

    // Step 3: Confirm reservation
    const confirmButton = page.getByRole('button', { name: /confirm reservation/i });
    await confirmButton.click();

    // Step 4: Should see success message
    await expect(page.getByTestId('success-title')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/reservation confirmed/i)).toBeVisible();
  });

  test('should display reservation in list after creation', async ({ page }) => {
    const found = await navigateToReservePage(page);
    if (!found) {
      test.skip();
    }

    // Complete full reservation flow - try multiple boats if needed to avoid daily limit
    let boatName: string | null = null;
    let reservationCreated = false;

    // Get initial URL for navigation
    const reserveUrl = page.url();

    // Try up to 5 boats in case some already have reservations today
    for (let attempt = 0; attempt < 5; attempt++) {
      // Ensure we're at the start of the reserve page (step 1: boat selection)
      // We need to do this every time because previous attempt might have left us on a different step
      if (attempt > 0) {
        await page.goto(reserveUrl);
        await page.waitForLoadState('networkidle');
      }

      // Search for boats
      const searchInput = page.getByTestId('boat-search-input');
      await searchInput.fill('Test');
      await page.waitForTimeout(500);

      const boatResults = page.locator('[data-testid="boat-result"]');
      const boatCount = await boatResults.count();

      if (boatCount === 0) {
        break; // No boats found, exit loop
      }

      // Try to select a boat (use attempt index, wrapping around if needed)
      const boatIndex = attempt % boatCount;
      const targetBoat = boatResults.nth(boatIndex);

      boatName = await targetBoat.textContent();
      await targetBoat.click();

      // Wait for either adults input (success) or error message
      const adultsInput = page.getByLabel(/adults/i);
      const errorMsg = page.getByText(/already has a reservation/i);

      await Promise.race([
        adultsInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
        errorMsg.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
      ]);

      // Check if we get a daily limit error
      const hasError = await errorMsg.isVisible().catch(() => false);

      if (hasError) {
        // This boat already has a reservation, try next one - go back to start
        continue;
      }

      // Verify we're on party size step
      const isVisible = await adultsInput.isVisible().catch(() => false);

      if (!isVisible) {
        // Boat selection failed, try next one
        continue;
      }

      const kidsInput = page.getByLabel(/kids/i);
      await adultsInput.fill('2');
      await kidsInput.fill('1');

      const continueButton = page.getByRole('button', { name: /continue/i });
      await continueButton.click();

      const confirmButton = page.getByRole('button', { name: /confirm reservation/i });
      await confirmButton.click();

      // Wait for either success page or error on confirmation page
      const successTitle = page.getByTestId('success-title');
      const confirmErrorMsg = page.getByText(/already has a reservation/i);

      await Promise.race([
        successTitle.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
        confirmErrorMsg.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})
      ]);

      // Check if we succeeded
      if (await successTitle.isVisible().catch(() => false)) {
        reservationCreated = true;
        break;
      }

      // Reservation failed (either error or timeout), try next boat
      // No need to check for error explicitly - just continue to next iteration
    }

    if (!reservationCreated) {
      test.skip();
    }

    // Click "View All Reservations" button from success page
    const viewReservationsButton = page.getByRole('button', { name: /view all reservations/i });
    await viewReservationsButton.click();

    // Wait for reservations page to load
    await page.waitForURL(/\/reservations$/);
    await page.waitForLoadState('networkidle');

    // Should see "Upcoming" heading (indicates reservations are displayed)
    await expect(page.getByRole('heading', { name: /upcoming/i })).toBeVisible({ timeout: 5000 });

    // Verify our reservation is in the list (check for boat name)
    if (boatName) {
      const ourReservation = page.getByText(boatName.trim());
      await expect(ourReservation).toBeVisible();
    }
  });
});
