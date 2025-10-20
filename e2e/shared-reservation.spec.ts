import { test, expect } from '@playwright/test';
import { authenticateMember } from './helpers/auth-helper';
import { cleanupTodaysReservations } from './helpers/db-cleanup';
import { loginAsAdmin } from './helpers/test-data';
import {
  getTestClubSecret,
  createTestSharedReservation,
} from './helpers/test-fixtures';

test.describe('Shared Reservation - Admin Creation', () => {
  test.beforeEach(async ({ page }) => {
    await cleanupTodaysReservations();
    await loginAsAdmin(page);
    await page.goto('/admin/shared-reservations');
    await page.waitForLoadState('networkidle');
  });

  test('should display shared reservations list', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /shared.*reservations/i })
    ).toBeVisible();
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

  test('should show delete button for shared reservations', async ({
    page,
  }) => {
    const testName = `Test Shared ${Date.now()}`;

    // Create a test shared reservation
    await createTestSharedReservation({
      saunaIndex: 0,
      startTimeOffset: 24, // Tomorrow
      name: testName,
      malesDurationHours: 2,
      femalesDurationHours: 2,
      genderOrder: 'FEMALES_FIRST',
    });

    // Refresh to see it
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Find the reservation with our test name
    const reservationCard = page
      .getByTestId('shared-reservation-item')
      .filter({ hasText: testName });
    await expect(reservationCard).toBeVisible({ timeout: 5000 });

    // Should have a delete button
    const deleteButton = reservationCard.getByTestId('delete-button');
    await expect(deleteButton).toBeVisible();
  });
});

test.describe('Shared Reservation - User Joining', () => {
  let clubSecret: string;

  test.beforeAll(async () => {
    clubSecret = getTestClubSecret();
  });

  test.beforeEach(async () => {
    await cleanupTodaysReservations();
  });

  test('should display shared reservation option on island view', async ({
    page,
  }) => {
    // Create a shared reservation for today (3 hours from now)
    await createTestSharedReservation({
      saunaIndex: 0,
      startTimeOffset: 3, // 3 hours from now (today)
      name: 'Weekend Social',
      malesDurationHours: 2,
      femalesDurationHours: 2,
      genderOrder: 'MALES_FIRST',
    });

    // Navigate to island
    await authenticateMember(page, clubSecret);
    await page.waitForLoadState('networkidle');

    const islandLink = page.locator('[data-testid="island-link"]').first();
    await islandLink.waitFor({ state: 'visible', timeout: 5000 });
    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('networkidle');

    // Wait for sauna cards to load
    const saunaCards = page.locator('[data-testid="sauna-card"]');
    await saunaCards.first().waitFor({ state: 'visible', timeout: 5000 });

    // Should show shared sauna indicator (button)
    const joinButton = page.getByRole('button', { name: /join.*club.*sauna/i });
    await expect(joinButton).toBeVisible({ timeout: 5000 });
  });

  test('should join a shared reservation', async ({ page }) => {
    // Create a shared reservation for today
    await createTestSharedReservation({
      saunaIndex: 0,
      startTimeOffset: 4, // 4 hours from now (today)
      name: 'Join Test',
      malesDurationHours: 2,
      femalesDurationHours: 2,
      genderOrder: 'MALES_FIRST',
    });

    // Navigate to island
    await authenticateMember(page, clubSecret);
    await page.waitForLoadState('networkidle');

    const islandLink = page.locator('[data-testid="island-link"]').first();
    await islandLink.waitFor({ state: 'visible', timeout: 5000 });
    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('networkidle');

    // Wait for sauna cards to load
    const saunaCards = page.locator('[data-testid="sauna-card"]');
    await saunaCards.first().waitFor({ state: 'visible', timeout: 5000 });

    // Look for "Join Club Sauna" button
    const joinButton = page.getByRole('button', {
      name: /join.*club.*sauna/i,
    });

    await expect(joinButton).toBeVisible({ timeout: 5000 });
    await joinButton.click();

    // Wait for navigation to shared reservation page
    await page.waitForURL(/\/shared\/[^/]+/);
    await page.waitForLoadState('networkidle');

    // Should show gender schedule information (looking for time slots with gender labels)
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/men|women|male|female/i);

    // Successfully navigated to shared reservation detail page
    expect(page.url()).toMatch(/\/shared\//);
  });

  test('should display gender schedule for shared reservation', async ({
    page,
  }) => {
    // Create a shared reservation for today
    await createTestSharedReservation({
      saunaIndex: 0,
      startTimeOffset: 5, // 5 hours from now (today)
      name: 'Schedule Test',
      malesDurationHours: 2,
      femalesDurationHours: 2,
      genderOrder: 'FEMALES_FIRST',
    });

    // Navigate to island
    await authenticateMember(page, clubSecret);
    await page.waitForLoadState('networkidle');

    const islandLink = page.locator('[data-testid="island-link"]').first();
    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('networkidle');

    const joinButton = page.getByRole('button', {
      name: /join.*club.*sauna/i,
    });

    await expect(joinButton).toBeVisible({ timeout: 5000 });
    await joinButton.click();

    // Should display gender schedule with times
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/\d{1,2}:\d{2}/); // Time format
    expect(pageContent).toMatch(/males|females|men|women/i);
  });

  test('should show current participants in shared reservation', async ({
    page,
  }) => {
    // Create a shared reservation with a participant for today
    await createTestSharedReservation({
      saunaIndex: 0,
      startTimeOffset: 6, // 6 hours from now (today)
      name: 'Participants Test',
      malesDurationHours: 2,
      femalesDurationHours: 2,
      genderOrder: 'MALES_FIRST',
      participants: [
        {
          boatIndex: 0,
          adults: 2,
          kids: 1,
        },
      ],
    });

    // Navigate to island
    await authenticateMember(page, clubSecret);
    await page.waitForLoadState('networkidle');

    const islandLink = page.locator('[data-testid="island-link"]').first();
    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('networkidle');

    const joinButton = page.getByRole('button', {
      name: /join.*club.*sauna/i,
    });

    await expect(joinButton).toBeVisible({ timeout: 5000 });
    await joinButton.click();

    // Look for participants section or text
    const participantText = page.getByText(/participants|boats|test alpha/i);
    await expect(participantText.first()).toBeVisible();
  });
});

