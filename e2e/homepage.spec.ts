import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the homepage with correct title and branding', async ({
    page,
  }) => {
    // Check page title
    await expect(page).toHaveTitle(/Sauna Reservation/i);

    // Check main heading
    await expect(
      page.getByRole('heading', { name: /Streamlined Sauna Reservations/i })
    ).toBeVisible();

    // Check tagline
    await expect(page.getByText(/for Island Communities/i)).toBeVisible();

    // Check branding in header
    const header = page.locator('header');
    await expect(header.getByText('Sauna Reservations')).toBeVisible();
  });

  test('should display navigation links in header', async ({ page }) => {
    // Check Member Access link
    const memberAccessLink = page.getByRole('link', {
      name: /Member Access/i,
    });
    await expect(memberAccessLink).toBeVisible();
    await expect(memberAccessLink).toHaveAttribute('href', '/auth');

    // Check Admin Portal link
    const adminLink = page.getByRole('link', { name: /Admin Portal/i });
    await expect(adminLink).toBeVisible();
    await expect(adminLink).toHaveAttribute('href', '/admin');
  });

  test('should display hero section with call-to-action buttons', async ({
    page,
  }) => {
    // Check description text
    await expect(
      page.getByText(/A complete reservation system with offline-capable/i)
    ).toBeVisible();

    // Check QR Code access button
    const qrButton = page.getByRole('link', { name: /Access with QR Code/i });
    await expect(qrButton).toBeVisible();
    await expect(qrButton).toHaveAttribute('href', '/auth');

    // Check Island Device Setup button
    const deviceButton = page.getByRole('link', {
      name: /Island Device Setup/i,
    });
    await expect(deviceButton).toBeVisible();
    await expect(deviceButton).toHaveAttribute('href', '/island-device');
  });

  test('should display feature cards', async ({ page }) => {
    // Check for feature cards
    await expect(
      page.getByRole('heading', { name: /Easy Reservations/i })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Offline Capable/i })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Shared Saunas/i })
    ).toBeVisible();

    // Check feature descriptions
    await expect(
      page.getByText(/Book next available time slots/i)
    ).toBeVisible();
    await expect(
      page.getByText(/Island Devices work without internet/i)
    ).toBeVisible();
    await expect(
      page.getByText(/Automatic Club Sauna scheduling/i)
    ).toBeVisible();
  });

  test('should display "How It Works" section', async ({ page }) => {
    // Check section heading
    await expect(
      page.getByRole('heading', { name: /How It Works/i })
    ).toBeVisible();

    // Check "For Members" subsection
    await expect(
      page.getByRole('heading', { name: /For Members/i })
    ).toBeVisible();
    await expect(page.getByText(/Scan QR Code/i)).toBeVisible();
    await expect(page.getByText(/Select Island & Sauna/i)).toBeVisible();
    await expect(page.getByText(/Reserve Time/i)).toBeVisible();

    // Check "For Island Devices" subsection
    await expect(
      page.getByRole('heading', { name: /For Island Devices/i })
    ).toBeVisible();
    await expect(page.getByText(/One-Time Setup/i)).toBeVisible();
    await expect(page.getByText(/Works Offline/i)).toBeVisible();
    await expect(page.getByText(/Auto Sync/i)).toBeVisible();
  });

  test('should display footer', async ({ page }) => {
    await expect(
      page.getByText(/Built with Next.js, TypeScript, and PWA technology/i)
    ).toBeVisible();
  });

  test('should navigate to member auth page when clicking Member Access', async ({
    page,
  }) => {
    await page
      .getByRole('link', { name: /Member Access/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should navigate to admin portal when clicking Admin Portal', async ({
    page,
  }) => {
    await page.getByRole('link', { name: /Admin Portal/i }).click();
    await expect(page).toHaveURL(/\/admin/);
  });

  test('should navigate to member auth when clicking QR Code button', async ({
    page,
  }) => {
    await page.getByRole('link', { name: /Access with QR Code/i }).click();
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should navigate to island device setup when clicking setup button', async ({
    page,
  }) => {
    await page.getByRole('link', { name: /Island Device Setup/i }).click();
    await expect(page).toHaveURL(/\/island-device/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check main elements are still visible
    const header = page.locator('header');
    await expect(header.getByText('Sauna Reservations')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Streamlined Sauna Reservations/i })
    ).toBeVisible();

    // Check navigation is accessible
    await expect(
      page.getByRole('link', { name: /Member Access/i })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Admin Portal/i })
    ).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Check feature cards layout
    const featureSection = page
      .locator('section')
      .filter({ hasText: /Easy Reservations/ });
    await expect(featureSection).toBeVisible();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check for proper semantic HTML
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    const header = page.locator('header');
    await expect(header).toBeVisible();

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Check all buttons are accessible
    const buttons = page.getByRole('link');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });
});
