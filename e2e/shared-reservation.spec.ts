import { test, expect } from '@playwright/test';
import { authenticateMember } from './helpers/auth-helper';
import { getTestClubSecret } from './helpers/test-fixtures';
import { loginAsAdmin } from './helpers/test-data';

// Helper to find sauna by name
const findSaunaByName = (page: any, name: string) =>
  page
    .getByTestId('sauna-item')
    .filter({ hasText: new RegExp(name, 'i') })
    .first();

// Helper to find island by name
const findIslandByName = (page: any, name: string) =>
  page
    .locator('[data-testid="island-link"]')
    .filter({ hasText: new RegExp(name, 'i') })
    .first();

test.describe('Shared Reservation - Admin Creation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/shared-reservations', { waitUntil: 'commit' });
    await page.waitForLoadState('load');
  });

  test('should display shared reservations list with test data', async ({
    page,
  }) => {
    // Verify page header is visible
    await expect(page.getByTestId('page-title')).toBeVisible();

    // Verify filter buttons are present (upcoming/past/all)
    await expect(page.getByTestId('filter-upcoming')).toBeVisible();
    await expect(page.getByTestId('filter-past')).toBeVisible();
    await expect(page.getByTestId('filter-all')).toBeVisible();

    // Verify create button is present
    await expect(page.getByTestId('create-shared-button')).toBeVisible();

    // Verify that test shared reservations are displayed
    const upcomingReservation = page
      .getByTestId('shared-reservation-item')
      .filter({
        has: page.getByTestId('reservation-name').filter({
          hasText: /Test Upcoming Sauna Event/i,
        }),
      })
      .first();

    await expect(upcomingReservation).toBeVisible();

    // Verify participant count is shown
    await expect(
      upcomingReservation.getByTestId('participant-count')
    ).toContainText('2 participants');
  });

  test('should create a new shared reservation', async ({ page }) => {
    // Click create button
    await page.getByTestId('create-shared-button').click();
    await page.waitForURL(/\/new$/);

    // Fill form using test identifiers
    await page.getByTestId('sauna-select').selectOption({ index: 1 });

    // Set date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    await page.getByTestId('date-input').fill(dateString);

    // Set start time
    await page.getByTestId('start-time-select').selectOption('18:00');

    // Set durations
    await page.getByTestId('men-duration-select').selectOption('2');
    await page.getByTestId('women-duration-select').selectOption('2');

    // Set gender order
    await page.getByTestId('gender-order-select').selectOption('MALES_FIRST');

    // Optional name
    await page.getByTestId('event-name-input').fill('Test Shared Sauna');

    // Create
    await page.getByTestId('create-button').click();

    // Should redirect back to list
    await page.waitForURL(/\/admin\/shared-reservations$/);
  });

  test.skip('should edit a shared reservation', async () => {
    // Note: Edit functionality for shared reservations is not implemented in the admin UI
    // The admin list page only has delete buttons, not edit buttons
  });
});

