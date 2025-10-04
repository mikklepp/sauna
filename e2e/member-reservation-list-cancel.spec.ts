import { test, expect, Page } from '@playwright/test';
import { getValidClubSecret } from './helpers/auth-helper';

test.describe('Member Reservation List View & Cancellation', () => {
  let clubSecret: string;

  test.beforeAll(async () => {
    clubSecret = await getValidClubSecret();
  });

  /**
   * Helper to navigate to reservations list for a sauna
   */
  async function navigateToReservationsList(page: Page): Promise<boolean> {
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
          // Click "View All Reservations" on first sauna
          const viewButton = saunaCards
            .first()
            .getByRole('button', { name: /view all reservations/i });
          if (await viewButton.isVisible()) {
            await viewButton.click();
            await page.waitForURL(/\/reservations$/);
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

  test('should display reservations list page', async ({ page }) => {
    const found = await navigateToReservationsList(page);
    if (!found) {
      test.skip();
    }

    // Should see sauna name in header
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Should see "Today's Reservations" subtitle
    await expect(page.getByText(/today'?s reservations/i)).toBeVisible();

    // Should see either "Upcoming" section or "No reservations" message
    const upcomingHeading = page.getByRole('heading', { name: /upcoming/i });
    const noReservations = page.getByText(/no reservations/i);

    const hasUpcoming = await upcomingHeading.isVisible().catch(() => false);
    const hasNoReservations = await noReservations
      .isVisible()
      .catch(() => false);

    expect(hasUpcoming || hasNoReservations).toBe(true);
  });

  test('should show Back to Saunas navigation button', async ({ page }) => {
    const found = await navigateToReservationsList(page);
    if (!found) {
      test.skip();
    }

    // Should see Back button
    const backButton = page.getByRole('button', { name: /back to saunas/i });
    await expect(backButton).toBeVisible();

    // Click back button
    await backButton.click();

    // Should navigate back to island detail page
    await page.waitForURL(/\/islands\/[^/]+$/);
    await expect(
      page.locator('[data-testid="sauna-card"]').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should display upcoming reservations section when reservations exist', async ({
    page,
  }) => {
    const found = await navigateToReservationsList(page);
    if (!found) {
      test.skip();
    }

    // Check if there are upcoming reservations
    const upcomingHeading = page.getByRole('heading', { name: /upcoming/i });
    const hasUpcoming = await upcomingHeading.isVisible().catch(() => false);

    if (!hasUpcoming) {
      // No upcoming reservations, test not applicable
      test.skip();
    }

    // Should see Upcoming section
    await expect(upcomingHeading).toBeVisible();

    // Should have reservation time displayed (looking for time format like "2:00 PM - 3:00 PM")
    const timeHeading = page.getByRole('heading', { level: 3 }).first();
    await expect(timeHeading).toBeVisible();
    const timeText = await timeHeading.textContent();
    expect(timeText).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)?/i);
  });

  test('should display past reservations in "Earlier Today" section', async ({
    page,
  }) => {
    const found = await navigateToReservationsList(page);
    if (!found) {
      test.skip();
    }

    // Check if there are past reservations
    const earlierHeading = page.getByRole('heading', {
      name: /earlier today/i,
    });
    const hasEarlier = await earlierHeading.isVisible().catch(() => false);

    if (!hasEarlier) {
      // No past reservations today, test not applicable
      test.skip();
    }

    // Should see "Earlier Today" section
    await expect(earlierHeading).toBeVisible();

    // Past reservations should be displayed (somewhat dimmed/muted)
    // They should not have cancel buttons
    const earlierSection = page.locator('div', { has: earlierHeading });
    const reservations = earlierSection
      .locator('div')
      .filter({ hasText: /\d{1,2}:\d{2}/ });

    if ((await reservations.count()) > 0) {
      // Verify no cancel button in past reservations
      const cancelButtons = earlierSection
        .getByRole('button')
        .filter({ hasText: /cancel|x/i });
      expect(await cancelButtons.count()).toBe(0);
    }
  });

  test('should show boat information in reservation cards', async ({
    page,
  }) => {
    const found = await navigateToReservationsList(page);
    if (!found) {
      test.skip();
    }

    // Check if there are any reservations
    const upcomingHeading = page.getByRole('heading', { name: /upcoming/i });
    const hasReservations = await upcomingHeading
      .isVisible()
      .catch(() => false);

    if (!hasReservations) {
      test.skip();
    }

    // Get first reservation
    const upcomingSection = page.locator('div', { has: upcomingHeading });
    const firstReservation = upcomingSection
      .locator('div')
      .filter({ hasText: /\d{1,2}:\d{2}/ })
      .first();

    // Should show boat information (look for membership number pattern)
    const boatInfo = firstReservation.locator('text=#').first();
    await expect(boatInfo).toBeVisible();
  });

  test('should show party size (adults and kids) in reservation cards', async ({
    page,
  }) => {
    const found = await navigateToReservationsList(page);
    if (!found) {
      test.skip();
    }

    // Check if there are any reservations
    const upcomingHeading = page.getByRole('heading', { name: /upcoming/i });
    const hasReservations = await upcomingHeading
      .isVisible()
      .catch(() => false);

    if (!hasReservations) {
      test.skip();
    }

    // Get first reservation
    const upcomingSection = page.locator('div', { has: upcomingHeading });
    const reservationText = await upcomingSection.textContent();

    // Should show party size (e.g., "2 adults" or "2 adults, 1 kid")
    expect(reservationText).toMatch(/\d+\s+adult/i);
  });

  test('should show cancel button for upcoming reservations (>15 min before start)', async ({
    page,
  }) => {
    const found = await navigateToReservationsList(page);
    if (!found) {
      test.skip();
    }

    // Check if there are upcoming reservations
    const upcomingHeading = page.getByRole('heading', { name: /upcoming/i });
    const hasReservations = await upcomingHeading
      .isVisible()
      .catch(() => false);

    if (!hasReservations) {
      test.skip();
    }

    // Look for cancel button (X icon)
    const upcomingSection = page.locator('div', { has: upcomingHeading });
    const cancelButton = upcomingSection.getByRole('button').first();

    // Should have cancel button OR "Too late to cancel" message
    const hasCancelButton = await cancelButton.isVisible().catch(() => false);
    const tooLateMsg = await page
      .getByText(/too late to cancel/i)
      .isVisible()
      .catch(() => false);

    expect(hasCancelButton || tooLateMsg).toBe(true);
  });

  test('should show "Too late to cancel" for reservations starting in <15 minutes', async ({
    page,
  }) => {
    const found = await navigateToReservationsList(page);
    if (!found) {
      test.skip();
    }

    // This test will only pass if there's a reservation starting soon
    const tooLateMsg = page.getByText(/too late to cancel/i);
    const isVisible = await tooLateMsg.isVisible().catch(() => false);

    if (!isVisible) {
      // No reservations starting soon, test not applicable
      test.skip();
    }

    // Verify message is displayed
    await expect(tooLateMsg).toBeVisible();

    // Verify no cancel button is shown for this reservation
    const parentSection = page.locator('div', { has: tooLateMsg });
    const cancelButton = parentSection
      .getByRole('button')
      .filter({ hasText: /x/i });
    expect(await cancelButton.count()).toBe(0);
  });

  test('should open cancel confirmation dialog when clicking cancel button', async ({
    page,
  }) => {
    const found = await navigateToReservationsList(page);
    if (!found) {
      test.skip();
    }

    // Find a cancellable reservation
    const upcomingHeading = page.getByRole('heading', { name: /upcoming/i });
    const hasReservations = await upcomingHeading
      .isVisible()
      .catch(() => false);

    if (!hasReservations) {
      test.skip();
    }

    // Find cancel button
    const upcomingSection = page.locator('div', { has: upcomingHeading });
    const cancelButton = upcomingSection.getByRole('button').first();

    if (!(await cancelButton.isVisible().catch(() => false))) {
      test.skip();
    }

    // Click cancel button
    await cancelButton.click();

    // Should open confirmation dialog
    await expect(
      page.getByRole('heading', { name: /cancel reservation/i })
    ).toBeVisible({ timeout: 2000 });
    await expect(page.getByText(/are you sure/i)).toBeVisible();

    // Should show reservation details in dialog
    await expect(page.getByText(/time:/i)).toBeVisible();
    await expect(page.getByText(/boat:/i)).toBeVisible();
  });

  test('should close cancel dialog when clicking "Keep Reservation"', async ({
    page,
  }) => {
    const found = await navigateToReservationsList(page);
    if (!found) {
      test.skip();
    }

    // Find and click cancel button
    const upcomingHeading = page.getByRole('heading', { name: /upcoming/i });
    if (!(await upcomingHeading.isVisible().catch(() => false))) {
      test.skip();
    }

    const upcomingSection = page.locator('div', { has: upcomingHeading });
    const cancelButton = upcomingSection.getByRole('button').first();

    if (!(await cancelButton.isVisible().catch(() => false))) {
      test.skip();
    }

    await cancelButton.click();

    // Wait for dialog
    await expect(
      page.getByRole('heading', { name: /cancel reservation/i })
    ).toBeVisible({ timeout: 2000 });

    // Click "Keep Reservation"
    const keepButton = page.getByRole('button', { name: /keep reservation/i });
    await keepButton.click();

    // Dialog should close
    await expect(
      page.getByRole('heading', { name: /cancel reservation/i })
    ).not.toBeVisible({ timeout: 2000 });

    // Reservation should still be in the list
    await expect(upcomingHeading).toBeVisible();
  });

  test('should successfully cancel reservation when confirming', async ({
    page,
  }) => {
    const found = await navigateToReservationsList(page);
    if (!found) {
      test.skip();
    }

    // Find a cancellable reservation
    const upcomingHeading = page.getByRole('heading', { name: /upcoming/i });
    if (!(await upcomingHeading.isVisible().catch(() => false))) {
      test.skip();
    }

    const upcomingSection = page.locator('div', { has: upcomingHeading });
    const cancelButton = upcomingSection.getByRole('button').first();

    if (!(await cancelButton.isVisible().catch(() => false))) {
      test.skip();
    }

    // Get the count of reservations before cancellation
    const reservationsBeforeCount = await upcomingSection
      .locator('div')
      .filter({ hasText: /\d{1,2}:\d{2}/ })
      .count();

    // Click cancel
    await cancelButton.click();

    // Wait for dialog and confirm
    await expect(
      page.getByRole('heading', { name: /cancel reservation/i })
    ).toBeVisible({ timeout: 2000 });

    const confirmButton = page.getByRole('button', { name: /confirm cancel/i });
    await confirmButton.click();

    // Wait for page to update
    await page.waitForTimeout(1000);

    // Check result - either the reservation is removed OR the list shows "No reservations"
    const stillHasUpcoming = await upcomingHeading
      .isVisible()
      .catch(() => false);

    if (stillHasUpcoming) {
      // If still has upcoming, count should be less
      const reservationsAfterCount = await upcomingSection
        .locator('div')
        .filter({ hasText: /\d{1,2}:\d{2}/ })
        .count();
      expect(reservationsAfterCount).toBeLessThan(reservationsBeforeCount);
    } else {
      // No more upcoming reservations, should show "No reservations" or just "Earlier Today"
      const noReservations = page.getByText(/no reservations/i);
      const earlierToday = page.getByRole('heading', {
        name: /earlier today/i,
      });

      const hasNoMsg = await noReservations.isVisible().catch(() => false);
      const hasEarlier = await earlierToday.isVisible().catch(() => false);

      expect(hasNoMsg || hasEarlier).toBe(true);
    }
  });
});
