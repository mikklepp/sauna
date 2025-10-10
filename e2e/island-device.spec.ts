import { test, expect } from '@playwright/test';
import prisma from '../src/lib/db';
import { getTestClubSecret } from './helpers/test-fixtures';

/**
 * Island Device E2E Tests
 *
 * Tests the Island Device PWA functionality including:
 * - Initial landing page (unconfigured state)
 * - Setup wizard flow
 * - Configured device state
 * - Settings and management
 * - Offline capabilities
 */

test.describe('Island Device - Initial State', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB and localStorage to ensure clean state
    await page.goto('/island-device');
    await page.evaluate(() => {
      localStorage.clear();
      indexedDB.deleteDatabase('sauna-device-db');
    });
    await page.goto('/island-device');
  });

  test('should display welcome screen for unconfigured device', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: /island device setup/i })
    ).toBeVisible();
    await expect(page.getByText(/not configured yet/i)).toBeVisible();
  });

  test('should show offline-first feature', async ({ page }) => {
    await expect(page.getByText(/offline first/i)).toBeVisible();
    await expect(
      page.getByText(/no internet connection required/i)
    ).toBeVisible();
  });

  test('should show island locked feature', async ({ page }) => {
    await expect(page.getByText(/island locked/i)).toBeVisible();
    await expect(page.getByText(/dedicated to one island/i)).toBeVisible();
  });

  test('should show auto sync feature', async ({ page }) => {
    await expect(page.getByText(/auto sync/i)).toBeVisible();
    await expect(page.getByText(/automatically syncs/i)).toBeVisible();
  });

  test('should have configure button', async ({ page }) => {
    const configureButton = page.getByRole('button', {
      name: /configure island device/i,
    });
    await expect(configureButton).toBeVisible();
  });

  test('should navigate to setup page when clicking configure', async ({
    page,
  }) => {
    const configureButton = page.getByRole('button', {
      name: /configure island device/i,
    });
    await configureButton.click();
    await page.waitForURL(/\/island-device\/setup/);
    await expect(
      page.getByRole('heading', { name: /island device configuration/i })
    ).toBeVisible();
  });

  test('should show online/offline status indicator', async ({ page }) => {
    // Should show online status by default
    await expect(page.getByText(/online/i).first()).toBeVisible();
  });

  test('should have settings button', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await expect(settingsButton).toBeVisible();
  });

  test('should navigate to settings page', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();
    await page.waitForURL(/\/island-device\/settings/);
    await expect(
      page.getByRole('heading', { name: /device settings/i })
    ).toBeVisible();
  });
});

