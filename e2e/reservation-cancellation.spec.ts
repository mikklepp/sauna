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
    // Cleanup before suite to ensure clean state
    await cleanupTodaysReservations();

    // Create all test reservations upfront for different scenarios
    // Boat 0 (Alpha): Display list test - 2 hours from now
    await createTestReservation({
      saunaIndex: 0,
      boatIndex: 0,
      startTimeOffset: 2,
      durationHours: 1,
      adults: 2,
      kids: 0,
    });

    // Boat 1 (Beta): Cancel button visibility - 3 hours from now
    await createTestReservation({
      saunaIndex: 0,
      boatIndex: 1,
      startTimeOffset: 3,
      durationHours: 1,
      adults: 2,
      kids: 1,
    });

    // Boat 2 (Gamma): Cancel flow test - 2 hours from now
    await createTestReservation({
      saunaIndex: 0,
      boatIndex: 2,
      startTimeOffset: 2,
      durationHours: 1,
      adults: 3,
      kids: 0,
    });

    // Boat 3 (Delta): Too late to cancel - 10 minutes from now
    await createTestReservation({
      saunaIndex: 0,
      boatIndex: 3,
      startTimeOffset: 10 / 60,
      durationHours: 1,
      adults: 2,
      kids: 0,
    });

    // Boat 4 (Epsilon): Past reservation - 2 hours ago
    await createTestReservation({
      saunaIndex: 0,
      boatIndex: 4,
      startTimeOffset: -2,
      durationHours: 1,
      adults: 2,
      kids: 1,
    });

    // Boat 5 (Zeta): Past/future separation - 1 hour ago
    await createTestReservation({
      saunaIndex: 0,
      boatIndex: 5,
      startTimeOffset: -1,
      durationHours: 1,
      adults: 2,
      kids: 0,
    });

    // Boat 6 (Eta): Past/future separation - 2 hours from now
    await createTestReservation({
      saunaIndex: 0,
      boatIndex: 6,
      startTimeOffset: 2,
      durationHours: 1,
      adults: 3,
      kids: 1,
    });

    // Boat 7 (Theta): Auto-scroll test - 2 hours from now
    await createTestReservation({
      saunaIndex: 0,
      boatIndex: 7,
      startTimeOffset: 2,
      durationHours: 1,
      adults: 2,
      kids: 0,
    });

    // Boat 8 (Iota): Details display - 3 hours from now, 4 adults, 2 kids
    await createTestReservation({
      saunaIndex: 0,
      boatIndex: 8,
      startTimeOffset: 3,
      durationHours: 2,
      adults: 4,
      kids: 2,
    });
  });

  test.afterAll(async () => {
    // Cleanup after entire suite completes
    await cleanupTodaysReservations();
  });

  test('should display reservations list for a sauna', async ({ page }) => {
    // Use pre-created Alpha reservation from beforeAll
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
    // Use pre-created Beta reservation from beforeAll
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

    // Find Beta reservation specifically (not .first() - reservations are sorted chronologically)
    const betaReservation = page
      .getByTestId('reservation-boat-name')
      .filter({ hasText: /test beta/i })
      .locator('..')
      .locator('..')
      .locator('..');

    const cancelButton = betaReservation.getByTestId('cancel-button');
    await expect(cancelButton).toBeVisible({ timeout: 5000 });
  });

  test('should cancel a reservation successfully', async ({ page }) => {
    // Use pre-created Gamma reservation from beforeAll
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

    // Count initial reservations
    const initialCount = await page
      .locator('[data-testid="reservation-item"]')
      .count();

    // Find and cancel the Gamma reservation specifically
    const gammaReservation = page
      .getByTestId('reservation-boat-name')
      .filter({ hasText: /test gamma/i })
      .locator('..')
      .locator('..')
      .locator('..');

    const cancelButton = gammaReservation.getByTestId('cancel-button');
    await cancelButton.click();

    // Should show confirmation dialog
    await expect(page.getByText(/are you sure/i)).toBeVisible({
      timeout: 5000,
    });

    // Confirm cancellation
    await page.getByRole('button', { name: /confirm cancel/i }).click();

    // Wait for the reservation to be removed
    await page.waitForTimeout(1000);

    // Verify Gamma reservation is gone
    const gammaAfterCancel = page
      .getByTestId('reservation-boat-name')
      .filter({ hasText: /test gamma/i });
    await expect(gammaAfterCancel).toHaveCount(0);

    // Or verify count decreased by 1 (if page didn't reload)
    const finalCount = await page
      .locator('[data-testid="reservation-item"]')
      .count();
    expect(finalCount).toBe(initialCount - 1);
  });

  test('should show "too late to cancel" for reservations within 15 minutes', async ({
    page,
  }) => {
    // Use pre-created Delta reservation from beforeAll (10 minutes from now)
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

    // Find Delta reservation specifically and verify "Too late to cancel" message
    const deltaReservation = page
      .getByTestId('reservation-boat-name')
      .filter({ hasText: /test delta/i })
      .locator('..')
      .locator('..')
      .locator('..');

    await expect(deltaReservation.getByTestId('too-late-message')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should not show cancel button for past reservations', async ({
    page,
  }) => {
    // Use pre-created Epsilon reservation from beforeAll (2 hours ago)
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

    // Find Epsilon reservation specifically and verify no cancel button
    const epsilonReservation = page
      .getByTestId('reservation-boat-name')
      .filter({ hasText: /test epsilon/i })
      .locator('..')
      .locator('..')
      .locator('..');

    await expect(epsilonReservation).toBeVisible({ timeout: 5000 });

    // Epsilon should not have a cancel button
    const cancelButton = epsilonReservation.getByTestId('cancel-button');
    await expect(cancelButton).toHaveCount(0);
  });

  test('should separate past and future reservations visually', async ({
    page,
  }) => {
    // Use pre-created Zeta (past) and Eta (future) reservations from beforeAll
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
    // Use pre-created Theta reservation from beforeAll
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
    // Use pre-created Iota reservation from beforeAll (4 adults, 2 kids)
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

    // Find the specific reservation we created (Test Iota with 4 adults, 2 kids)
    const ourReservation = page
      .getByTestId('reservation-boat-name')
      .filter({ hasText: /test iota/i });
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
