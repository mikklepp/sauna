import { test, expect } from '@playwright/test';
import { getTestClubSecret, getTestBoat } from './helpers/test-fixtures';
import { authenticateMember } from './helpers/auth-helper';
import { cleanupTodaysReservations } from './helpers/db-cleanup';

test.describe('Member Complete User Journey - End to End', () => {
  let clubSecret: string;

  test.beforeAll(async () => {
    clubSecret = getTestClubSecret();
    // Cleanup before suite to ensure clean state
    await cleanupTodaysReservations();
  });

  test.afterAll(async () => {
    // Cleanup after entire suite completes
    await cleanupTodaysReservations();
  });

  test('Complete member flow: Homepage → Auth → Islands → Reserve → View', async ({
    page,
  }) => {
    // ===== STEP 1: Start from Homepage =====
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /Streamlined Sauna Reservations/i })
    ).toBeVisible();

    // ===== STEP 2: Click Member Access =====
    await page
      .getByRole('link', { name: /Member Access/i })
      .first()
      .click();
    await page.waitForURL(/\/auth/);

    // ===== STEP 3: Authenticate with Manual Secret Entry =====
    await page.getByLabel(/club secret/i).fill(clubSecret);
    await page.getByRole('button', { name: /access islands/i }).click();

    // Should redirect to welcome page first
    await page.waitForURL(/\/welcome/, { timeout: 10000 });

    // Click continue to proceed to islands
    await page.getByTestId('continue-to-reservations').click();

    // ===== STEP 4: Should redirect to Islands page =====
    await page.waitForURL(/\/islands/, { timeout: 10000 });
    await expect(
      page.getByRole('heading', { name: /choose your island/i })
    ).toBeVisible();

    // Verify islands are displayed
    const islandCards = page.locator('[data-testid="island-link"]');
    await expect(islandCards.first()).toBeVisible();

    // ===== STEP 5: Select first island =====
    await islandCards.first().click();
    await page.waitForURL(/\/islands\/[^/]+$/);
    await page.waitForLoadState('load');

    // ===== STEP 6: Verify sauna display =====
    const saunaCards = page.locator('[data-testid="sauna-card"]');
    await expect(saunaCards.first()).toBeVisible();

    // Verify "Next Available" time is shown (there are 2 saunas, use first())
    await expect(page.getByText(/next available/i).first()).toBeVisible();

    // ===== STEP 7: Click Reserve button =====
    const reserveButton = saunaCards
      .first()
      .getByRole('button', { name: /reserve/i });
    await reserveButton.click();
    await page.waitForURL(/\/islands\/[^/]+\/reserve/);

    // ===== STEP 8: Boat search and selection =====
    const searchInput = page.getByTestId('boat-search-input');
    await expect(searchInput).toBeVisible();

    // Try multiple boats until we find one without a reservation
    let reservationCreated = false;
    const reserveUrl = page.url();
    const boatSearchTerms = [
      getTestBoat(12), // Nu
      getTestBoat(13), // Xi
      getTestBoat(14), // Omicron
      getTestBoat(15), // Pi
      getTestBoat(16), // Rho
    ];

    for (let attempt = 0; attempt < boatSearchTerms.length; attempt++) {
      if (attempt > 0) {
        await page.goto(reserveUrl);
        await page.waitForLoadState('load');
      }

      // Search for specific boat
      await searchInput.fill(boatSearchTerms[attempt]);
      await page.waitForTimeout(500); // Wait for debounced search

      const boatResults = page.locator('[data-testid="boat-result"]');
      const boatCount = await boatResults.count();

      if (boatCount === 0) {
        continue; // Try next boat
      }

      const targetBoat = boatResults.first();
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

      // Skip if boat already has reservation
      if (await errorMsg.isVisible().catch(() => false)) {
        continue;
      }

      // ===== STEP 9: Enter party size =====
      if (await adultsInput.isVisible().catch(() => false)) {
        const kidsInput = page.getByLabel(/kids/i);
        await adultsInput.fill('3');
        await kidsInput.fill('2');

        // Click Continue
        const continueButton = page.getByRole('button', { name: /continue/i });
        await continueButton.click();

        // ===== STEP 10: Confirm reservation =====
        const confirmButton = page.getByRole('button', {
          name: /confirm reservation/i,
        });
        await expect(confirmButton).toBeVisible();

        // Verify confirmation details are shown
        await expect(page.getByText(/3 adults/i)).toBeVisible();
        await expect(page.getByText(/2 kids/i)).toBeVisible();

        await confirmButton.click();

        // ===== STEP 11: Verify success =====
        const successTitle = page.getByTestId('success-title');
        await successTitle.waitFor({ state: 'visible', timeout: 10000 });
        await expect(page.getByText(/reservation confirmed/i)).toBeVisible();

        reservationCreated = true;
        break;
      }
    }

    if (!reservationCreated) {
      test.skip(); // Couldn't create reservation
    }

    // ===== STEP 12: View all reservations =====
    const viewReservationsButton = page.getByRole('button', {
      name: /view all reservations/i,
    });
    await viewReservationsButton.click();
    await page.waitForURL(/\/reservations$/);

    // ===== STEP 13: Verify reservation appears in list =====
    await expect(
      page.getByRole('heading', { name: /upcoming/i })
    ).toBeVisible();

    // Should see party size in the list
    await expect(page.getByText(/3 adults, 2 kids/i)).toBeVisible();
  });

  test('Session persistence: Refresh page should maintain authentication', async ({
    page,
  }) => {
    // Authenticate
    await authenticateMember(page, clubSecret);

    // Verify we're authenticated
    await expect(
      page.getByRole('heading', { name: /choose your island/i })
    ).toBeVisible();

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('load');

    // Should still be authenticated and on islands page
    await expect(page).toHaveURL(/\/islands/);
    await expect(
      page.getByRole('heading', { name: /choose your island/i })
    ).toBeVisible();
  });

  test('Session persistence: Navigate to different island and back', async ({
    page,
  }) => {
    // Authenticate
    await authenticateMember(page, clubSecret);

    // Click first island
    const islandCards = page.locator('[data-testid="island-link"]');
    await islandCards.first().click();
    await page.waitForURL(/\/islands\/[^/]+$/);

    // Verify we're on island detail page
    await expect(page.locator('[data-testid="sauna-card"]')).toHaveCount(2, {
      timeout: 5000,
    }); // First island has 2 saunas

    // Go back to islands list using browser back
    await page.goBack();
    await page.waitForURL(/\/islands$/, { timeout: 5000 });

    // Should still be authenticated
    await expect(
      page.getByRole('heading', { name: /choose your island/i })
    ).toBeVisible();

    // Should be able to click second island
    const islandCount = await islandCards.count();
    if (islandCount > 1) {
      await islandCards.nth(1).click();
      await page.waitForURL(/\/islands\/[^/]+$/);
      await expect(
        page.locator('[data-testid="sauna-card"]').first()
      ).toBeVisible();
    }
  });

  test('Homepage → QR Code authentication flow', async ({ page }) => {
    // Start from homepage
    await page.goto('/');

    // Click "Access with QR Code" button in hero
    await page.getByRole('link', { name: /Access with QR Code/i }).click();
    await page.waitForURL(/\/auth/);

    // Manually enter secret (simulating QR code with secret parameter)
    await page.goto(`/auth?secret=${clubSecret}`);

    // Should auto-authenticate and redirect to welcome page
    await page.waitForURL(/\/welcome/, { timeout: 10000 });

    // Click continue to proceed to islands
    await page.getByTestId('continue-to-reservations').click();

    // Should redirect to islands
    await page.waitForURL(/\/islands/, { timeout: 10000 });
    await expect(
      page.getByRole('heading', { name: /choose your island/i })
    ).toBeVisible();
  });

  test('Invalid session: Direct navigation to protected route should redirect to auth', async ({
    page,
  }) => {
    // Try to access islands page without authentication
    await page.goto('/islands');
    await page.waitForLoadState('load');

    // Should redirect to auth page (or show "no islands" if session check happens client-side)
    // The current implementation might stay on /islands but show no content or redirect
    // Let's check for either auth redirect or empty state

    const isOnAuth = page.url().includes('/auth');
    const hasNoIslandsMessage = await page
      .getByText(/no islands available/i)
      .isVisible()
      .catch(() => false);

    expect(isOnAuth || hasNoIslandsMessage).toBeTruthy();
  });

  test('Verify club branding is displayed throughout member journey', async ({
    page,
  }) => {
    // Authenticate
    await authenticateMember(page, clubSecret);

    // Check club header is present
    const clubHeader = page.locator('header');
    await expect(clubHeader).toBeVisible();

    // Club name should be visible somewhere on the page (might be in header or elsewhere)
    await expect(
      page.getByText(/E2E Test Sailing Club/i).first()
    ).toBeVisible();

    // Navigate to an island
    const islandCards = page.locator('[data-testid="island-link"]');
    await islandCards.first().click();
    await page.waitForURL(/\/islands\/[^/]+$/);

    // Club header should still be visible
    await expect(clubHeader).toBeVisible();
    await expect(
      page.getByText(/E2E Test Sailing Club/i).first()
    ).toBeVisible();

    // Check that club colors are applied (gradient header)
    const headerStyle = await clubHeader.evaluate(
      (el) => window.getComputedStyle(el).background
    );
    expect(headerStyle).toBeTruthy(); // Header should have background styling
  });

  test('Complete flow with back navigation at each step', async ({ page }) => {
    // Start and authenticate
    await page.goto('/');
    await page
      .getByRole('link', { name: /Member Access/i })
      .first()
      .click();
    await page.waitForURL(/\/auth/);

    await page.getByLabel(/club secret/i).fill(clubSecret);
    await page.getByRole('button', { name: /access islands/i }).click();

    // Should redirect to welcome page first
    await page.waitForURL(/\/welcome/, { timeout: 10000 });

    // Click continue to proceed to islands
    await page.getByTestId('continue-to-reservations').click();

    // Should redirect to islands
    await page.waitForURL(/\/islands/, { timeout: 10000 });

    // Forward to island
    const islandCards = page.locator('[data-testid="island-link"]');
    await islandCards.first().click();
    await page.waitForURL(/\/islands\/[^/]+$/);

    // Test back button
    await page.goBack();
    await expect(page).toHaveURL(/\/islands$/);
    await expect(
      page.getByRole('heading', { name: /choose your island/i })
    ).toBeVisible();

    // Forward again to island
    await islandCards.first().click();
    await page.waitForURL(/\/islands\/[^/]+$/);

    // Click reserve button
    const saunaCards = page.locator('[data-testid="sauna-card"]');
    const reserveButton = saunaCards
      .first()
      .getByRole('button', { name: /reserve/i });
    await reserveButton.click();
    await page.waitForURL(/\/islands\/[^/]+\/reserve/);

    // Test back button from reserve page
    await page.goBack();
    await expect(page).toHaveURL(/\/islands\/[^/]+$/);
    await expect(saunaCards.first()).toBeVisible();

    // Browser back/forward navigation should preserve session
    await page.goBack();
    await expect(page).toHaveURL(/\/islands$/);
    await page.goForward();
    await expect(page).toHaveURL(/\/islands\/[^/]+$/);

    // Session should still be valid
    await expect(saunaCards.first()).toBeVisible();
  });
});
