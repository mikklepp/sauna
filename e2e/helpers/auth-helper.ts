import { getTestClubSecret } from './test-fixtures';

/**
 * Get a valid club secret for testing
 * Returns the test club secret from fixtures
 */
export async function getValidClubSecret(): Promise<string> {
  return getTestClubSecret();
}
