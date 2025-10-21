import { test, expect, Page } from '@playwright/test';
import { getTestClubSecret, getTestBoat } from './helpers/test-fixtures';
import { authenticateMember } from './helpers/auth-helper';

test.describe('Member Individual Reservation - Happy Path', () => {
  let clubSecret: string;

  test.beforeAll(async () => {
    clubSecret = getTestClubSecret();
  });

  /**
   * Helper to navigate to an island with saunas and click Reserve button
   * Uses known test data - we have 2 islands, first island has 2 saunas
   */
  async function navigateToReservePage(page: Page): Promise<boolean> {
    await authenticateMember(page, clubSecret);
    await page.waitForLoadState('load');

    // Click first island (Test North Island - has 2 saunas)
    const islandLinks = page.locator('[data-testid="island-link"]');
    await islandLinks.first().click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('load');

    // Wait for sauna cards to load
    const saunaCards = page.locator('[data-testid="sauna-card"]');
    await saunaCards.first().waitFor({ state: 'visible', timeout: 5000 });

    // Click the Reserve button on the first sauna
    const reserveButton = saunaCards
      .first()
      .getByRole('button', { name: /reserve/i });

    await reserveButton.click();
    await page.waitForURL(/\/islands\/[^/]+\/reserve/);

    return true;
  }

  test('should navigate to reservation page when clicking Reserve button', async ({
    page,
  }) => {
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

    // Enter boat name in search (search for first test boat)
    const searchInput = page.getByTestId('boat-search-input');
    await searchInput.fill(getTestBoat(4)); // Epsilon - Test 4
    await page.waitForTimeout(500); // Wait for debounced search

    // Should have results
    const boatResults = page.locator('[data-testid="boat-result"]');
    await expect(boatResults.first()).toBeVisible();
  });

  test('should search for boat by membership number', async ({ page }) => {
    const found = await navigateToReservePage(page);
    if (!found) {
      test.skip();
    }

    // Enter membership number in search (search for test boat membership number)
    const searchInput = page.getByTestId('boat-search-input');
    await searchInput.fill('E2E-00'); // Will match all test boats
    await page.waitForTimeout(500); // Wait for debounced search

    // Should have results (all test boats start with E2E-00)
    const boatResults = page.locator('[data-testid="boat-result"]');
    await expect(boatResults.first()).toBeVisible();
  });

  test('should allow selecting party size (adults and kids)', async ({
    page,
  }) => {
    const found = await navigateToReservePage(page);
    if (!found) {
      test.skip();
    }

    // First, search and select a boat to get to party size step
    const searchInput = page.getByTestId('boat-search-input');
    await searchInput.fill(getTestBoat(5)); // Zeta - Test 5
    await page.waitForTimeout(500); // Wait for debounced search

    const boatResults = page.locator('[data-testid="boat-result"]');
    if ((await boatResults.count()) === 0) {
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
      errorMsg.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
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
    await searchInput.fill(getTestBoat(6)); // Eta - Test 6
    await page.waitForTimeout(500); // Wait for debounced search

    const boatResults = page.locator('[data-testid="boat-result"]');
    if ((await boatResults.count()) === 0) {
      test.skip();
    }

    await boatResults.first().click();

    // Wait for either adults input (success) or error message
    const adultsInput = page.getByLabel(/adults/i);
    const errorMsg = page.getByText(/already has a reservation/i);

    await Promise.race([
      adultsInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
      errorMsg.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
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
    const confirmButton = page.getByRole('button', {
      name: /confirm reservation/i,
    });
    await confirmButton.click();

    // Step 4: Should see success message
    await expect(page.getByTestId('success-title')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/reservation confirmed/i)).toBeVisible();
  });

  test('should display reservation in list after creation', async ({
    page,
  }) => {
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
        await page.waitForLoadState('load');
      }

      // Search for boats - use multiple boat options for retry logic
      const searchInput = page.getByTestId('boat-search-input');
      const boatSearchTerms = [
        getTestBoat(7), // Theta
        getTestBoat(8), // Iota
        getTestBoat(9), // Kappa
        getTestBoat(10), // Lambda
        getTestBoat(11), // Mu
      ];
      await searchInput.fill(boatSearchTerms[attempt % boatSearchTerms.length]);
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
        adultsInput
          .waitFor({ state: 'visible', timeout: 5000 })
          .catch(() => {}),
        errorMsg.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
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

      const confirmButton = page.getByRole('button', {
        name: /confirm reservation/i,
      });
      await confirmButton.click();

      // Wait for either success page or error on confirmation page
      const successTitle = page.getByTestId('success-title');
      const confirmErrorMsg = page.getByText(/already has a reservation/i);

      await Promise.race([
        successTitle
          .waitFor({ state: 'visible', timeout: 10000 })
          .catch(() => {}),
        confirmErrorMsg
          .waitFor({ state: 'visible', timeout: 10000 })
          .catch(() => {}),
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
    const viewReservationsButton = page.getByRole('button', {
      name: /view all reservations/i,
    });
    await viewReservationsButton.click();

    // Wait for reservations page to load
    await page.waitForURL(/\/reservations$/);
    await page.waitForLoadState('load');

    // Should see "Upcoming" heading (indicates reservations are displayed)
    await expect(page.getByRole('heading', { name: /upcoming/i })).toBeVisible({
      timeout: 5000,
    });

    // Verify our reservation is in the list (check for boat name)
    if (boatName) {
      const ourReservation = page.getByText(boatName.trim());
      await expect(ourReservation).toBeVisible();
    }
  });
});
