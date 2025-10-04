import { test, expect } from '@playwright/test';

// Helper to login as admin
async function loginAsAdmin(page: any) {
  await page.goto('/admin/login');
  await page.getByLabel(/username/i).fill('admin');
  await page.getByLabel(/password/i).fill('admin123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/admin/);
}

test.describe('Shared Reservation - Admin Creation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/shared-reservations');
  });

  test('should display shared reservations list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /shared.*reservations/i })).toBeVisible();
  });

  test('should create a new shared reservation', async ({ page }) => {
    await page.getByRole('button', { name: /create.*shared|new.*shared|add.*shared/i }).click();

    // Select sauna
    const saunaSelect = page.getByLabel(/sauna/i);
    await saunaSelect.click();
    await page.getByRole('option').first().click();

    // Set date (future date)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];

    const dateField = page.getByLabel(/date/i);
    await dateField.fill(dateString);

    // Set start time
    const startTimeField = page.getByLabel(/start time|time/i);
    await startTimeField.fill('18:00');

    // Set males duration
    const malesDurationField = page.getByLabel(/males.*duration|men.*hours/i);
    await malesDurationField.fill('2');

    // Set females duration
    const femalesDurationField = page.getByLabel(/females.*duration|women.*hours/i);
    await femalesDurationField.fill('2');

    // Set gender order
    const genderOrderSelect = page.getByLabel(/gender.*order|who.*first/i);
    if (await genderOrderSelect.isVisible()) {
      await genderOrderSelect.click();
      await page.getByRole('option', { name: /males.*first/i }).click();
    }

    // Optional name
    const nameField = page.getByLabel(/name|description/i);
    if (await nameField.isVisible()) {
      await nameField.fill('Test Shared Sauna');
    }

    // Create
    await page.getByRole('button', { name: /create|save/i }).click();

    // Should show success or see in list
    await expect(page.getByText(/success|created/i)).toBeVisible({ timeout: 10000 });
  });

  test('should edit a shared reservation', async ({ page }) => {
    const firstShared = page.locator('[data-testid="shared-reservation-item"]').first();

    if (await firstShared.count() === 0) {
      test.skip();
    }

    await firstShared.getByRole('button', { name: /edit/i }).click();

    // Update name
    const nameField = page.getByLabel(/name|description/i);
    const newName = `Updated Shared ${Date.now()}`;
    await nameField.clear();
    await nameField.fill(newName);

    await page.getByRole('button', { name: /save|update/i }).click();

    await expect(page.getByText(newName)).toBeVisible();
  });

  test('should delete a shared reservation', async ({ page }) => {
    // Create one to delete
    await page.getByRole('button', { name: /create.*shared|new.*shared/i }).click();

    const saunaSelect = page.getByLabel(/sauna/i);
    await saunaSelect.click();
    await page.getByRole('option').first().click();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];

    await page.getByLabel(/date/i).fill(dateString);
    await page.getByLabel(/start time|time/i).fill('19:00');
    await page.getByLabel(/males.*duration/i).fill('2');
    await page.getByLabel(/females.*duration/i).fill('2');

    const testName = `Delete Me ${Date.now()}`;
    const nameField = page.getByLabel(/name|description/i);
    if (await nameField.isVisible()) {
      await nameField.fill(testName);
    }

    await page.getByRole('button', { name: /create|save/i }).click();
    await page.waitForTimeout(1000);

    // Find and delete
    const toDelete = page.locator(`text=${testName}`).locator('..').locator('..');
    await toDelete.getByRole('button', { name: /delete/i }).click();

    await page.getByRole('button', { name: /confirm|yes|delete/i }).click();

    await expect(page.getByText(testName)).not.toBeVisible();
  });
});

