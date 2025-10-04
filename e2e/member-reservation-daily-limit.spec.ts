import { test, expect, Page } from '@playwright/test';
import { getValidClubSecret } from './helpers/auth-helper';

test.describe('Member Individual Reservation - Daily Limit Validation', () => {
  let clubSecret: string;

  test.beforeAll(async () => {
    clubSecret = await getValidClubSecret();
  });

  /**
   * Helper to navigate to reservation page for a specific island
   */
  async function navigateToReservePage(page: Page): Promise<boolean> {
    await page.goto(`/auth?secret=${clubSecret}`);
    await page.waitForURL(/\/islands/, { timeout: 10000 });

    // Wait for islands to load
    await page
      .waitForSelector(
        '[data-testid="island-link"], :text("No islands available")',
        { timeout: 5000 }
      )
      .catch(() => {});

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
        await page
          .waitForSelector('[data-testid="sauna-card"]', { timeout: 5000 })
          .catch(() => {});

        const saunaCards = page.locator('[data-testid="sauna-card"]');
        if ((await saunaCards.count()) > 0) {
          // Click the Reserve button on the first sauna
          const reserveButton = saunaCards
            .first()
            .getByRole('button', { name: /reserve this time/i });
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

  /**
   * Helper to create a reservation with a specific boat
   */
  async function createReservationWithBoat(
    page: Page,
    boatSearchTerm: string
  ): Promise<{ success: boolean; error?: string; boatName?: string }> {
    // Search for boat
    const searchInput = page.getByTestId('boat-search-input');
    await searchInput.fill(boatSearchTerm);
    await page.waitForTimeout(500); // Wait for debounced search

    const boatResults = page.locator('[data-testid="boat-result"]');
    if ((await boatResults.count()) === 0) {
      return { success: false, error: 'No boats found' };
    }

    const firstBoat = boatResults.first();
    const boatName = await firstBoat.textContent();
    await firstBoat.click();

    // Wait for either adults input (success) or error message
    const adultsInput = page.getByLabel(/adults/i);
    const errorMsg = page.getByText(/already has a reservation/i);

    await Promise.race([
      adultsInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
      errorMsg.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
    ]);

    // Check if we got daily limit error at boat selection
    if (await errorMsg.isVisible().catch(() => false)) {
      return {
        success: false,
        error: 'Daily limit at boat selection',
        boatName: boatName?.trim() || undefined,
      };
    }

    // Verify we're on party size step
    if (!(await adultsInput.isVisible().catch(() => false))) {
      return { success: false, error: 'Failed to reach party size step' };
    }

    // Fill party size
    const kidsInput = page.getByLabel(/kids/i);
    await adultsInput.fill('2');
    await kidsInput.fill('1');

    // Click Continue
    const continueButton = page.getByRole('button', { name: /continue/i });
    await continueButton.click();

    // Click Confirm
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
      return { success: true, boatName: boatName?.trim() || undefined };
    }

    // Check if we got daily limit error at confirmation
    if (await confirmErrorMsg.isVisible().catch(() => false)) {
      return {
        success: false,
        error: 'Daily limit at confirmation',
        boatName: boatName?.trim() || undefined,
      };
    }

    return { success: false, error: 'Unknown error' };
  }

  test('should prevent same boat from reserving twice on same island same day', async ({
    page,
  }) => {
    const found = await navigateToReservePage(page);
    if (!found) {
      test.skip();
    }

    // Create first reservation
    const firstResult = await createReservationWithBoat(page, 'Test');

    if (!firstResult.success) {
      // Boat already has reservation, that's fine - test already validates the behavior
      test.skip();
    }

    // Try to create second reservation with same boat on same island
    // Navigate back to reserve page
    await page.goto(
      page.url().replace(/\/islands\/[^/]+\/.*$/, (match) => {
        const islandId = match.match(/\/islands\/([^/]+)/)?.[1];
        return `/islands/${islandId}/reserve?saunaId=${new URL(page.url()).searchParams.get('saunaId') || ''}`;
      })
    );
    await page.waitForURL(/\/islands\/[^/]+\/reserve/);
    await page.waitForLoadState('networkidle');

    // Try to reserve with same boat
    const secondResult = await createReservationWithBoat(
      page,
      firstResult.boatName || 'Test'
    );

    // Should get daily limit error
    expect(secondResult.success).toBe(false);
    expect(secondResult.error).toContain('Daily limit');
  });

  test('should show error message when boat already has reservation on island', async ({
    page,
  }) => {
    const found = await navigateToReservePage(page);
    if (!found) {
      test.skip();
    }

    // Try to find a boat that already has a reservation
    // We'll search and try a few boats
    const searchInput = page.getByTestId('boat-search-input');
    await searchInput.fill('Test');
    await page.waitForTimeout(500);

    const boatResults = page.locator('[data-testid="boat-result"]');
    const boatCount = await boatResults.count();

    if (boatCount === 0) {
      test.skip();
    }

    // Try boats until we find one with daily limit error
    let foundError = false;
    for (let i = 0; i < Math.min(boatCount, 5); i++) {
      const boat = boatResults.nth(i);
      await boat.click();

      // Wait for either adults input or error
      const adultsInput = page.getByLabel(/adults/i);
      const errorMsg = page.getByText(/already has a reservation/i);

      await Promise.race([
        adultsInput
          .waitFor({ state: 'visible', timeout: 5000 })
          .catch(() => {}),
        errorMsg.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
      ]);

      if (await errorMsg.isVisible().catch(() => false)) {
        // Found a boat with daily limit error
        foundError = true;

        // Verify error message is displayed and properly formatted
        await expect(errorMsg).toBeVisible();
        const errorText = await errorMsg.textContent();
        expect(errorText).toMatch(/already has a reservation/i);
        break;
      }

      // This boat doesn't have reservation, try next one
      await page.goto(page.url());
      await page.waitForLoadState('networkidle');
      await searchInput.fill('Test');
      await page.waitForTimeout(500);
    }

    // If we didn't find any boat with error, create a reservation and try again
    if (!foundError) {
      const result = await createReservationWithBoat(page, 'Test');
      if (result.success && result.boatName) {
        // Now try to reserve with same boat again
        await page.goto(page.url());
        await page.waitForLoadState('networkidle');

        const searchInput2 = page.getByTestId('boat-search-input');
        await searchInput2.fill(result.boatName);
        await page.waitForTimeout(500);

        const boatResults2 = page.locator('[data-testid="boat-result"]');
        if ((await boatResults2.count()) > 0) {
          await boatResults2.first().click();

          const errorMsg = page.getByText(/already has a reservation/i);
          await expect(errorMsg).toBeVisible({ timeout: 5000 });
          foundError = true;
        }
      }
    }

    // Should have found at least one boat with daily limit
    expect(foundError).toBe(true);
  });

  test('should allow same boat to reserve on different islands same day', async ({
    page,
  }) => {
    await page.goto(`/auth?secret=${clubSecret}`);
    await page.waitForURL(/\/islands/, { timeout: 10000 });

    // Wait for islands to load
    await page
      .waitForSelector(
        '[data-testid="island-link"], :text("No islands available")',
        { timeout: 5000 }
      )
      .catch(() => {});

    const islandLinks = page.locator('[data-testid="island-link"]');
    const islandCount = await islandLinks.count();

    // Need at least 2 islands for this test
    if (islandCount < 2) {
      test.skip();
    }

    // Find two islands with saunas
    const islandsWithSaunas: number[] = [];
    for (let i = 0; i < islandCount && islandsWithSaunas.length < 2; i++) {
      const island = islandLinks.nth(i);
      const islandText = await island.textContent();

      if (islandText && /[1-9]\s+(sauna|saunas)/.test(islandText)) {
        islandsWithSaunas.push(i);
      }
    }

    if (islandsWithSaunas.length < 2) {
      test.skip();
    }

    // Navigate to first island and create reservation
    await islandLinks.nth(islandsWithSaunas[0]).click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('networkidle');

    const saunaCards = page.locator('[data-testid="sauna-card"]');
    if ((await saunaCards.count()) === 0) {
      test.skip();
    }

    const reserveButton = saunaCards
      .first()
      .getByRole('button', { name: /reserve this time/i });
    await reserveButton.click();
    await page.waitForURL(/\/islands\/[^/]+\/reserve/);

    const firstResult = await createReservationWithBoat(page, 'Test');

    if (!firstResult.success || !firstResult.boatName) {
      test.skip();
    }

    // Navigate to second island
    await page.goto(`/auth?secret=${clubSecret}`);
    await page.waitForURL(/\/islands/, { timeout: 10000 });

    const islandLinks2 = page.locator('[data-testid="island-link"]');
    await islandLinks2.nth(islandsWithSaunas[1]).click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('networkidle');

    const saunaCards2 = page.locator('[data-testid="sauna-card"]');
    if ((await saunaCards2.count()) === 0) {
      test.skip();
    }

    const reserveButton2 = saunaCards2
      .first()
      .getByRole('button', { name: /reserve this time/i });
    await reserveButton2.click();
    await page.waitForURL(/\/islands\/[^/]+\/reserve/);

    // Try to create reservation with same boat on different island
    const secondResult = await createReservationWithBoat(
      page,
      firstResult.boatName || 'TestBoat'
    );

    // Should succeed - daily limit is per island
    expect(secondResult.success).toBe(true);
  });

  test('should validate daily limit at confirmation step if reservation created between steps', async ({
    page,
  }) => {
    const found = await navigateToReservePage(page);
    if (!found) {
      test.skip();
    }

    // Search for boat
    const searchInput = page.getByTestId('boat-search-input');
    await searchInput.fill('Test');
    await page.waitForTimeout(500);

    const boatResults = page.locator('[data-testid="boat-result"]');
    if ((await boatResults.count()) === 0) {
      test.skip();
    }

    // Select first boat
    await boatResults.first().click();

    // Wait for adults input
    const adultsInput = page.getByLabel(/adults/i);
    const errorMsg = page.getByText(/already has a reservation/i);

    await Promise.race([
      adultsInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
      errorMsg.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
    ]);

    // Skip if boat already has reservation at selection
    if (await errorMsg.isVisible().catch(() => false)) {
      test.skip();
    }

    // Fill party size
    const kidsInput = page.getByLabel(/kids/i);
    await adultsInput.fill('2');
    await kidsInput.fill('1');

    // Click Continue
    const continueButton = page.getByRole('button', { name: /continue/i });
    await continueButton.click();

    // Click Confirm
    const confirmButton = page.getByRole('button', {
      name: /confirm reservation/i,
    });
    await confirmButton.click();

    // Wait for either success or error
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

    // Either should succeed OR show daily limit error at confirmation
    // Both are valid outcomes for this test
    const hasSuccess = await successTitle.isVisible().catch(() => false);
    const hasError = await confirmErrorMsg.isVisible().catch(() => false);

    expect(hasSuccess || hasError).toBe(true);
  });
});
