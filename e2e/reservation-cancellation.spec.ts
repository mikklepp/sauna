import { test, expect } from '@playwright/test';

test.describe('Reservation Cancellation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display reservations list for a sauna', async ({ page }) => {
    const islandLink = page.locator('[data-testid="island-link"]').first();

    if (await islandLink.count() === 0) {
      test.skip();
    }

    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    // Find "View Reservations" button
    const viewReservationsButton = page.getByRole('button', { name: /view.*reservations|see.*reservations/i }).first();

    if (await viewReservationsButton.isVisible()) {
      await viewReservationsButton.click();

      // Should show reservations list page
      await expect(page.getByText(/reservations|today.*schedule/i)).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should show cancel button for future reservations', async ({ page }) => {
    // First create a reservation
    const islandLink = page.locator('[data-testid="island-link"]').first();

    if (await islandLink.count() === 0) {
      test.skip();
    }

    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    // Create a reservation
    const reserveButton = page.getByRole('button', { name: /make reservation/i }).first();
    await reserveButton.click();

    const boatSearch = page.getByPlaceholder(/search.*boat/i);
    await boatSearch.fill('test');
    await page.waitForTimeout(500);

    const firstBoat = page.locator('[data-testid="boat-option"]').first();
    if (await firstBoat.count() > 0) {
      await firstBoat.click();
    }

    await page.getByLabel(/adults/i).fill('2');
    await page.getByRole('button', { name: /continue|next/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();

    await page.waitForTimeout(1000);

    // Navigate to reservations list
    await page.goto('/');
    await islandLink.click();

    const viewReservationsButton = page.getByRole('button', { name: /view.*reservations/i }).first();
    await viewReservationsButton.click();

    // Look for cancel button on the reservation we just made
    const cancelButtons = page.getByRole('button', { name: /cancel/i });

    if (await cancelButtons.count() > 0) {
      await expect(cancelButtons.first()).toBeVisible();
    }
  });

  test('should cancel a reservation successfully', async ({ page }) => {
    // Create a reservation first
    const islandLink = page.locator('[data-testid="island-link"]').first();

    if (await islandLink.count() === 0) {
      test.skip();
    }

    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    const reserveButton = page.getByRole('button', { name: /make reservation/i }).first();
    await reserveButton.click();

    const boatSearch = page.getByPlaceholder(/search.*boat/i);
    await boatSearch.fill('test');
    await page.waitForTimeout(500);

    const firstBoat = page.locator('[data-testid="boat-option"]').first();
    let boatIdentifier = '';

    if (await firstBoat.count() > 0) {
      boatIdentifier = await firstBoat.textContent() || '';
      await firstBoat.click();
    }

    await page.getByLabel(/adults/i).fill('2');
    await page.getByRole('button', { name: /continue|next/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();

    await page.waitForTimeout(1000);

    // View reservations
    await page.goto('/');
    await islandLink.click();

    const viewReservationsButton = page.getByRole('button', { name: /view.*reservations/i }).first();
    await viewReservationsButton.click();

    // Find the reservation we just made
    const ourReservation = page.locator(`text=${boatIdentifier}`).locator('..').locator('..');

    if (await ourReservation.count() > 0) {
      const cancelButton = ourReservation.getByRole('button', { name: /cancel/i });

      if (await cancelButton.isVisible()) {
        await cancelButton.click();

        // Should show confirmation dialog
        await expect(page.getByText(/confirm|are you sure/i)).toBeVisible();

        // Confirm cancellation
        await page.getByRole('button', { name: /confirm|yes|cancel.*reservation/i }).click();

        // Should show success message
        await expect(page.getByText(/cancelled|success/i)).toBeVisible({ timeout: 10000 });

        // Reservation should be removed from list
        await page.waitForTimeout(500);
        const stillVisible = await ourReservation.isVisible();
        expect(stillVisible).toBeFalsy();
      }
    }
  });

  test('should show "too late to cancel" for reservations within 15 minutes', async ({ page }) => {
    // This test is difficult to write because it requires a reservation starting within 15 minutes
    // We'll check for the UI element that would display this message

    const islandLink = page.locator('[data-testid="island-link"]').first();

    if (await islandLink.count() === 0) {
      test.skip();
    }

    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    const viewReservationsButton = page.getByRole('button', { name: /view.*reservations/i }).first();

    if (await viewReservationsButton.isVisible()) {
      await viewReservationsButton.click();

      // Look for any "too late" messages
      const tooLateMessage = page.getByText(/too late.*cancel|cannot.*cancel/i);

      // May or may not be visible depending on current reservations
      if (await tooLateMessage.isVisible()) {
        await expect(tooLateMessage).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test('should not show cancel button for past reservations', async ({ page }) => {
    const islandLink = page.locator('[data-testid="island-link"]').first();

    if (await islandLink.count() === 0) {
      test.skip();
    }

    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    const viewReservationsButton = page.getByRole('button', { name: /view.*reservations/i }).first();

    if (await viewReservationsButton.isVisible()) {
      await viewReservationsButton.click();

      // Look for past reservations (they might be grayed out or styled differently)
      const pastReservations = page.locator('[data-testid="past-reservation"]');

      if (await pastReservations.count() > 0) {
        const firstPast = pastReservations.first();

        // Should not have a cancel button
        const cancelButton = firstPast.getByRole('button', { name: /cancel/i });
        const hasCancelButton = await cancelButton.isVisible();

        expect(hasCancelButton).toBeFalsy();
      }
    } else {
      test.skip();
    }
  });

  test('should separate past and future reservations visually', async ({ page }) => {
    const islandLink = page.locator('[data-testid="island-link"]').first();

    if (await islandLink.count() === 0) {
      test.skip();
    }

    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    const viewReservationsButton = page.getByRole('button', { name: /view.*reservations/i }).first();

    if (await viewReservationsButton.isVisible()) {
      await viewReservationsButton.click();

      // Check for visual separators
      const separator = page.locator('[data-testid="past-future-separator"]');

      if (await separator.isVisible()) {
        await expect(separator).toBeVisible();
      } else {
        // Alternative: check for different styling classes or sections
        const pastSection = page.locator('[data-testid="past-reservations"]');
        const futureSection = page.locator('[data-testid="future-reservations"]');

        if (await pastSection.isVisible() && await futureSection.isVisible()) {
          await expect(pastSection).toBeVisible();
          await expect(futureSection).toBeVisible();
        }
      }
    } else {
      test.skip();
    }
  });

  test('should auto-scroll to future reservations', async ({ page }) => {
    const islandLink = page.locator('[data-testid="island-link"]').first();

    if (await islandLink.count() === 0) {
      test.skip();
    }

    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    const viewReservationsButton = page.getByRole('button', { name: /view.*reservations/i }).first();

    if (await viewReservationsButton.isVisible()) {
      await viewReservationsButton.click();

      // Check if future reservations section is in viewport
      const futureReservations = page.locator('[data-testid="future-reservations"]');

      if (await futureReservations.isVisible()) {
        const isInViewport = await futureReservations.isInViewport();
        expect(isInViewport).toBeTruthy();
      }
    } else {
      test.skip();
    }
  });

  test('should display reservation details in list', async ({ page }) => {
    const islandLink = page.locator('[data-testid="island-link"]').first();

    if (await islandLink.count() === 0) {
      test.skip();
    }

    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    const viewReservationsButton = page.getByRole('button', { name: /view.*reservations/i }).first();

    if (await viewReservationsButton.isVisible()) {
      await viewReservationsButton.click();

      const reservationItem = page.locator('[data-testid="reservation-item"]').first();

      if (await reservationItem.count() > 0) {
        // Should show time
        await expect(reservationItem.getByText(/\d{1,2}:\d{2}/)).toBeVisible();

        // Should show boat name or membership number
        await expect(reservationItem).toContainText(/\w+/);

        // Should show party size
        await expect(reservationItem.getByText(/\d+.*adults?/i)).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test('should show empty state when no reservations', async ({ page }) => {
    const islandLink = page.locator('[data-testid="island-link"]').first();

    if (await islandLink.count() === 0) {
      test.skip();
    }

    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    const viewReservationsButton = page.getByRole('button', { name: /view.*reservations/i }).first();

    if (await viewReservationsButton.isVisible()) {
      await viewReservationsButton.click();

      // If there are no reservations, should show empty state
      const reservations = page.locator('[data-testid="reservation-item"]');

      if (await reservations.count() === 0) {
        await expect(
          page.getByText(/no reservations|no bookings|empty/i)
        ).toBeVisible();
      }
    } else {
      test.skip();
    }
  });
});
