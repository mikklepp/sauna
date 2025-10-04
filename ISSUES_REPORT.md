# Issues Report

**Generated:** 2025-10-04
**Status:** In Progress

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Critical TypeScript Errors | 1 | 🔴 To Fix |
| Build Errors | 0 | ✅ None |
| Unit Test Failures | 0 | ✅ Passing |
| E2E Test Issues | TBD | ⏳ Not Run Yet |
| ESLint Warnings | ~60 | 🟡 Non-blocking |

---

## Category A: Critical TypeScript Errors (PRIORITY 1)

### Issue #1: Playwright Locator Method Not Found

**File:** `e2e/reservation-cancellation.spec.ts:257`
**Error:**
```
error TS2339: Property 'isInViewport' does not exist on type 'Locator'.
```

**Code:**
```typescript
const isInViewport = await futureReservations.isInViewport();
```

**Root Cause:**
`isInViewport()` method doesn't exist on Playwright's Locator type. Need to use alternative approach.

**Fix Required:**
Use bounding box check or scroll into view instead:
```typescript
// Option 1: Check if element is visible
await expect(futureReservations).toBeVisible();

// Option 2: Scroll into view and verify
await futureReservations.scrollIntoViewIfNeeded();
await expect(futureReservations).toBeInViewport();

// Option 3: Use bounding box
const box = await futureReservations.boundingBox();
expect(box).toBeTruthy();
```

**Priority:** 🔴 **CRITICAL** - Blocks TypeScript compilation

---

## Category B: Build Issues

### Status: ✅ **All Clear**

Build completed successfully with warnings only (no errors).

**Build Stats:**
- Total routes: 39
- First Load JS: 86.9 kB
- API routes: 20+
- Static pages: 39

---

## Category C: Unit Tests

### Status: ✅ **All Passing (23/23)**

```
✓ tests/lib/club-sauna.test.ts   (4 tests)
✓ tests/lib/availability.test.ts (5 tests)
✓ tests/lib/validation.test.ts   (14 tests)

Test Files  3 passed (3)
Tests      23 passed (23)
Duration   308ms
```

**No issues to fix.**

---

## Category D: ESLint Warnings (PRIORITY 3)

### Categorized Warnings

#### D1: React Hooks - Exhaustive Deps (~15 warnings)

**Files Affected:**
- `src/app/admin/boats/[id]/edit/page.tsx:40`
- `src/app/admin/clubs/[id]/edit/page.tsx:31`
- `src/app/admin/clubs/[id]/qr-code/page.tsx:26,32`
- `src/app/admin/clubs/[id]/theme/page.tsx:38`
- `src/app/admin/islands/[id]/edit/page.tsx:37`
- `src/app/admin/reports/page.tsx:66`
- `src/app/admin/saunas/[id]/edit/page.tsx:41`
- `src/app/island-device/[islandId]/page.tsx:55`
- `src/app/island-device/page.tsx:31`
- `src/app/islands/[islandId]/page.tsx:40`
- `src/app/islands/[islandId]/reserve/page.tsx:41,77`
- `src/app/islands/[islandId]/saunas/[saunaId]/reservations/page.tsx:41`
- `src/app/islands/[islandId]/shared/[sharedId]/page.tsx:64,104`

**Pattern:**
```
Warning: React Hook useEffect has a missing dependency: 'fetchData'.
Either include it or remove the dependency array.
```

**Fix Options:**
1. Add missing dependencies to useEffect array
2. Wrap functions in useCallback
3. Add ESLint disable comment if intentional

---

#### D2: Console Statements (~20 warnings)

**Files Affected:**
- `src/app/api/cron/evaluate-club-sauna/route.ts:104,118`
- `src/app/api/cron/generate-club-sauna/route.ts:66,101`
- `src/app/island-device/setup/page.tsx:67`
- `src/workers/club-sauna-evaluator.ts:43,51,65,71,145,164,178,213,222,229`
- `src/workers/club-sauna-generator.ts:88,92,100,111,146,155,177,184,191`

**Pattern:**
```
Warning: Unexpected console statement. no-console
```

**Fix Options:**
1. Remove console.log statements
2. Replace with proper logging service
3. Add ESLint disable for development/debugging

---

#### D3: TypeScript `any` Usage (~15 warnings)

**Files Affected:**
- `src/app/admin/clubs/page.tsx:17,18`
- `src/app/api/saunas/route.ts:56`
- `src/app/api/sync/push/route.ts:75`
- `src/app/island-device/[islandId]/page.tsx:25,26`
- `src/app/island-device/page.tsx:15`
- `src/app/island-device/settings/page.tsx:13,18`
- `src/app/island-device/setup/page.tsx:19`
- `src/app/islands/[islandId]/page.tsx:15,25,58`
- `src/app/islands/[islandId]/reserve/page.tsx:37`
- `src/app/islands/[islandId]/shared/[sharedId]/page.tsx:72`
- `src/components/ReservationForm.tsx:219,244`
- `src/types/index.ts:127,389`
- `src/workers/*.ts` (multiple)

**Pattern:**
```
Warning: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
```

**Fix Options:**
1. Replace `any` with specific types
2. Use generics where appropriate
3. Create proper type definitions

---

#### D4: Next.js Image Optimization (~5 warnings)

**Files Affected:**
- `src/app/admin/clubs/[id]/qr-code/page.tsx:113`
- `src/app/admin/clubs/[id]/theme/page.tsx:217,346`
- `src/app/admin/clubs/page.tsx:120`

**Pattern:**
```
Warning: Using <img> could result in slower LCP and higher bandwidth.
Consider using <Image /> from next/image
```

**Fix Options:**
1. Replace `<img>` with Next.js `<Image />` component
2. Add proper width/height attributes
3. Use appropriate loading strategies

---

#### D5: Metadata Configuration (~6 warnings)

**Files Affected:**
- Multiple pages with metadata exports

**Pattern:**
```
Warning: Unsupported metadata themeColor is configured in metadata export.
Please move it to viewport export instead.
```

**Fix Options:**
1. Move `themeColor` from `metadata` export to `viewport` export
2. Follow Next.js 14+ metadata conventions

---

## Category E: E2E Tests

### Status: ⏳ **Not Yet Executed**

**Prerequisites Needed:**
- [ ] Database running
- [ ] Database seeded with test data (admin user, clubs, islands, etc.)
- [ ] Environment variables configured
- [ ] Dev server running

**Expected Test Count:** 52 tests across 5 suites

**Will test once prerequisites are met.**

---

## Fix Priority Order

### Priority 1: Critical (Fix Now)
1. ✅ Fix TypeScript error in `e2e/reservation-cancellation.spec.ts:257`

### Priority 2: E2E Setup (Fix Next)
2. Set up test database
3. Seed test data
4. Run e2e tests
5. Fix any e2e test failures

### Priority 3: Code Quality (Fix After Tests Pass)
6. Fix React hooks exhaustive-deps warnings
7. Remove/replace console.log statements
8. Replace `any` types with proper types
9. Replace `<img>` with `<Image />`
10. Fix metadata/viewport configuration

---

## Non-Issues (Acceptable)

1. **Dynamic server usage warnings** - Expected for API routes using cookies
2. **Build warnings about metadata** - Will fix but not blocking
3. **Service worker files** - Auto-generated by next-pwa

---

## Next Steps

1. ✅ Fix critical TypeScript error
2. ⏳ Set up e2e test prerequisites
3. ⏳ Run e2e tests
4. ⏳ Document e2e test failures
5. ⏳ Fix all test failures
6. ⏳ Address ESLint warnings systematically

---

**Last Updated:** 2025-10-04
