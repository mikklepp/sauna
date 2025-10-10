# Security Notes

## Known Development Dependencies Vulnerabilities

### Vite/Vitest esbuild Vulnerability (GHSA-67mh-4wv8-2f99)

**Status:** Tracked for future upgrade
**Severity:** Moderate
**Impact:** Development environment only (does not affect production)

**Details:**

- Vulnerability: esbuild <=0.24.2 allows websites to send requests to development server
- Affected packages: vite@5.4.20, vitest@2.1.9 (via esbuild dependency)
- Current versions: vite 5.4.20, vitest 2.1.9
- Fix requires: Upgrading to vite 7.1.9 (major version, breaking changes)

**Mitigation:**

- This vulnerability only affects the development server
- Production builds are not affected
- Development server should only be run in trusted environments
- Never expose development server to public internet

**Action Plan:**

- Will be addressed in Phase 4: Infrastructure Upgrades
- Requires thorough testing due to breaking changes in vite 7
- Coordinate with Prisma 6 upgrade (also in Phase 4)

**References:**

- https://github.com/advisories/GHSA-67mh-4wv8-2f99
- To upgrade: `npm audit fix --force` (breaking change)

## Security Best Practices

1. **Development Environment:**
   - Only run dev server on localhost
   - Use firewall to block external access to port 3000
   - Keep development dependencies updated regularly

2. **Production Environment:**
   - Uses Next.js production build (not affected by dev vulnerabilities)
   - All production dependencies are up-to-date
   - Regular security audits scheduled

3. **Monitoring:**
   - Monthly NPM audit reviews
   - Automated Dependabot alerts (if enabled on GitHub)
   - Security patches applied within 48 hours for critical issues

## Audit History

- **2025-10-10:** Initial audit - 6 moderate dev-only vulnerabilities identified
  - All related to esbuild/vite/vitest
  - Documented for Phase 4 upgrade
