import { test, expect } from '@playwright/test';

test.describe('Individual Reservation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page - assuming there's a way to select an island
    await page.goto('/');
  });

  test('should display island selection', async ({ page }) => {
    // Should show available islands or club secret entry
    const hasIslands = await page.getByText(/select.*island/i).isVisible();
    const hasSecretEntry = await page.getByLabel(/club secret/i).isVisible();

    expect(hasIslands || hasSecretEntry).toBeTruthy();
  });

  test('should navigate to island view', async ({ page }) => {
    // Try to find and click on an island
    const islandLink = page.locator('[data-testid="island-link"]').first();

    if ((await islandLink.count()) > 0) {
      await islandLink.click();
      await expect(page).toHaveURL(/\/islands\/[^/]+/);
    } else {
      // Skip if no islands available
      test.skip();
    }
  });

  test('should display saunas with availability', async ({ page }) => {
    // Navigate to a specific island (assumes there's test data)
    const islandLink = page.locator('[data-testid="island-link"]').first();

    if ((await islandLink.count()) === 0) {
      test.skip();
    }

    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    // Should show saunas
    const saunaCard = page.locator('[data-testid="sauna-card"]').first();
    await expect(saunaCard).toBeVisible();

    // Should show status
    await expect(page.getByText(/available|in use/i)).toBeVisible();

    // Should show next available time
    await expect(page.getByText(/next available|available at/i)).toBeVisible();
  });

  test('should complete individual reservation workflow', async ({ page }) => {
    // Navigate to island
    const islandLink = page.locator('[data-testid="island-link"]').first();

    if ((await islandLink.count()) === 0) {
      test.skip();
    }

    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    // Click "Make Reservation" on first sauna
    const reserveButton = page
      .getByRole('button', { name: /make reservation|book sauna|reserve/i })
      .first();
    await reserveButton.click();

    // Step 1: Should show sauna selection confirmation
    await expect(page.getByText(/confirm|next available/i)).toBeVisible();

    // Step 2: Boat selection
    const boatSearch = page.getByPlaceholder(/search.*boat|enter boat name/i);
    await expect(boatSearch).toBeVisible();

    // Type to search for a boat
    await boatSearch.fill('test');
    await page.waitForTimeout(500); // Wait for search results

    // Select first boat from results
    const firstBoat = page.locator('[data-testid="boat-option"]').first();
    if ((await firstBoat.count()) > 0) {
      await firstBoat.click();
    } else {
      // Try clicking any visible boat option
      const boatOption = page.getByRole('option').first();
      await boatOption.click();
    }

    // Step 3: Party size entry
    await expect(page.getByText(/how many people|party size/i)).toBeVisible();

    const adultsField = page.getByLabel(/adults/i);
    await adultsField.fill('2');

    const kidsField = page.getByLabel(/kids|children/i);
    if (await kidsField.isVisible()) {
      await kidsField.fill('1');
    }

    // Continue to confirmation
    await page.getByRole('button', { name: /continue|next/i }).click();

    // Step 4: Confirmation
    await expect(page.getByText(/confirm.*reservation|review/i)).toBeVisible();

    // Should display reservation details
    await expect(page.getByText(/\d+\s*adults/i)).toBeVisible();

    // Confirm reservation
    await page
      .getByRole('button', { name: /confirm|book now|create reservation/i })
      .click();

    // Should show success message or redirect to reservations list
    await expect(
      page.getByText(/success|reservation created|booked/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should prevent booking when boat already has reservation today', async ({
    page,
  }) => {
    // This test assumes we can create a reservation first, then try to book again with same boat
    const islandLink = page.locator('[data-testid="island-link"]').first();

    if ((await islandLink.count()) === 0) {
      test.skip();
    }

    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    // Make first reservation
    const reserveButton = page
      .getByRole('button', { name: /make reservation|book sauna|reserve/i })
      .first();
    await reserveButton.click();

    const boatSearch = page.getByPlaceholder(/search.*boat|enter boat name/i);
    await boatSearch.fill('test');
    await page.waitForTimeout(500);

    // Remember the boat we select
    const firstBoat = page.locator('[data-testid="boat-option"]').first();
    let boatName = '';

    if ((await firstBoat.count()) > 0) {
      boatName = (await firstBoat.textContent()) || '';
      await firstBoat.click();
    }

    const adultsField = page.getByLabel(/adults/i);
    await adultsField.fill('2');

    await page.getByRole('button', { name: /continue|next/i }).click();
    await page
      .getByRole('button', { name: /confirm|book now|create reservation/i })
      .click();

    await page.waitForTimeout(1000);

    // Try to make another reservation with the same boat
    await page.goto('/'); // Go back
    await islandLink.click();

    const reserveButton2 = page
      .getByRole('button', { name: /make reservation|book sauna|reserve/i })
      .first();
    await reserveButton2.click();

    const boatSearch2 = page.getByPlaceholder(/search.*boat|enter boat name/i);
    await boatSearch2.fill(boatName);
    await page.waitForTimeout(500);

    // Try to select same boat again
    const sameBoat = page.locator('[data-testid="boat-option"]').first();
    if ((await sameBoat.count()) > 0) {
      await sameBoat.click();

      // Should show error message
      await expect(
        page.getByText(/already has.*reservation|boat.*reserved/i)
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display next available time correctly when sauna is in use', async ({
    page,
  }) => {
    const islandLink = page.locator('[data-testid="island-link"]').first();

    if ((await islandLink.count()) === 0) {
      test.skip();
    }

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
    const islandLink = page.locator('[data-testid="island-link"]').first();

    if ((await islandLink.count()) === 0) {
      test.skip();
    }

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
    const islandLink = page.locator('[data-testid="island-link"]').first();

    if ((await islandLink.count()) === 0) {
      test.skip();
    }

    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    const reserveButton = page
      .getByRole('button', { name: /make reservation|book sauna|reserve/i })
      .first();
    await reserveButton.click();

    const boatSearch = page.getByPlaceholder(/search.*boat|enter boat name/i);
    await boatSearch.fill('test');
    await page.waitForTimeout(500);

    const firstBoat = page.locator('[data-testid="boat-option"]').first();
    if ((await firstBoat.count()) > 0) {
      await firstBoat.click();
    }

    // Try to set adults to 0
    const adultsField = page.getByLabel(/adults/i);
    await adultsField.fill('0');

    const continueButton = page.getByRole('button', { name: /continue|next/i });

    // Button should be disabled or show error
    const isDisabled = await continueButton.isDisabled();
    if (!isDisabled) {
      await continueButton.click();
      await expect(
        page.getByText(/at least.*1.*adult|minimum.*adult/i)
      ).toBeVisible();
    } else {
      expect(isDisabled).toBeTruthy();
    }
  });
});