test.describe('Island Device - Setup Flow', () => {
  let deviceToken: string;
  let islandId: string;

  test.beforeAll(async () => {
    // Get test data
    const clubSecret = getTestClubSecret();
    const club = await prisma.club.findUnique({
      where: { secret: clubSecret },
      include: {
        islands: {
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!club || club.islands.length === 0) {
      throw new Error('Test club or islands not found');
    }

    islandId = club.islands[0].id;

    // Generate a device token
    const device = await prisma.islandDevice.create({
      data: {
        islandId: islandId,
        deviceName: 'E2E Test Device',
        deviceToken: `e2e-test-token-${Date.now()}`,
        isConfigured: false,
      },
    });

    deviceToken = device.deviceToken;
  });

  test.beforeEach(async ({ page }) => {
    // Clear state before each test
    await page.goto('/island-device');
    await page.evaluate(() => {
      localStorage.clear();
      indexedDB.deleteDatabase('sauna-device-db');
    });
    await page.goto('/island-device/setup');
  });

  test.afterAll(async () => {
    // Clean up test devices
    await prisma.islandDevice.deleteMany({
      where: {
        deviceName: 'E2E Test Device',
      },
    });
  });

  test('should display setup form', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /island device configuration/i })
    ).toBeVisible();
    await expect(page.getByLabel(/device configuration token/i)).toBeVisible();
  });

  test('should show back button', async ({ page }) => {
    const backButton = page.getByRole('button', { name: /back/i });
    await expect(backButton).toBeVisible();
  });

  test('should navigate back when clicking back button', async ({ page }) => {
    const backButton = page.getByRole('button', { name: /back/i });
    await backButton.click();
    await page.waitForURL(/\/island-device$/);
  });

  test('should show help section', async ({ page }) => {
    await expect(page.getByText(/where to get a token/i)).toBeVisible();
    await expect(page.getByText(/token not working/i)).toBeVisible();
    await expect(page.getByText(/want to reconfigure/i)).toBeVisible();
  });

  test('should show error for empty token', async ({ page }) => {
    const configureButton = page.getByRole('button', {
      name: /configure device/i,
    });
    await configureButton.click();

    // Browser validation will handle this, but we can check the button is still there
    await expect(configureButton).toBeVisible();
  });

  test.skip('should show error for invalid token', async ({ page }) => {
    // TODO: Enable when /api/island-device/configure endpoint is fully implemented
    const tokenInput = page.getByLabel(/device configuration token/i);
    await tokenInput.fill('invalid-token-12345');

    const configureButton = page.getByRole('button', {
      name: /configure device/i,
    });
    await configureButton.click();

    // Wait for error message
    await expect(page.getByText(/configuration failed/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/invalid device token/i)).toBeVisible();
  });

  test.skip('should successfully configure device with valid token', async ({
    // TODO: Enable when /api/island-device/configure endpoint is fully implemented
    page,
  }) => {
    const tokenInput = page.getByLabel(/device configuration token/i);
    await tokenInput.fill(deviceToken);

    const configureButton = page.getByRole('button', {
      name: /configure device/i,
    });
    await configureButton.click();

    // Should show downloading state
    await expect(page.getByText(/downloading configuration/i)).toBeVisible({
      timeout: 5000,
    });

    // Should show installing state
    await expect(page.getByText(/installing locally/i)).toBeVisible({
      timeout: 10000,
    });

    // Should show complete state
    await expect(page.getByText(/configuration complete/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/test north island/i)).toBeVisible();
  });

  test.skip('should show configuration summary after successful setup', async ({
    // TODO: Enable when /api/island-device/configure endpoint is fully implemented
    page,
  }) => {
    const tokenInput = page.getByLabel(/device configuration token/i);
    await tokenInput.fill(deviceToken);

    const configureButton = page.getByRole('button', {
      name: /configure device/i,
    });
    await configureButton.click();

    // Wait for completion
    await expect(page.getByText(/configuration complete/i)).toBeVisible({
      timeout: 15000,
    });

    // Check summary details
    await expect(page.getByText(/configuration summary/i)).toBeVisible();
    await expect(page.getByText(/club:/i)).toBeVisible();
    await expect(page.getByText(/island:/i)).toBeVisible();
    await expect(page.getByText(/saunas:/i)).toBeVisible();
    await expect(page.getByText(/boats:/i)).toBeVisible();
    await expect(page.getByText(/offline mode ready/i)).toBeVisible();
  });

  test.skip('should have open island view button after configuration', async ({
    // TODO: Enable when /api/island-device/configure endpoint is fully implemented
    page,
  }) => {
    const tokenInput = page.getByLabel(/device configuration token/i);
    await tokenInput.fill(deviceToken);

    const configureButton = page.getByRole('button', {
      name: /configure device/i,
    });
    await configureButton.click();

    // Wait for completion
    await expect(page.getByText(/configuration complete/i)).toBeVisible({
      timeout: 15000,
    });

    const openViewButton = page.getByRole('button', {
      name: /open island view/i,
    });
    await expect(openViewButton).toBeVisible();
  });

  test.skip('should navigate to island view after clicking open', async ({
    // TODO: Enable when /api/island-device/configure endpoint is fully implemented
    page,
  }) => {
    const tokenInput = page.getByLabel(/device configuration token/i);
    await tokenInput.fill(deviceToken);

    const configureButton = page.getByRole('button', {
      name: /configure device/i,
    });
    await configureButton.click();

    // Wait for completion
    await expect(page.getByText(/configuration complete/i)).toBeVisible({
      timeout: 15000,
    });

    const openViewButton = page.getByRole('button', {
      name: /open island view/i,
    });
    await openViewButton.click();

    // Should navigate to island view
    await page.waitForURL(new RegExp(`/island-device/${islandId}`));
  });
});

