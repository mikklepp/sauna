/**
 * Server Instrumentation
 * Runs once when the Next.js server starts
 *
 * Note: This file must be in the src/ directory or root directory
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server (not in Edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import dynamically to avoid loading on client
    const { renewClubSecrets } = await import('./lib/secret-renewal');

    // eslint-disable-next-line no-console
    console.log('🚀 Server starting - checking for club secret renewals...');

    try {
      const results = await renewClubSecrets();

      if (results.length > 0) {
        // eslint-disable-next-line no-console
        console.log(
          `✅ Server startup: Renewed ${results.length} club secret(s)`
        );
      } else {
        // eslint-disable-next-line no-console
        console.log('✅ Server startup: No club secrets need renewal');
      }
    } catch (error) {
      console.error('❌ Server startup: Failed to renew club secrets:', error);
    }
  }
}