test.describe('Shared Reservation - Member Features', () => {
  let clubSecret: string;

  test.beforeAll(async () => {
    clubSecret = getTestClubSecret();
  });

  test('should display shared reservation on island and allow joining', async ({
    page,
  }) => {
    // Use the global test data "Test Upcoming Sauna Event" created in setup
    await authenticateMember(page, clubSecret);
    await page.waitForLoadState('load');

    // Navigate to Test North Island (where the shared reservation was created)
    const islandLink = findIslandByName(page, 'Test North Island');
    await islandLink.waitFor({ state: 'visible', timeout: 5000 });
    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('load');

    // Find North Main Sauna (where the shared reservation was created)
    const saunaCard = page
      .getByTestId('sauna-card')
      .filter({ hasText: /North Main Sauna/i })
      .first(); // Note: Different from sauna-item (admin), this is sauna-card (member view)

    // Find the global test shared reservation within that sauna
    const upcomingReservation = saunaCard
      .locator('*')
      .filter({ hasText: /Test Upcoming Sauna Event/i })
      .filter({ has: page.getByRole('button', { name: /join.*club.*sauna/i }) })
      .first();

    await upcomingReservation.waitFor({ state: 'visible', timeout: 5000 });

    // Should show join button for the shared reservation
    const joinButton = upcomingReservation.getByRole('button', {
      name: /join.*club.*sauna/i,
    });
    await expect(joinButton).toBeVisible({ timeout: 5000 });

    // Click to join and verify navigation to shared reservation page
    await joinButton.click();
    await page.waitForURL(/\/shared\/[^/]+/);
    await page.waitForLoadState('load');

    // Verify the shared reservation details page shows gender schedule information
    await expect(page.getByTestId('gender-schedule')).toBeVisible();
    await expect(page.getByTestId('schedule-text')).toContainText(
      /\d{2}:\d{2}/
    );

    // Allow joining - click the "Join This Shared Sauna" button
    await page.getByRole('button', { name: /join this shared sauna/i }).click();

    // Should navigate to boat selection step
    await expect(page.getByTestId('boat-selection-card')).toBeVisible();
  });
});

test.describe('Club Sauna Auto-creation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should verify Club Sauna settings exist', async ({ page }) => {
    await page.goto('/admin/saunas', { waitUntil: 'commit' });
    await page.waitForLoadState('load');

    const saunaItem = findSaunaByName(page, 'North Main Sauna');
    await expect(saunaItem).toBeVisible({ timeout: 5000 });

    // Click edit button
    await saunaItem.getByTestId('edit-sauna-button').click();

    // Wait for navigation to edit page
    await page.waitForURL(/\/admin\/saunas\/.+\/edit/);
    await page.waitForLoadState('load');

    // Should have auto Club Sauna option
    const autoClubCheckbox = page.getByTestId('auto-club-sauna-checkbox');
    await expect(autoClubCheckbox).toBeVisible({ timeout: 10000 });
  });

  test('should toggle auto Club Sauna generation setting', async ({ page }) => {
    await page.goto('/admin/saunas', { waitUntil: 'commit' });
    await page.waitForLoadState('load');

    let saunaItem = findSaunaByName(page, 'North Main Sauna');
    await expect(saunaItem).toBeVisible({ timeout: 5000 });

    // Click edit button
    await saunaItem.getByTestId('edit-sauna-button').click();

    // Wait for navigation to edit page
    await page.waitForURL(/\/admin\/saunas\/.+\/edit/);
    await page.waitForLoadState('load');

    // Find the auto Club Sauna checkbox
    const autoClubCheckbox = page.getByTestId('auto-club-sauna-checkbox');
    await expect(autoClubCheckbox).toBeVisible({ timeout: 10000 });

    // Get initial state
    const wasChecked = await autoClubCheckbox.isChecked();

    // Toggle it
    await autoClubCheckbox.click();

    // Save
    await page.getByTestId('save-button').click();

    // Should show success message
    await expect(page.getByTestId('success-message')).toBeVisible({
      timeout: 5000,
    });

    // Wait for redirect back to list
    await page.waitForURL(/\/admin\/saunas$/);
    await page.waitForLoadState('load');

    // Verify the change persisted by re-opening the same sauna's edit form
    saunaItem = findSaunaByName(page, 'North Main Sauna');
    await expect(saunaItem).toBeVisible();

    await saunaItem.getByTestId('edit-sauna-button').click();
    await page.waitForURL(/\/admin\/saunas\/.+\/edit/);
    await page.waitForLoadState('load');

    const newCheckbox = page.getByTestId('auto-club-sauna-checkbox');
    await expect(newCheckbox).toBeVisible({ timeout: 10000 });

    // Should be opposite of what it was
    if (wasChecked) {
      await expect(newCheckbox).not.toBeChecked();
    } else {
      await expect(newCheckbox).toBeChecked();
    }
  });
});
