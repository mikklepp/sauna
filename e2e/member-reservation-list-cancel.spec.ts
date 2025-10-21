import { test, expect } from '@playwright/test';
import { authenticateMember } from './helpers/auth-helper';
import { cleanupTodaysReservations } from './helpers/db-cleanup';
import {
  getTestClubSecret,
  createTestReservation,
} from './helpers/test-fixtures';

test.describe('Member Reservation List View & Cancellation', () => {
  let clubSecret: string;

  test.beforeAll(async () => {
    clubSecret = getTestClubSecret();

    // Create shared test reservations for different test scenarios
    // Each test uses a different boat to avoid conflicts

    // Boat 0: Upcoming reservation (2 hours from now) - for most tests
    await createTestReservation({
      saunaIndex: 0,
      boatIndex: 0,
      startTimeOffset: 2,
      durationHours: 1,
      adults: 2,
      kids: 1,
    });

    // Boat 1: Past reservation (1 hour ago) - for "Earlier Today" tests
    await createTestReservation({
      saunaIndex: 0,
      boatIndex: 1,
      startTimeOffset: -1,
      durationHours: 1,
      adults: 2,
      kids: 0,
    });

    // Boat 2: Near-future reservation (10 minutes) - for "too late to cancel" test
    await createTestReservation({
      saunaIndex: 0,
      boatIndex: 2,
      startTimeOffset: 10 / 60, // 10 minutes from now
      durationHours: 1,
      adults: 3,
      kids: 2,
    });

    // Boat 3: Cancellable reservation (3 hours) - for cancel flow tests
    await createTestReservation({
      saunaIndex: 0,
      boatIndex: 3,
      startTimeOffset: 3,
      durationHours: 1,
      adults: 4,
      kids: 1,
    });
  });

  test.afterAll(async () => {
    // Cleanup after entire suite completes
    await cleanupTodaysReservations();
  });

  /**
   * Helper to navigate to the reservations list page
   */
  async function navigateToReservationsList(page: any) {
    await authenticateMember(page, clubSecret);
    await page.waitForLoadState('load');

    const islandLink = page.locator('[data-testid="island-link"]').first();
    await islandLink.waitFor({ state: 'visible', timeout: 5000 });
    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('load');

    const saunaCards = page.locator('[data-testid="sauna-card"]');
    await saunaCards.first().waitFor({ state: 'visible', timeout: 10000 });

    const viewButton = saunaCards
      .first()
      .getByTestId('view-all-reservations-button');
    await viewButton.click();
    await page.waitForURL(/\/saunas\/[^/]+\/reservations$/);
    await page.waitForLoadState('load');
  }

  test('should display reservations list page', async ({ page }) => {
    // Use pre-created reservations from beforeAll
    await navigateToReservationsList(page);

    // Wait for reservations to load (data fetched async after page load)
    await expect(page.getByTestId('upcoming-reservations')).toBeVisible({
      timeout: 10000,
    });

    // Wait for reservation items to appear
    await page
      .locator('[data-testid="reservation-item"]')
      .first()
      .waitFor({ state: 'visible', timeout: 5000 });

    // Should see page content
    await expect(page.locator('main')).toBeVisible();
  });

  test('should navigate back from reservations list', async ({ page }) => {
    // Use pre-created reservations from beforeAll
    await navigateToReservationsList(page);

    // Navigate back
    const currentUrl = page.url();
    const islandUrl = currentUrl.replace(/\/saunas\/[^/]+\/reservations$/, '');

    await page.goto(islandUrl);
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('load');

    // Should see sauna cards
    await expect(
      page.locator('[data-testid="sauna-card"]').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should display upcoming reservations section when reservations exist', async ({
    page,
  }) => {
    // Use pre-created reservations from beforeAll
    await navigateToReservationsList(page);

    // Wait for reservations section to load (data fetched async after page load)
    await expect(page.getByRole('heading', { name: /upcoming/i })).toBeVisible({
      timeout: 10000,
    });

    // Wait for reservation items to appear
    const firstReservation = page
      .locator('[data-testid="reservation-item"]')
      .first();
    await firstReservation.waitFor({ state: 'visible', timeout: 5000 });

    // Should have reservation time displayed
    await expect(
      firstReservation.getByTestId('reservation-time')
    ).toBeVisible();
  });

  test('should display past reservations in "Earlier Today" section', async ({
    page,
  }) => {
    // Use pre-created past reservation from beforeAll (Boat 1)
    await navigateToReservationsList(page);

    // Wait for reservations to load
    await page
      .locator('[data-testid="reservation-item"]')
      .first()
      .waitFor({ state: 'visible', timeout: 5000 });

    // Should see "Earlier Today" section
    await expect(
      page.getByRole('heading', { name: /earlier today/i })
    ).toBeVisible({ timeout: 5000 });

    // Should see past reservations section
    await expect(page.getByTestId('past-reservations')).toBeVisible();

    // Past reservations should not have cancel buttons
    const pastSection = page.getByTestId('past-reservations');
    const cancelButtons = pastSection.getByTestId('cancel-button');
    await expect(cancelButtons).toHaveCount(0);
  });

  test('should show boat information in reservation cards', async ({
    page,
  }) => {
    // Use pre-created reservations from beforeAll
    await navigateToReservationsList(page);

    // Wait for reservations to load
    const firstReservation = page
      .locator('[data-testid="reservation-item"]')
      .first();
    await firstReservation.waitFor({ state: 'visible', timeout: 5000 });

    // Should show boat name
    await expect(
      firstReservation.getByTestId('reservation-boat-name')
    ).toContainText(/test alpha/i);

    // Should show membership number
    await expect(page.getByText(/#E2E-001/)).toBeVisible();
  });

  test('should show party size (adults and kids) in reservation cards', async ({
    page,
  }) => {
    // Use Boat 2 reservation (3 adults, 2 kids) from beforeAll
    await navigateToReservationsList(page);

    // Wait for reservations to load
    const firstReservation = page
      .locator('[data-testid="reservation-item"]')
      .first();
    await firstReservation.waitFor({ state: 'visible', timeout: 5000 });

    // Should show party size
    const partySize = firstReservation.getByTestId('reservation-party-size');
    await expect(partySize).toContainText(/3 adults/i);
    await expect(partySize).toContainText(/2 kids/i);
  });

  test('should show cancel button for upcoming reservations (>15 min before start)', async ({
    page,
  }) => {
    // Use Boat 0 reservation (2 hours away) from beforeAll
    await navigateToReservationsList(page);

    // Wait for reservations to load
    const firstReservation = page
      .locator('[data-testid="reservation-item"]')
      .first();
    await firstReservation.waitFor({ state: 'visible', timeout: 5000 });

    // Should see cancel button
    await expect(firstReservation.getByTestId('cancel-button')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show "Too late to cancel" for reservations starting in <15 minutes', async ({
    page,
  }) => {
    // Use Boat 2 reservation (10 minutes away) from beforeAll
    await navigateToReservationsList(page);

    // Wait for reservations to load
    await page
      .locator('[data-testid="reservation-item"]')
      .first()
      .waitFor({ state: 'visible', timeout: 5000 });

    // Should see "Too late to cancel" message
    await expect(page.getByTestId('too-late-message')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should open cancel confirmation dialog when clicking cancel button', async ({
    page,
  }) => {
    // Use Boat 3 reservation (3 hours away, cancellable) from beforeAll
    await navigateToReservationsList(page);

    // Wait for reservations to load
    const firstReservation = page
      .locator('[data-testid="reservation-item"]')
      .first();
    await firstReservation.waitFor({ state: 'visible', timeout: 5000 });

    // Click cancel button
    const cancelButton = firstReservation.getByTestId('cancel-button');
    await cancelButton.click();

    // Should open confirmation dialog
    await expect(
      page.getByRole('heading', { name: /cancel reservation/i })
    ).toBeVisible({ timeout: 2000 });
    await expect(page.getByText(/are you sure/i)).toBeVisible();

    // Should show reservation details in dialog
    await expect(page.getByText(/time/i)).toBeVisible();
    await expect(page.getByText(/boat/i)).toBeVisible();
  });

  test('should close cancel dialog when clicking "Keep Reservation"', async ({
    page,
  }) => {
    // Use Boat 3 reservation (3 hours away, cancellable) from beforeAll
    await navigateToReservationsList(page);

    // Wait for reservations to load
    const firstReservation = page
      .locator('[data-testid="reservation-item"]')
      .first();
    await firstReservation.waitFor({ state: 'visible', timeout: 5000 });

    // Click cancel button
    const cancelButton = firstReservation.getByTestId('cancel-button');
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

    // Reservation should still be visible
    await expect(page.getByTestId('upcoming-reservations')).toBeVisible();
  });

  test('should successfully cancel reservation when confirming', async ({
    page,
  }) => {
    // Use Boat 3 reservation (3 hours away, cancellable) from beforeAll
    // This test will mutate the data by cancelling, but that's okay since it's cleaned up in afterAll
    await navigateToReservationsList(page);

    // Wait for reservations to load
    const firstReservation = page
      .locator('[data-testid="reservation-item"]')
      .first();
    await firstReservation.waitFor({ state: 'visible', timeout: 5000 });

    // Click cancel button
    const cancelButton = firstReservation.getByTestId('cancel-button');
    await cancelButton.click();

    // Wait for dialog and confirm
    await expect(
      page.getByRole('heading', { name: /cancel reservation/i })
    ).toBeVisible({ timeout: 2000 });

    const confirmButton = page.getByRole('button', { name: /confirm cancel/i });
    await confirmButton.click();

    // Wait for dialog to close
    await expect(
      page.getByRole('heading', { name: /cancel reservation/i })
    ).not.toBeVisible({ timeout: 5000 });

    // Wait for reservation to disappear
    await expect(page.getByTestId('reservation-item')).not.toBeVisible({
      timeout: 5000,
    });

    // Should show empty state
    await expect(page.getByTestId('empty-state')).toBeVisible({
      timeout: 5000,
    });
  });
});
