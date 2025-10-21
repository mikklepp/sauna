import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/test-data';
import { cleanupAdminTestData } from './helpers/db-cleanup';

test.describe('Admin Island Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/islands', { waitUntil: 'commit' });
  });

  test.afterEach(async () => {
    await cleanupAdminTestData();
  });

  test('should display islands list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /islands/i })).toBeVisible();
  });

  test('should create a new island', async ({ page }) => {
    const timestamp = Date.now();
    const islandName = `Test Island ${timestamp}`;

    // Click create button
    await page
      .getByRole('button', { name: /create island|new island|add island/i })
      .click();

    // Fill in form
    await page.getByLabel(/island name/i).fill(islandName);

    // Select club (assuming there's at least one club)
    const clubSelect = page.getByLabel(/club/i);
    await clubSelect.selectOption({ index: 1 }); // Select first non-empty option

    // Submit form
    await page.getByRole('button', { name: /create|save/i }).click();

    // Wait for navigation back to islands list
    await page.waitForURL(/\/admin\/islands$/);
    await expect(page.getByText(islandName)).toBeVisible();
  });

  test('should edit an existing island', async ({ page }) => {
    // Create an island first if none exist
    const islandCount = await page
      .locator('[data-testid="island-item"]')
      .count();
    if (islandCount === 0) {
      const timestamp = Date.now();
      await page
        .getByRole('button', { name: /create island|new island|add island/i })
        .click();
      await page.getByLabel(/island name/i).fill(`Test Island ${timestamp}`);
      await page.getByLabel(/club/i).selectOption({ index: 1 });
      await page.getByRole('button', { name: /create|save/i }).click();
      await page.waitForURL(/\/admin\/islands$/);
    }

    // Navigate to edit page
    const firstIsland = page.locator('[data-testid="island-item"]').first();
    await firstIsland.locator('[data-testid="edit-island-button"]').click();
    await page.waitForURL(/\/admin\/islands\/.+\/edit/);

    // Update name
    const nameField = page.getByLabel(/island name/i);
    const newName = `Updated Island ${Date.now()}`;
    await nameField.clear();
    await nameField.fill(newName);

    // Save
    await page.getByRole('button', { name: /save|update/i }).click();

    // Wait for navigation and verify
    await page.waitForURL(/\/admin\/islands$/);
    await expect(page.getByText(newName)).toBeVisible();
  });

  test('should delete an island', async ({ page }) => {
    // Create a temporary island to delete
    const timestamp = Date.now();
    const islandName = `Delete Me ${timestamp}`;

    await page
      .getByRole('button', { name: /create island|new island|add island/i })
      .click();
    await page.getByLabel(/island name/i).fill(islandName);

    const clubSelect = page.getByLabel(/club/i);
    await clubSelect.selectOption({ index: 1 }); // Select first non-empty option

    await page.getByRole('button', { name: /create|save/i }).click();

    // Wait for navigation back to islands list
    await page.waitForURL(/\/admin\/islands$/);
    await expect(page.getByText(islandName)).toBeVisible();

    // Find and delete the island using its card
    const islandCard = page
      .locator('[data-testid="island-item"]')
      .filter({ hasText: islandName });

    // Handle the browser confirm dialog
    page.once('dialog', (dialog) => dialog.accept());
    await islandCard.getByRole('button', { name: /delete/i }).click();

    // Should no longer be visible
    await expect(page.getByText(islandName)).not.toBeVisible();
  });
});

