# E2E Tests

End-to-end tests for the Sauna Reservation System using Playwright.

## Test Coverage

### Admin Authentication (`admin-auth.spec.ts`)

- Login form display
- Invalid credentials handling
- Successful login flow
- Session persistence
- Protected route redirection
- Logout functionality
- Registration flow

### Admin Management (`admin-management.spec.ts`)

- **Island Management**: Create, edit, delete islands
- **Sauna Management**: Create saunas, toggle auto Club Sauna feature
- **Boat Management**: Create, edit, delete boats, CSV import, search functionality
- **Club Management**: View QR codes, access theme editor

### Individual Reservations (`individual-reservation.spec.ts`)

- Island selection
- Sauna availability display
- Complete reservation workflow (boat search, party size, confirmation)
- Prevent double-booking (one reservation per boat per day)
- Next available time calculation
- Heating time handling
- Party size validation

### Shared Reservations (`shared-reservation.spec.ts`)

- Admin creation of shared reservations
- Editing and deleting shared reservations
- User joining shared reservations
- Gender schedule display
- Participant list display
- Prevent double-booking with individual reservations
- Club Sauna auto-creation settings

### Reservation Cancellation (`reservation-cancellation.spec.ts`)

- Display reservations list
- Cancel future reservations
- 15-minute cancellation cutoff enforcement
- Past reservation display (no cancel option)
- Visual separation of past/future reservations
- Auto-scroll to future reservations
- Empty state handling

## Running Tests

### Prerequisites

1. Ensure the database is set up and seeded with test data
2. Make sure all environment variables are configured

### Run all tests

```bash
npm run test:e2e
```

### Run tests with UI

```bash
npm run test:e2e:ui
```

### Run specific test file

```bash
npx playwright test e2e/admin-auth.spec.ts
```

### Run tests in headed mode (see browser)

```bash
npx playwright test --headed
```

### Run tests for specific browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Debug tests

```bash
npx playwright test --debug
```

## Test Data

Tests assume the following seed data exists:

- Admin user: username `admin`, password `admin123`
- At least one club
- At least one island
- At least one sauna
- Multiple boats for testing search and reservations

## Test Structure

Each test file follows this pattern:

1. **Setup** (`beforeEach`): Navigate to relevant page or login
2. **Test cases**: Exercise specific functionality
3. **Assertions**: Verify expected behavior
4. **Cleanup** (when needed): Tests generally rely on database rollback

## Test Helpers

Helper functions are available in `e2e/helpers/test-data.ts`:

- `loginAsAdmin()`: Quick admin login
- `createTestBoat()`: Generate unique boat test data
- `createTestIsland()`: Generate unique island test data
- `getFutureDate()`: Get formatted future date
- `waitForToast()`: Wait for success/error messages

## CI/CD Integration

E2E tests run automatically on:

- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`

See `.github/workflows/e2e-tests.yml` for CI configuration.

## Notes

- Tests use `data-testid` attributes for reliable element selection
- Tests are designed to be idempotent and can run in parallel
- Some tests may skip if required data doesn't exist
- Tests use realistic user workflows matching the specification
