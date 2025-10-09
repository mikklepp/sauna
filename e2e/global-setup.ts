/**
 * Playwright Global Setup
 *
 * Runs once before all tests to ensure the database is in a known state.
 */

import { resetTestClub, disconnectPrisma } from './helpers/test-fixtures';

async function globalSetup() {
  console.log('\n🌍 Running global E2E test setup...\n');

  try {
    // Reset the test club and all its data
    await resetTestClub();

    console.log('\n✅ Global setup complete!\n');
  } catch (error) {
    console.error('\n❌ Global setup failed:', error);
    throw error;
  } finally {
    await disconnectPrisma();
  }
}

export default globalSetup;