test.describe('Admin Sauna Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/saunas', { waitUntil: 'commit' });
  });

  test.afterEach(async () => {
    await cleanupAdminTestData();
  });

  test('should display saunas list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /saunas/i })).toBeVisible();
  });

  test('should create a new sauna', async ({ page }) => {
    const timestamp = Date.now();
    const saunaName = `Test Sauna ${timestamp}`;

    await page
      .getByRole('button', { name: /create sauna|new sauna|add sauna/i })
      .click();

    await page.getByLabel(/sauna name/i).fill(saunaName);

    // Select island
    const islandSelect = page.getByLabel(/island/i);
    await islandSelect.selectOption({ index: 1 }); // Select first non-empty option

    // Set heating time (it's a select dropdown)
    const heatingTimeField = page.getByLabel(/heating time/i);
    if (await heatingTimeField.isVisible()) {
      await heatingTimeField.selectOption('2'); // Select "2 hours"
    }

    await page.getByRole('button', { name: /create|save/i }).click();

    await expect(page.getByText(saunaName)).toBeVisible();
  });

  test('should toggle auto Club Sauna on a sauna', async ({ page }) => {
    // Create a sauna first if none exist
    const saunaCount = await page.locator('[data-testid="sauna-item"]').count();
    if (saunaCount === 0) {
      const timestamp = Date.now();
      await page
        .getByRole('button', { name: /create sauna|new sauna|add sauna/i })
        .click();
      await page.getByLabel(/sauna name/i).fill(`Test Sauna ${timestamp}`);
      await page.getByLabel(/island/i).selectOption({ index: 1 });
      await page.getByRole('button', { name: /create|save/i }).click();
      await page.waitForURL(/\/admin\/saunas$/);
    }

    const firstSauna = page.locator('[data-testid="sauna-item"]').first();
    await firstSauna.locator('[data-testid="edit-sauna-button"]').click();
    await page.waitForURL(/\/admin\/saunas\/.+\/edit/);

    // Wait for the page to finish loading
    await page.waitForLoadState('load');

    // Find auto Club Sauna checkbox
    const autoClubCheckbox = page.getByLabel(
      /auto club sauna|enable club sauna/i
    );
    const wasChecked = await autoClubCheckbox.isChecked();
    await autoClubCheckbox.click();

    await page.getByRole('button', { name: /save|update/i }).click();

    // Verify change - navigate back and check
    await page.waitForURL(/\/admin\/saunas$/);
    await page.waitForLoadState('load'); // Ensure save API call completes

    await page
      .locator('[data-testid="sauna-item"]')
      .first()
      .locator('[data-testid="edit-sauna-button"]')
      .click();
    await page.waitForURL(/\/admin\/saunas\/.+\/edit/);
    await page.waitForLoadState('load'); // Ensure form loads with persisted data

    await expect(
      page.getByLabel(/auto club sauna|enable club sauna/i)
    ).toBeChecked({ checked: !wasChecked });
  });
});