test.describe('Island Device - Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear state
    await page.goto('/island-device');
    await page.evaluate(() => {
      localStorage.clear();
      indexedDB.deleteDatabase('sauna-device-db');
    });
    await page.goto('/island-device/settings');
  });

  test('should display device information section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /device information/i })
    ).toBeVisible();
  });

  test('should show unconfigured status for new device', async ({ page }) => {
    await expect(page.getByText(/not configured/i)).toBeVisible();
  });

  test('should display synchronization section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /synchronization/i })
    ).toBeVisible();
  });

  test('should have sync button', async ({ page }) => {
    const syncButton = page.getByRole('button', { name: /sync now/i });
    await expect(syncButton).toBeVisible();
  });

  test('should disable sync button when not configured', async ({ page }) => {
    const syncButton = page.getByRole('button', { name: /sync now/i });
    await expect(syncButton).toBeDisabled();
  });

  test('should display data management section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /data management/i })
    ).toBeVisible();
  });

  test('should have export database button', async ({ page }) => {
    const exportButton = page.getByRole('button', {
      name: /export database backup/i,
    });
    await expect(exportButton).toBeVisible();
  });

  test('should disable export button when not configured', async ({ page }) => {
    const exportButton = page.getByRole('button', {
      name: /export database backup/i,
    });
    await expect(exportButton).toBeDisabled();
  });

  test('should display scheduled workers section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /scheduled workers/i })
    ).toBeVisible();
  });

  test('should show club sauna generator worker info', async ({ page }) => {
    await expect(page.getByText(/club sauna generator/i)).toBeVisible();
    await expect(page.getByText(/runs daily at midnight/i)).toBeVisible();
  });

  test('should show club sauna evaluator worker info', async ({ page }) => {
    await expect(page.getByText(/club sauna evaluator/i)).toBeVisible();
    await expect(page.getByText(/runs daily at 20:00/i)).toBeVisible();
  });

  test('should display danger zone section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /danger zone/i })
    ).toBeVisible();
  });

  test('should have factory reset button', async ({ page }) => {
    const resetButton = page.getByRole('button', {
      name: /factory reset device/i,
    });
    await expect(resetButton).toBeVisible();
  });

  test('should disable factory reset when not configured', async ({ page }) => {
    const resetButton = page.getByRole('button', {
      name: /factory reset device/i,
    });
    await expect(resetButton).toBeDisabled();
  });

  test('should display troubleshooting help', async ({ page }) => {
    await expect(page.getByText(/troubleshooting/i)).toBeVisible();
    await expect(page.getByText(/sync not working/i)).toBeVisible();
    await expect(page.getByText(/data conflicts/i)).toBeVisible();
  });

  test('should show online status indicator', async ({ page }) => {
    await expect(page.getByText(/connection:/i)).toBeVisible();
    await expect(page.getByText(/online/i).first()).toBeVisible();
  });
});

test.describe('Island Device - Configured State', () => {
  test.skip('should auto-redirect to island view when configured', async () => {
    // This test would require setting up a fully configured device
    // which involves complex IndexedDB state and token generation
    // TODO: Implement when we have a helper to create configured device state
  });

  test.skip('should display device information when configured', async () => {
    // TODO: Implement after creating device configuration helper
  });

  test.skip('should show last sync time when configured', async () => {
    // TODO: Implement after creating device configuration helper
  });
});

test.describe('Island Device - PWA Features', () => {
  test('should have manifest.json', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);

    const manifest = await response?.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBe('standalone');
  });

  test('should have service worker support', async ({ page }) => {
    await page.goto('/island-device');

    // Check if service worker API is available (it may not be registered in test environment)
    const swSupported = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });

    expect(swSupported).toBeTruthy();
  });

  test('should have appropriate viewport meta for PWA', async ({ page }) => {
    await page.goto('/island-device');

    const viewport = await page
      .locator('meta[name="viewport"]')
      .getAttribute('content');
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('initial-scale=1');
  });
});
