/**
 * Helper functions and test data for e2e tests
 */

export const TEST_ADMIN = {
  username: 'admin',
  password: 'admin123',
};

export async function loginAsAdmin(page: any) {
  await page.goto('/admin/login');
  await page.getByLabel(/username/i).fill(TEST_ADMIN.username);
  await page.getByLabel(/password/i).fill(TEST_ADMIN.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/admin/);
}

export function createTestBoat(clubId?: string) {
  const timestamp = Date.now();
  return {
    name: `Test Boat ${timestamp}`,
    membershipNumber: `MEM${timestamp}`,
    captain: 'Test Captain',
    phone: '555-1234',
    clubId,
  };
}

export function createTestIsland() {
  const timestamp = Date.now();
  return {
    name: `Test Island ${timestamp}`,
  };
}

export function createTestSauna() {
  const timestamp = Date.now();
  return {
    name: `Test Sauna ${timestamp}`,
    heatingTimeHours: 2,
  };
}

export function getFutureDate(daysFromNow: number = 1): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

export function getFutureTime(hoursFromNow: number = 2): string {
  const date = new Date();
  date.setHours(date.getHours() + hoursFromNow);
  return `${String(date.getHours()).padStart(2, '0')}:00`;
}

export async function waitForToast(page: any, message?: string) {
  if (message) {
    await page.waitForSelector(`text=${message}`, { timeout: 5000 });
  } else {
    // Wait for any toast/notification
    await page.waitForSelector('[role="status"], [role="alert"], .toast', {
      timeout: 5000,
    });
  }
}