test.describe('Club Sauna Auto-creation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should verify Club Sauna settings exist', async ({ page }) => {
    await page.goto('/admin/saunas');
    await page.waitForLoadState('networkidle');

    // Should have sauna items from test fixtures
    const firstSauna = page.locator('[data-testid="sauna-item"]').first();
    await expect(firstSauna).toBeVisible({ timeout: 5000 });

    // Click edit button
    await firstSauna.getByRole('button', { name: /edit/i }).click();
    await page.waitForLoadState('networkidle');

    // Should have auto Club Sauna option
    const autoClubCheckbox = page.getByLabel(/auto.*club.*sauna|enable.*club/i);
    await expect(autoClubCheckbox).toBeVisible();
  });

  test('should toggle auto Club Sauna generation setting', async ({ page }) => {
    await page.goto('/admin/saunas');
    await page.waitForLoadState('networkidle');

    // Should have sauna items from test fixtures
    const firstSauna = page.locator('[data-testid="sauna-item"]').first();
    await expect(firstSauna).toBeVisible({ timeout: 5000 });

    // Click edit button
    await firstSauna.getByRole('button', { name: /edit/i }).click();
    await page.waitForLoadState('networkidle');

    // Find the auto Club Sauna checkbox
    const autoClubCheckbox = page.getByLabel(/auto.*club.*sauna|enable.*club/i);
    await expect(autoClubCheckbox).toBeVisible();

    // Get initial state
    const wasChecked = await autoClubCheckbox.isChecked();

    // Toggle it
    await autoClubCheckbox.click();

    // Save
    await page.getByRole('button', { name: /save|update/i }).click();

    // Should show success message
    await expect(page.getByText(/success|updated|saved/i)).toBeVisible({
      timeout: 5000,
    });

    // Verify the change persisted by re-opening edit form
    await page.waitForTimeout(500);
    await firstSauna.getByRole('button', { name: /edit/i }).click();
    await page.waitForLoadState('networkidle');

    const newCheckbox = page.getByLabel(/auto.*club.*sauna|enable.*club/i);

    // Should be opposite of what it was
    if (wasChecked) {
      await expect(newCheckbox).not.toBeChecked();
    } else {
      await expect(newCheckbox).toBeChecked();
    }
  });
});