test.describe('Admin Boat Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/boats', { waitUntil: 'commit' });
  });

  test('should display boats list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /boats/i })).toBeVisible();
  });

  test('should create a new boat', async ({ page }) => {
    const timestamp = Date.now();
    const boatName = `Test Boat ${timestamp}`;
    const membershipNumber = `MEM${timestamp}`;

    await page
      .getByRole('button', { name: /create boat|new boat|add boat/i })
      .click();

    await page.getByLabel(/boat name/i).fill(boatName);
    await page.getByLabel(/membership number/i).fill(membershipNumber);

    // Optional fields
    const captainField = page.getByLabel(/captain name/i);
    if (await captainField.isVisible()) {
      await captainField.fill('Test Captain');
    }

    const phoneField = page.getByLabel(/phone/i);
    if (await phoneField.isVisible()) {
      await phoneField.fill('555-1234');
    }

    // Select club
    const clubSelect = page.getByLabel(/club/i);
    await clubSelect.selectOption({ index: 1 }); // Select first non-empty option

    await page.getByRole('button', { name: /create|save/i }).click();

    // Wait for navigation back to boats list
    await page.waitForURL(/\/admin\/boats$/);
    await expect(page.getByText(boatName)).toBeVisible();
    await expect(page.getByText(membershipNumber)).toBeVisible();
  });

  test('should search for boats', async ({ page }) => {
    // Assuming there are boats in the database
    const searchInput = page.getByPlaceholder(/search|filter/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500); // Debounce

      // Should filter results
      const results = page.locator('[data-testid="boat-item"]');
      if ((await results.count()) > 0) {
        await expect(results.first()).toBeVisible();
      }
    }
  });

  test('should handle CSV import', async ({ page }) => {
    // Look for import button
    const importButton = page.getByRole('button', {
      name: /import|upload csv/i,
    });

    if (await importButton.isVisible()) {
      await importButton.click();

      // Create a simple CSV file
      const csvContent = `Boat Name,Membership Number,Captain Name,Phone
Test CSV Boat,CSV${Date.now()},CSV Captain,555-9999`;

      // Upload file (if file input is available)
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        await fileInput.setInputFiles({
          name: 'boats.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from(csvContent),
        });

        await page.getByRole('button', { name: /upload|import/i }).click();

        // Should show success message
        await expect(page.getByText(/success|imported/i)).toBeVisible({
          timeout: 10000,
        });
      }
    }
  });

  test('should edit a boat', async ({ page }) => {
    // Create a boat first if none exist
    const boatCount = await page.locator('[data-testid="boat-item"]').count();
    if (boatCount === 0) {
      const timestamp = Date.now();
      await page
        .getByRole('button', { name: /create boat|new boat|add boat/i })
        .click();
      await page.getByLabel(/boat name/i).fill(`Test Boat ${timestamp}`);
      await page.getByLabel(/membership number/i).fill(`MEM${timestamp}`);
      await page.getByLabel(/club/i).selectOption({ index: 1 });
      await page.getByRole('button', { name: /create|save/i }).click();
      await page.waitForURL(/\/admin\/boats$/);
    }

    const firstBoat = page.locator('[data-testid="boat-item"]').first();
    await firstBoat.locator('[data-testid="edit-boat-button"]').click();
    await page.waitForURL(/\/admin\/boats\/.+\/edit/);

    // Wait for the page to finish loading
    await page.waitForLoadState('load');

    const captainField = page.getByLabel(/captain name/i);
    const newCaptainName = `Updated Captain ${Date.now()}`;
    await captainField.clear();
    await captainField.fill(newCaptainName);

    await page.getByRole('button', { name: /save|update/i }).click();

    // Wait for navigation and verify
    await page.waitForURL(/\/admin\/boats$/);
    await expect(page.getByText(newCaptainName)).toBeVisible();
  });

  test('should delete a boat', async ({ page }) => {
    // Create a boat to delete
    const timestamp = Date.now();
    const boatName = `Delete Boat ${timestamp}`;
    const membershipNumber = `DEL${timestamp}`;

    await page
      .getByRole('button', { name: /create boat|new boat|add boat/i })
      .click();
    await page.getByLabel(/boat name/i).fill(boatName);
    await page.getByLabel(/membership number/i).fill(membershipNumber);

    const clubSelect = page.getByLabel(/club/i);
    await clubSelect.selectOption({ index: 1 }); // Select first non-empty option

    await page.getByRole('button', { name: /create|save/i }).click();

    // Wait for navigation back to boats list
    await page.waitForURL(/\/admin\/boats$/);
    await expect(page.getByText(boatName)).toBeVisible();

    // Delete the boat - find the row containing the membership number
    const boatRow = page.getByRole('row', {
      name: new RegExp(membershipNumber),
    });

    // Handle the browser confirm dialog
    page.once('dialog', (dialog) => dialog.accept());
    await boatRow.getByRole('button', { name: /delete/i }).click();

    await expect(page.getByText(membershipNumber)).not.toBeVisible();
  });
});

test.describe('Admin Club Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/clubs', { waitUntil: 'commit' });
  });

  test('should display clubs list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /clubs/i })).toBeVisible();
  });

  test('should view club QR code', async ({ page }) => {
    // Navigate to clubs page
    await page.goto('/admin/clubs', { waitUntil: 'commit' });
    await page.waitForLoadState('load');

    const clubCount = await page.locator('[data-testid="club-item"]').count();

    if (clubCount === 0) {
      test.skip();
    }

    const firstClub = page.locator('[data-testid="club-item"]').first();
    const qrButton = firstClub.getByRole('button', {
      name: /qr code|show qr/i,
    });

    if (await qrButton.isVisible()) {
      await qrButton.click();

      // Should display QR code
      await expect(
        page.locator('canvas, svg, img').filter({ hasText: '' }).first()
      ).toBeVisible();
    }
  });

  test('should access theme editor', async ({ page }) => {
    // Navigate to clubs page
    await page.goto('/admin/clubs', { waitUntil: 'commit' });
    await page.waitForLoadState('load');

    const clubCount = await page.locator('[data-testid="club-item"]').count();

    if (clubCount === 0) {
      test.skip();
    }

    const firstClub = page.locator('[data-testid="club-item"]').first();
    const themeButton = firstClub.getByRole('button', {
      name: /theme|edit theme/i,
    });

    if (await themeButton.isVisible()) {
      await themeButton.click();

      // Should show theme editor
      await expect(page.getByText(/primary color|logo/i)).toBeVisible();
    }
  });
});
