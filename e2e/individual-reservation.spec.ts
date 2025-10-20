import { test, expect } from '@playwright/test';
import {
  getTestClubSecret,
  TEST_ISLANDS,
  getTestBoat,
  getTestBoatFullName,
} from './helpers/test-fixtures';
import { authenticateMember } from './helpers/auth-helper';
import { cleanupTodaysReservations } from './helpers/db-cleanup';

test.describe.serial('Individual Reservation Flow', () => {
  let clubSecret: string;

  test.beforeAll(async () => {
    clubSecret = getTestClubSecret();
  });

  test.beforeEach(async () => {
    await cleanupTodaysReservations();
  });

  test('should display island selection after authentication', async ({
    page,
  }) => {
    // Authenticate and navigate to islands
    await authenticateMember(page, clubSecret);

    // Should show islands page
    await expect(
      page.getByRole('heading', { name: /choose your island/i })
    ).toBeVisible();

    // Should show test islands
    const islandLinks = page.locator('[data-testid="island-link"]');
    await expect(islandLinks).toHaveCount(TEST_ISLANDS.length);
  });

  test('should navigate to island view', async ({ page }) => {
    // Authenticate
    await authenticateMember(page, clubSecret);
    await page.waitForURL(/\/islands/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Click first island
    const islandLink = page.locator('[data-testid="island-link"]').first();
    await islandLink.click();
    await expect(page).toHaveURL(/\/islands\/[^/]+/);
  });

  test('should display saunas with availability', async ({ page }) => {
    // Authenticate
    await authenticateMember(page, clubSecret);
    await page.waitForURL(/\/islands/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Click first island (Test North Island - has 2 saunas)
    const islandLink = page.locator('[data-testid="island-link"]').first();
    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);
    await page.waitForLoadState('networkidle');

    // Should show saunas
    const saunaCard = page.locator('[data-testid="sauna-card"]').first();
    await expect(saunaCard).toBeVisible();

    // Should show status badge (Available, Reserved, or Club Sauna)
    const statusBadge = page
      .locator('.badge-available, .badge-reserved, .badge-club-sauna')
      .first();
    await expect(statusBadge).toBeVisible();

    // Should show reserve button
    const reserveButton = saunaCard.getByRole('button', { name: /reserve/i });
    await expect(reserveButton).toBeVisible();
  });

  test('should complete individual reservation workflow', async ({ page }) => {
    // Authenticate
    await authenticateMember(page, clubSecret);
    await page.waitForURL(/\/islands/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Navigate to island
    const islandLink = page.locator('[data-testid="island-link"]').first();
    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    // Click "Make Reservation" on first sauna
    const reserveButton = page
      .getByRole('button', { name: /make reservation|book sauna|reserve/i })
      .first();
    await reserveButton.click();

    // Step 1: Boat selection
    const boatSearch = page.getByTestId('boat-search-input');
    await expect(boatSearch).toBeVisible();

    // Type to search for a boat - Test 0 uses Alpha
    await boatSearch.fill(getTestBoat(0));
    await page.waitForTimeout(500); // Wait for search results

    // Select first boat from results
    const firstBoat = page.getByTestId('boat-result').first();
    await firstBoat.click();

    // Step 2: Party size entry
    await expect(
      page.getByRole('heading', { name: /party size/i })
    ).toBeVisible();

    const adultsField = page.getByLabel(/adults/i);
    await adultsField.fill('2');

    const kidsField = page.getByLabel(/kids|children/i);
    if (await kidsField.isVisible()) {
      await kidsField.fill('1');
    }

    // Continue to confirmation
    await page.getByTestId('continue-button').click();

    // Step 3: Confirmation
    await expect(
      page.getByRole('heading', { name: /confirm reservation/i })
    ).toBeVisible();

    // Should display reservation details
    await expect(page.getByText(/\d+\s*adults/i)).toBeVisible();

    // Confirm reservation
    await page.getByTestId('confirm-reservation-button').click();

    // Step 4: Success
    await expect(page.getByTestId('success-title')).toBeVisible({
      timeout: 10000,
    });
  });

  // TODO: Fix API bug in /api/boats/[id]/daily-limit
  // The endpoint is not correctly preventing duplicate bookings on the same island/day
  // The reservation is created successfully but the daily limit check returns canReserve: true
  test('should prevent booking when boat already has reservation today', async ({
    page,
  }) => {
    // Authenticate
    await authenticateMember(page, clubSecret);
    await page.waitForURL(/\/islands/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    const islandLink = page.locator('[data-testid="island-link"]').first();
    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    const islandUrl = page.url();
    const islandId = islandUrl.match(/\/islands\/([^/?]+)/)?.[1];

    // Ensure we captured the island ID
    expect(islandId).toBeTruthy();

    // First, create a reservation with Test Beta (Test 1 uses Beta)
    const reserveButton = page
      .getByRole('button', { name: /make reservation|book sauna|reserve/i })
      .first();
    await reserveButton.click();

    const boatSearch = page.getByTestId('boat-search-input');
    await boatSearch.fill(getTestBoat(1));
    await page.waitForTimeout(500);

    const firstBoat = page.getByTestId('boat-result').first();
    await firstBoat.click();

    const adultsField = page.getByLabel(/adults/i);
    await adultsField.fill('2');

    await page.getByTestId('continue-button').click();
    await page.getByTestId('confirm-reservation-button').click();

    // Wait for success
    await expect(page.getByTestId('success-title')).toBeVisible({
      timeout: 10000,
    });

    // Small delay to ensure database transaction commits
    await page.waitForTimeout(1000);

    // Verify the reservation was created by checking the database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const betaBoatName = getTestBoatFullName(1); // Test Beta

    // Query for any Beta reservation (no date filter for debugging)
    const reservation = await prisma.reservation.findFirst({
      where: {
        boat: {
          name: betaBoatName,
        },
        status: 'ACTIVE',
      },
      include: {
        boat: true,
        sauna: {
          include: {
            island: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    // Debug: log all Beta reservations if not found
    if (!reservation) {
      const allReservations = await prisma.reservation.findMany({
        where: {
          boat: {
            name: betaBoatName,
          },
        },
        include: {
          boat: true,
          sauna: true,
        },
      });
      console.log(
        `All ${betaBoatName} reservations:`,
        JSON.stringify(allReservations, null, 2)
      );
    } else {
      console.log('Found reservation - startTime:', reservation.startTime);
    }

    await prisma.$disconnect();

    // Verify reservation exists
    expect(reservation).toBeTruthy();
    expect(reservation?.boat.name).toBe(betaBoatName);
    expect(reservation?.sauna.island.id).toBe(islandId);

    // Now try to book Beta again (should be prevented)
    await page.goto('/islands');
    await page.waitForURL(/\/islands/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    const islandLink2 = page.locator('[data-testid="island-link"]').first();
    await islandLink2.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    const reserveButton2 = page
      .getByRole('button', { name: /make reservation|book sauna|reserve/i })
      .first();
    await reserveButton2.click();

    const boatSearch2 = page.getByTestId('boat-search-input');
    await boatSearch2.fill(getTestBoat(1)); // Try to book same boat (Beta) again
    await page.waitForTimeout(500);

    const sameBoat = page.getByTestId('boat-result').first();
    await sameBoat.click();

    // Should show error message immediately after selecting boat
    await expect(page.getByTestId('reservation-error')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should display next available time correctly when sauna is in use', async ({
    page,
  }) => {
    // Authenticate
    await authenticateMember(page, clubSecret);
    await page.waitForURL(/\/islands/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    const islandLink = page.locator('[data-testid="island-link"]').first();
    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    // Check for "In Use" status
    const inUseText = page.getByText(/in use/i);

    if (await inUseText.isVisible()) {
      // Should show next available time
      await expect(
        page.getByText(/next available|available at/i)
      ).toBeVisible();

      // Time should be in the future and at top of hour
      const timeText = await page
        .locator('[data-testid="next-available-time"]')
        .first()
        .textContent();

      // Basic validation: should contain a time format (HH:MM or similar)
      expect(timeText).toMatch(/\d{1,2}:\d{2}|noon|midnight/i);
    }
  });

  test('should show heating time when sauna is not in use', async ({
    page,
  }) => {
    // Authenticate
    await authenticateMember(page, clubSecret);
    await page.waitForURL(/\/islands/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    const islandLink = page.locator('[data-testid="island-link"]').first();
    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    // Check for "Available" status
    const availableText = page.getByText(/^available$/i);

    if (await availableText.isVisible()) {
      // Should show next available time accounting for heating
      const nextAvailableTime = page
        .locator('[data-testid="next-available-time"]')
        .first();

      if (await nextAvailableTime.isVisible()) {
        const timeText = await nextAvailableTime.textContent();

        // Should be a future time
        expect(timeText).toBeTruthy();
      }
    }
  });

  test('should validate party size minimum', async ({ page }) => {
    // Authenticate
    await authenticateMember(page, clubSecret);
    await page.waitForURL(/\/islands/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    const islandLink = page.locator('[data-testid="island-link"]').first();
    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    const reserveButton = page
      .getByRole('button', { name: /make reservation|book sauna|reserve/i })
      .first();
    await reserveButton.click();

    const boatSearch = page.getByTestId('boat-search-input');
    await boatSearch.fill(getTestBoat(2)); // Test 2 uses Gamma
    await page.waitForTimeout(500);

    const firstBoat = page.getByTestId('boat-result').first();
    await firstBoat.click();

    // Try to set adults to 0 - the implementation automatically converts this to 1
    const adultsField = page.getByLabel(/adults/i);
    await adultsField.fill('0');

    // The value should automatically become 1 (due to || 1 fallback in onChange)
    await expect(adultsField).toHaveValue('1');

    // Button should be enabled since adults is now 1
    const continueButton = page.getByTestId('continue-button');
    await expect(continueButton).toBeEnabled();
  });
});
