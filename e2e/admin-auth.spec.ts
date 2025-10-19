import { test, expect } from '@playwright/test';

test.describe('Admin Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Start from admin login page
    await page.goto('/admin/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /admin login/i })
    ).toBeVisible();
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByTestId('admin-login-submit')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.getByLabel(/username/i).fill('wronguser');
    await page.getByLabel(/password/i).fill('wrongpass');
    await page.getByTestId('admin-login-submit').click();

    // Wait for error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Use valid admin credentials (these should exist from seed data)
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('admin123');

    // Wait for the login API call
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/admin/login') &&
        response.request().method() === 'POST'
    );

    await page.getByTestId('admin-login-submit').click();

    // Wait for response
    await responsePromise;

    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin/);
    await expect(
      page.getByRole('heading', { name: /admin portal/i })
    ).toBeVisible();
  });

  test('should persist login across page reloads', async ({ page }) => {
    // Login
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('admin123');

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/admin/login') &&
        response.request().method() === 'POST'
    );

    await page.getByTestId('admin-login-submit').click();
    await responsePromise;

    // Wait for redirect
    await page.waitForURL(/\/admin/);

    // Reload the page
    await page.reload();

    // Should still be logged in
    await expect(page).toHaveURL(/\/admin/);
    await expect(
      page.getByRole('heading', { name: /admin portal/i })
    ).toBeVisible();
  });

  test('should redirect to login when accessing protected route without auth', async ({
    page,
  }) => {
    // Try to access admin dashboard without logging in
    await page.goto('/admin');

    // Should redirect to login
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('admin123');

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/admin/login') &&
        response.request().method() === 'POST'
    );

    await page.getByTestId('admin-login-submit').click();
    await responsePromise;

    // Wait for redirect
    await page.waitForURL(/\/admin/);

    // Find and click logout button
    const logoutResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/admin/logout') &&
        response.request().method() === 'POST'
    );

    await page.getByTestId('admin-logout-button').click();
    await logoutResponsePromise;

    // Should redirect to login page
    await page.waitForURL(/\/admin\/login/);

    // Try to access admin page again (should redirect back to login)
    await page.goto('/admin');

    // Should redirect to login page since we're logged out
    await page.waitForURL(/\/admin\/login/);
  });

  test('should navigate to registration page', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /register|sign up/i });

    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/\/admin\/register/);
      await expect(
        page.getByRole('heading', { name: /register/i })
      ).toBeVisible();
    }
  });

  test('should register new admin account', async ({ page }) => {
    await page.goto('/admin/register');

    const timestamp = Date.now();
    const username = `testadmin${timestamp}`;
    const password = 'TestPassword123!';

    await page.getByLabel(/username/i).fill(username);
    await page.getByLabel(/^password\s*\*$/i).fill(password);

    // Check if there's a confirm password field
    const confirmPasswordField = page.getByLabel(/confirm password/i);
    if (await confirmPasswordField.isVisible()) {
      await confirmPasswordField.fill(password);
    }

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/admin/register') &&
        response.request().method() === 'POST'
    );

    await page.getByTestId('admin-register-submit').click();
    await responsePromise;

    // Should redirect to login or dashboard
    await page.waitForURL(/\/admin/);
  });
});