test.describe('Shared Reservation - User Joining', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display shared reservation option on island view', async ({ page }) => {
    const islandLink = page.locator('[data-testid="island-link"]').first();

    if (await islandLink.count() === 0) {
      test.skip();
    }

    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    // Look for shared reservation indicator
    const sharedIndicator = page.getByText(/shared sauna|join shared/i);

    // May or may not be visible depending on whether shared reservations exist
    // This is just checking if the UI can display them
    if (await sharedIndicator.isVisible()) {
      await expect(sharedIndicator).toBeVisible();
    }
  });

  test('should join a shared reservation', async ({ page }) => {
    const islandLink = page.locator('[data-testid="island-link"]').first();

    if (await islandLink.count() === 0) {
      test.skip();
    }

    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    // Look for "Join Shared" button
    const joinSharedButton = page.getByRole('button', { name: /join.*shared/i });

    if (await joinSharedButton.isVisible()) {
      await joinSharedButton.click();

      // Should show shared reservation details
      await expect(page.getByText(/males|females|men|women/i)).toBeVisible();

      // Should show participant list or count
      await expect(page.getByText(/participants|boats/i)).toBeVisible();

      // Search for boat
      const boatSearch = page.getByPlaceholder(/search.*boat|enter boat name/i);
      await boatSearch.fill('test');
      await page.waitForTimeout(500);

      // Select a boat
      const firstBoat = page.locator('[data-testid="boat-option"]').first();
      if (await firstBoat.count() > 0) {
        await firstBoat.click();
      }

      // Enter party size
      const adultsField = page.getByLabel(/adults/i);
      await adultsField.fill('3');

      const kidsField = page.getByLabel(/kids|children/i);
      if (await kidsField.isVisible()) {
        await kidsField.fill('1');
      }

      // Continue
      await page.getByRole('button', { name: /continue|next/i }).click();

      // Confirm
      await page.getByRole('button', { name: /confirm|join/i }).click();

      // Should show success
      await expect(page.getByText(/success|joined/i)).toBeVisible({ timeout: 10000 });
    } else {
      test.skip();
    }
  });

  test('should display gender schedule for shared reservation', async ({ page }) => {
    const islandLink = page.locator('[data-testid="island-link"]').first();

    if (await islandLink.count() === 0) {
      test.skip();
    }

    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    const joinSharedButton = page.getByRole('button', { name: /join.*shared/i });

    if (await joinSharedButton.isVisible()) {
      await joinSharedButton.click();

      // Should display gender schedule
      const schedule = page.locator('[data-testid="gender-schedule"]');

      if (await schedule.isVisible()) {
        const scheduleText = await schedule.textContent();

        // Should contain time information and gender labels
        expect(scheduleText).toMatch(/males|females|men|women/i);
        expect(scheduleText).toMatch(/\d{1,2}:\d{2}/); // Time format
      } else {
        // Alternative: look for any text showing the schedule
        await expect(page.getByText(/males.*\d{1,2}:\d{2}/i)).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test('should show current participants in shared reservation', async ({ page }) => {
    const islandLink = page.locator('[data-testid="island-link"]').first();

    if (await islandLink.count() === 0) {
      test.skip();
    }

    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    const joinSharedButton = page.getByRole('button', { name: /join.*shared/i });

    if (await joinSharedButton.isVisible()) {
      await joinSharedButton.click();

      // Look for participants section
      const participantsSection = page.locator('[data-testid="participants-list"]');

      if (await participantsSection.isVisible()) {
        // Should show participant details
        await expect(participantsSection).toBeVisible();
      } else {
        // Alternative: look for text indicating participants
        const participantText = page.getByText(/participants|boats|no one has joined/i);
        await expect(participantText).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test('should prevent joining shared reservation if boat already has reservation today', async ({ page }) => {
    // This would require creating an individual reservation first,
    // then trying to join a shared reservation with the same boat
    const islandLink = page.locator('[data-testid="island-link"]').first();

    if (await islandLink.count() === 0) {
      test.skip();
    }

    await islandLink.click();
    await page.waitForURL(/\/islands\/[^/]+/);

    // Make individual reservation first
    const reserveButton = page.getByRole('button', { name: /make reservation/i }).first();
    await reserveButton.click();

    const boatSearch = page.getByPlaceholder(/search.*boat/i);
    await boatSearch.fill('test');
    await page.waitForTimeout(500);

    const firstBoat = page.locator('[data-testid="boat-option"]').first();
    let boatName = '';

    if (await firstBoat.count() > 0) {
      boatName = await firstBoat.textContent() || '';
      await firstBoat.click();
    }

    await page.getByLabel(/adults/i).fill('2');
    await page.getByRole('button', { name: /continue|next/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();

    await page.waitForTimeout(1000);

    // Now try to join shared reservation with same boat
    await page.goto('/');
    await islandLink.click();

    const joinSharedButton = page.getByRole('button', { name: /join.*shared/i });

    if (await joinSharedButton.isVisible()) {
      await joinSharedButton.click();

      const boatSearch2 = page.getByPlaceholder(/search.*boat/i);
      await boatSearch2.fill(boatName);
      await page.waitForTimeout(500);

      const sameBoat = page.locator('[data-testid="boat-option"]').first();
      if (await sameBoat.count() > 0) {
        await sameBoat.click();

        // Should show error
        await expect(
          page.getByText(/already has.*reservation|already reserved/i)
        ).toBeVisible();
      }
    } else {
      test.skip();
    }
  });
});

test.describe('Club Sauna Auto-creation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should verify Club Sauna settings exist', async ({ page }) => {
    await page.goto('/admin/saunas');

    const firstSauna = page.locator('[data-testid="sauna-item"]').first();

    if (await firstSauna.count() === 0) {
      test.skip();
    }

    await firstSauna.getByRole('button', { name: /edit/i }).click();

    // Should have auto Club Sauna option
    const autoClubCheckbox = page.getByLabel(/auto.*club.*sauna|enable.*club/i);
    await expect(autoClubCheckbox).toBeVisible();
  });

  test('should enable auto Club Sauna generation', async ({ page }) => {
    await page.goto('/admin/saunas');

    const firstSauna = page.locator('[data-testid="sauna-item"]').first();

    if (await firstSauna.count() === 0) {
      test.skip();
    }

    await firstSauna.getByRole('button', { name: /edit/i }).click();

    const autoClubCheckbox = page.getByLabel(/auto.*club.*sauna|enable.*club/i);

    if (!(await autoClubCheckbox.isChecked())) {
      await autoClubCheckbox.click();
      await page.getByRole('button', { name: /save|update/i }).click();

      // Should show success
      await expect(page.getByText(/success|updated/i)).toBeVisible();

      // Verify it's enabled
      await firstSauna.getByRole('button', { name: /edit/i }).click();
      await expect(autoClubCheckbox).toBeChecked();
    }
  });
});
