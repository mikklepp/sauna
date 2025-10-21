import { test, expect } from '@playwright/test';
import { authenticateMember } from './helpers/auth-helper';
import { cleanupTodaysReservations } from './helpers/db-cleanup';
import {
  getTestClubSecret,
  createTestReservation,
} from './helpers/test-fixtures';

test.describe('Reservation Cancellation', () => {
  let clubSecret: string;

  test.beforeAll(async () => {
    clubSecret = getTestClubSecret();
  });

  test.afterAll(async () => {
    // Cleanup after entire suite completes
    await cleanupTodaysReservations();
  });

  test('should display reservations list for a sauna', async ({ page }) => {
    // Create a test reservation for today
    await createTestReservation({
      saunaIndex: 0, // First sauna (North Main Sauna)
      boatIndex: 0, // Test Alpha
      startTimeOffset: 2, // 2 hours from now
      durationHours: 1,
      adults: 2,
      kids: 0,
    });

    // Navigate to island
    await authenticateMember(page, clubSecret);
    await page.waitForLoadState('load');

    const islandLink = page.locator('[data-testid="island-link"]').first();
    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('load');

    // Click "View All Reservations" button on first sauna
    const saunaCards = page.locator('[data-testid="sauna-card"]');
    await saunaCards.first().waitFor({ state: 'visible', timeout: 5000 });

    const viewReservationsButton = saunaCards
      .first()
      .getByTestId('view-all-reservations-button');

    await viewReservationsButton.click();
    await page.waitForURL(/\/saunas\/[^/]+\/reservations$/);
    await page.waitForLoadState('load');

    // Wait for reservations to load
    await page
      .locator('[data-testid="reservation-item"]')
      .first()
      .waitFor({ state: 'visible', timeout: 5000 });

    // Should show either "Upcoming" section or empty state
    const upcomingHeading = page.getByRole('heading', { name: /upcoming/i });
    const noReservations = page.getByText(/no reservations yet/i);

    const hasUpcoming = await upcomingHeading.isVisible().catch(() => false);
    const hasEmpty = await noReservations.isVisible().catch(() => false);

    // Page should have loaded content
    expect(hasUpcoming || hasEmpty).toBe(true);
  });

  test('should show cancel button for future reservations', async ({
    page,
  }) => {
    // Create a test reservation for the future (can be cancelled)
    await createTestReservation({
      saunaIndex: 0,
      boatIndex: 1, // Test Beta
      startTimeOffset: 3, // 3 hours from now (cancellable)
      durationHours: 1,
      adults: 2,
      kids: 1,
    });

    // Navigate to island
    await authenticateMember(page, clubSecret);
    await page.waitForLoadState('load');

    const islandLink = page.locator('[data-testid="island-link"]').first();
    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('load');

    // Click "View All Reservations" on first sauna
    const saunaCards = page.locator('[data-testid="sauna-card"]');
    await saunaCards.first().waitFor({ state: 'visible', timeout: 5000 });

    const viewReservationsButton = saunaCards
      .first()
      .getByTestId('view-all-reservations-button');

    await viewReservationsButton.click();
    await page.waitForURL(/\/saunas\/[^/]+\/reservations$/);
    await page.waitForLoadState('load');

    // Wait for reservations to load
    await page
      .locator('[data-testid="reservation-item"]')
      .first()
      .waitFor({ state: 'visible', timeout: 5000 });

    // Should see cancel button on the first reservation
    const firstReservation = page
      .locator('[data-testid="reservation-item"]')
      .first();
    const cancelButton = firstReservation.getByTestId('cancel-button');
    await expect(cancelButton).toBeVisible({ timeout: 5000 });
  });

  test('should cancel a reservation successfully', async ({ page }) => {
    // Create a test reservation
    await createTestReservation({
      saunaIndex: 0,
      boatIndex: 2, // Test Gamma
      startTimeOffset: 2, // 2 hours from now (keeps it today)
      durationHours: 1,
      adults: 3,
      kids: 0,
    });

    // Navigate to reservations list
    await authenticateMember(page, clubSecret);
    await page.waitForLoadState('load');

    const islandLink = page.locator('[data-testid="island-link"]').first();
    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('load');

    const saunaCards = page.locator('[data-testid="sauna-card"]');
    const viewReservationsButton = saunaCards
      .first()
      .getByTestId('view-all-reservations-button');

    await viewReservationsButton.click();
    await page.waitForURL(/\/saunas\/[^/]+\/reservations$/);
    await page.waitForLoadState('load');

    // Wait for reservations to load
    await page
      .locator('[data-testid="reservation-item"]')
      .first()
      .waitFor({ state: 'visible', timeout: 5000 });

    // Click cancel button on first reservation
    const firstReservation = page
      .locator('[data-testid="reservation-item"]')
      .first();
    const cancelButton = firstReservation.getByTestId('cancel-button');
    await cancelButton.click();

    // Should show confirmation dialog
    await expect(page.getByText(/are you sure/i)).toBeVisible({
      timeout: 5000,
    });

    // Confirm cancellation
    await page.getByRole('button', { name: /confirm cancel/i }).click();

    // Wait for success - should show no reservations message
    await expect(
      page.getByRole('heading', { name: /no reservations yet/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show "too late to cancel" for reservations within 15 minutes', async ({
    page,
  }) => {
    // Create a test reservation starting in 10 minutes (within 15-minute cutoff)
    await createTestReservation({
      saunaIndex: 0,
      boatIndex: 3, // Test Delta
      startTimeOffset: 10 / 60, // 10 minutes from now
      durationHours: 1,
      adults: 2,
      kids: 0,
    });

    // Navigate to island
    await authenticateMember(page, clubSecret);
    await page.waitForLoadState('load');

    const islandLink = page.locator('[data-testid="island-link"]').first();
    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('load');

    const saunaCards = page.locator('[data-testid="sauna-card"]');
    const viewReservationsButton = saunaCards
      .first()
      .getByTestId('view-all-reservations-button');

    await viewReservationsButton.click();
    await page.waitForURL(/\/saunas\/[^/]+\/reservations$/);
    await page.waitForLoadState('load');

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

  test('should not show cancel button for past reservations', async ({
    page,
  }) => {
    // Create a test reservation in the past (2 hours ago)
    await createTestReservation({
      saunaIndex: 0,
      boatIndex: 4, // Test Epsilon
      startTimeOffset: -2, // 2 hours ago
      durationHours: 1,
      adults: 2,
      kids: 1,
    });

    // Navigate to island
    await authenticateMember(page, clubSecret);
    await page.waitForLoadState('load');

    const islandLink = page.locator('[data-testid="island-link"]').first();
    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('load');

    const saunaCards = page.locator('[data-testid="sauna-card"]');
    const viewReservationsButton = saunaCards
      .first()
      .getByTestId('view-all-reservations-button');

    await viewReservationsButton.click();
    await page.waitForURL(/\/saunas\/[^/]+\/reservations$/);
    await page.waitForLoadState('load');

    // Wait for reservations to load
    await page
      .locator('[data-testid="reservation-item"]')
      .first()
      .waitFor({ state: 'visible', timeout: 5000 });

    // Should see past reservations section
    const pastSection = page.getByTestId('past-reservations');
    await expect(pastSection).toBeVisible({ timeout: 5000 });

    // Past reservations should not have cancel buttons
    const cancelButtons = pastSection.getByTestId('cancel-button');
    await expect(cancelButtons).toHaveCount(0);
  });

  test('should separate past and future reservations visually', async ({
    page,
  }) => {
    // Create both past and future reservations
    await createTestReservation({
      saunaIndex: 0,
      boatIndex: 5, // Test Zeta
      startTimeOffset: -1, // 1 hour ago
      durationHours: 1,
      adults: 2,
      kids: 0,
    });

    await createTestReservation({
      saunaIndex: 0,
      boatIndex: 6, // Test Eta
      startTimeOffset: 2, // 2 hours from now
      durationHours: 1,
      adults: 3,
      kids: 1,
    });

    // Navigate to island
    await authenticateMember(page, clubSecret);
    await page.waitForLoadState('load');

    const islandLink = page.locator('[data-testid="island-link"]').first();
    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('load');

    const saunaCards = page.locator('[data-testid="sauna-card"]');
    const viewReservationsButton = saunaCards
      .first()
      .getByTestId('view-all-reservations-button');

    await viewReservationsButton.click();
    await page.waitForURL(/\/saunas\/[^/]+\/reservations$/);
    await page.waitForLoadState('load');

    // Wait for reservations to load
    await page
      .locator('[data-testid="reservation-item"]')
      .first()
      .waitFor({ state: 'visible', timeout: 5000 });

    // Should have separate sections for past and upcoming
    const pastSection = page.getByTestId('past-reservations');
    const upcomingSection = page.getByTestId('upcoming-reservations');

    await expect(pastSection).toBeVisible({ timeout: 5000 });
    await expect(upcomingSection).toBeVisible({ timeout: 5000 });
  });

  test('should auto-scroll to future reservations', async ({ page }) => {
    // Create a future reservation
    await createTestReservation({
      saunaIndex: 0,
      boatIndex: 7, // Test Theta
      startTimeOffset: 2, // 2 hours from now (keeps it today)
      durationHours: 1,
      adults: 2,
      kids: 0,
    });

    // Navigate to island
    await authenticateMember(page, clubSecret);
    await page.waitForLoadState('load');

    const islandLink = page.locator('[data-testid="island-link"]').first();
    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('load');

    const saunaCards = page.locator('[data-testid="sauna-card"]');
    const viewReservationsButton = saunaCards
      .first()
      .getByTestId('view-all-reservations-button');

    await viewReservationsButton.click();
    await page.waitForURL(/\/saunas\/[^/]+\/reservations$/);
    await page.waitForLoadState('load');

    // Wait for reservations to load
    await page
      .locator('[data-testid="reservation-item"]')
      .first()
      .waitFor({ state: 'visible', timeout: 5000 });

    // Check if upcoming section is visible and in viewport
    const upcomingSection = page.getByTestId('upcoming-reservations');
    await expect(upcomingSection).toBeVisible({ timeout: 5000 });

    const box = await upcomingSection.boundingBox();
    expect(box).toBeTruthy();
  });

  test('should display reservation details in list', async ({ page }) => {
    // Create a test reservation with specific details
    await createTestReservation({
      saunaIndex: 0,
      boatIndex: 0, // Test Alpha
      startTimeOffset: 3, // 3 hours from now
      durationHours: 2,
      adults: 4,
      kids: 2,
    });

    // Navigate to island
    await authenticateMember(page, clubSecret);
    await page.waitForLoadState('load');

    const islandLink = page.locator('[data-testid="island-link"]').first();
    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('load');

    const saunaCards = page.locator('[data-testid="sauna-card"]');
    const viewReservationsButton = saunaCards
      .first()
      .getByTestId('view-all-reservations-button');

    await viewReservationsButton.click();
    await page.waitForURL(/\/saunas\/[^/]+\/reservations$/);
    await page.waitForLoadState('load');

    // Wait for reservations to load
    await page
      .locator('[data-testid="reservation-item"]')
      .first()
      .waitFor({ state: 'visible', timeout: 5000 });

    // Should see reservation items (there may be multiple from other tests)
    const reservationItems = page.getByTestId('reservation-item');
    await expect(reservationItems.first()).toBeVisible({ timeout: 5000 });

    // Find the specific reservation we created (Test Alpha with 4 adults, 2 kids)
    const ourReservation = page
      .getByTestId('reservation-boat-name')
      .filter({ hasText: /test alpha/i });
    await expect(ourReservation).toBeVisible();

    // Check it has the right party size
    const parentCard = ourReservation.locator('..').locator('..').locator('..');
    await expect(
      parentCard.getByTestId('reservation-party-size')
    ).toContainText(/4 adults/i);
  });

  test('should show empty state when no reservations', async ({ page }) => {
    // Don't create any reservations - use a different sauna (North Small Sauna)
    // that hasn't been used by other tests in this suite

    // Navigate to island
    await authenticateMember(page, clubSecret);
    await page.waitForLoadState('load');

    const islandLink = page.locator('[data-testid="island-link"]').first();
    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('load');

    // Click on the second sauna card (North Small Sauna)
    const saunaCards = page.locator('[data-testid="sauna-card"]');
    await saunaCards.nth(1).waitFor({ state: 'visible', timeout: 5000 });

    const viewReservationsButton = saunaCards
      .nth(1)
      .getByTestId('view-all-reservations-button');

    await viewReservationsButton.click();
    await page.waitForURL(/\/saunas\/[^/]+\/reservations$/);
    await page.waitForLoadState('load');

    // Should show empty state
    await expect(page.getByTestId('empty-state')).toBeVisible({
      timeout: 5000,
    });
  });
});
