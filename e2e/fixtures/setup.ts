import { test as base } from '@playwright/test';

/**
 * Extended test fixtures for e2e tests
 */

type TestFixtures = {
  // Add custom fixtures here
};

export const test = base.extend<TestFixtures>({
  // Custom fixtures can be defined here
});

export { expect } from '@playwright/test';
