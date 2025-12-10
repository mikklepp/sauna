# Architecture Analysis: Online vs Offline Modes

## Current State

### Two Parallel Flows

#### 1. Online User Flow (`/islands/*`)

**Data Source:** API endpoints (PostgreSQL via Prisma)
**Routes:**

- `/islands` - List islands
- `/islands/[islandId]` - View saunas with availability
- `/islands/[islandId]/reserve?saunaId=X` - Make reservation (boat → party → confirm → success)
- `/islands/[islandId]/saunas/[saunaId]/reservations` - View/cancel reservations
- `/islands/[islandId]/shared/[sharedId]` - Join shared reservation

**Features:**

- Club theming (logo, colors via ClubHeader component)
- Always requires internet
- Real-time data from database
- Full API validation
- Session-based auth

**Data Flow:**

```
Component → fetch('/api/...') → API Route → Prisma → PostgreSQL
```

#### 2. Island Device Flow (`/island-device/*`)

**Data Source:** IndexedDB (Dexie.js)
**Routes:**

- `/island-device` - Device home/selection
- `/island-device/setup` - Device configuration wizard
- `/island-device/settings` - Device settings
- `/island-device/[islandId]` - View saunas (with offline availability calculation)
- **(Missing)** `/island-device/[islandId]/saunas/[saunaId]` - Make reservation
- **(Missing)** `/island-device/[islandId]/saunas/[saunaId]/reservations` - View/cancel reservations

**Features:**

- Offline-first operation
- Sync status indicators
- Local availability calculation
- Device-specific (assigned to one island)
- Changes queued for sync

**Data Flow:**

```
Component → db/queries.ts → IndexedDB (Dexie) → Sync Queue
                                                    ↓
                                            [When Online] → Sync Service → API
```

### Code Duplication Assessment

#### What's Currently Duplicated

1. **Sauna listing pages** - `/islands/[islandId]/page.tsx` vs `/island-device/[islandId]/page.tsx`
   - Similar UI (sauna cards)
   - Different data sources
   - Different navigation paths
   - Island Device has sync status, online has club theming

2. **Reservation flow** - About to duplicate if I continued
   - Same steps: boat search → party size → confirm → success
   - Same validation logic
   - Different data sources

#### What's Shared

1. **UI Components** - Button, Card, Input, etc. (shadcn/ui)
2. **Icons** - lucide-react
3. **Utilities** - formatTime, date-fns
4. **Types** - Some overlap in interfaces

#### What's Unique

1. **Online Only:**
   - Club theming/branding
   - ClubHeader component
   - Session management
   - API error handling

2. **Offline Only:**
   - Sync status/management
   - IndexedDB queries
   - Offline availability calculation
   - Device configuration

## Problem Statement

Creating parallel route trees (`/islands/*` and `/island-device/*`) with similar functionality leads to:

1. **Code Duplication:** Same UI components, same business logic, different data sources
2. **Maintenance Burden:** Bug fixes need to be applied twice
3. **Inconsistent UX:** Changes to one flow don't automatically apply to the other
4. **Testing Overhead:** Need E2E tests for both flows

## Potential Solutions

### Option 1: Data Abstraction Layer (Repository Pattern)

**Approach:** Create a unified data service that switches between API and IndexedDB

```typescript
// src/lib/data-service.ts
interface DataService {
  getSaunas(islandId: string): Promise<Sauna[]>;
  getNextAvailable(saunaId: string): Promise<NextAvailable>;
  searchBoats(query: string): Promise<Boat[]>;
  createReservation(data: CreateReservationDTO): Promise<string>;
  // ... etc
}

class ApiDataService implements DataService {
  async getSaunas(islandId: string) {
    const res = await fetch(`/api/saunas?islandId=${islandId}`);
    return res.json();
  }
  // ...
}

class OfflineDataService implements DataService {
  async getSaunas(islandId: string) {
    return db.saunas.where('islandId').equals(islandId).toArray();
  }
  // ...
}

// Context or hook
function useDataService(): DataService {
  const isOfflineMode = useIslandDeviceMode();
  return isOfflineMode ? new OfflineDataService() : new ApiDataService();
}
```

**Pros:**

- Single set of UI components
- Consistent UX between modes
- Easy to test (mock the data service)
- Clear separation of concerns

**Cons:**

- Significant refactoring required
- Need to handle mode detection
- Some operations don't map 1:1 (e.g., sync status only for offline)
- Might be over-engineered for this use case

### Option 2: Route-Based Mode Detection

**Approach:** Use a single route tree, detect mode from URL

```typescript
// Unified route: /app/[mode]/[islandId]/page.tsx
// Where mode = 'islands' or 'island-device'

export default function IslandPage() {
  const { mode } = useParams();
  const isOfflineMode = mode === 'island-device';

  const saunas = isOfflineMode
    ? await loadFromIndexedDB()
    : await fetch('/api/saunas');

  return (
    <>
      {isOfflineMode ? <SyncStatus /> : <ClubHeader />}
      <SaunaList saunas={saunas} mode={mode} />
    </>
  );
}
```

**Pros:**

- Reduced duplication
- Easier to keep in sync
- Single route tree to maintain

**Cons:**

- Components become complex with mode conditionals
- Hard to read/understand
- Difficult to optimize for each mode
- Mixed concerns in components

### Option 3: Shared Components, Separate Routes (Current++)

**Approach:** Keep separate routes but extract and share common components

```typescript
// Shared components
<BoatSearchForm onSelect={handleSelect} boats={boats} />
<PartySizeForm adults={adults} kids={kids} onChange={...} />
<ReservationConfirmation data={data} onConfirm={...} />

// In /islands/[islandId]/reserve/page.tsx
export default function OnlineReservePage() {
  const boats = await fetch('/api/boats/search');
  return <BoatSearchForm boats={boats} ... />;
}

// In /island-device/[islandId]/saunas/[saunaId]/page.tsx
export default function OfflineReservePage() {
  const boats = await db.boats.toArray();
  return <BoatSearchForm boats={boats} ... />;
}
```

**Pros:**

- Minimal refactoring
- Each mode optimized independently
- Clear separation of modes
- Components stay simple

**Cons:**

- Still some duplication (data fetching logic)
- Two route trees to maintain
- Need to remember to update both

### Option 4: Hybrid - Smart Data Hooks + Shared Components

**Approach:** Create data hooks that handle mode detection, keep routes separate

```typescript
// src/hooks/use-saunas.ts
export function useSaunas(islandId: string) {
  const pathname = usePathname();
  const isOffline = pathname.startsWith('/island-device');

  if (isOffline) {
    return useOfflineSaunas(islandId); // IndexedDB
  }
  return useOnlineSaunas(islandId); // API
}

// In any component
const { saunas, loading, error } = useSaunas(islandId);
```

**Pros:**

- Clean component code
- Mode detection automated
- Data fetching logic centralized
- Easy to test and mock
- Gradual migration path

**Cons:**

- New abstraction layer
- Hook complexity for some operations
- Still need separate routes for different UX needs

## Recommendation

### Primary: **Option 4 - Hybrid Approach with Smart Data Hooks**

**Rationale:**

1. **Pragmatic:** Doesn't require massive refactoring
2. **Maintainable:** Data logic centralized, UI can share components
3. **Flexible:** Each mode can have unique UX where needed
4. **Testable:** Hooks are easy to test in isolation
5. **Progressive:** Can migrate gradually, one hook at a time

### Implementation Plan

#### Phase 1: Create Data Hooks (2-3 hours)

```
src/hooks/
  use-saunas.ts       - Get saunas for island
  use-availability.ts - Calculate next available
  use-boats.ts        - Search/get boats
  use-reservations.ts - Get/create/cancel reservations
  use-mode.ts         - Detect online/offline mode
```

#### Phase 2: Extract Shared UI Components (2-3 hours)

```
src/components/reservation/
  boat-search.tsx
  party-size-form.tsx
  reservation-summary.tsx
  success-screen.tsx
```

#### Phase 3: Refactor Existing Routes (3-4 hours)

- Update `/islands/*` to use hooks
- Update `/island-device/*` to use hooks
- Ensure both modes work correctly

#### Phase 4: Add Missing Island Device Routes (2-3 hours)

- Reservation creation flow
- Reservation list/cancellation
- Share components with online flow

### Secondary: **Option 3** (If Option 4 proves too complex)

If the hook abstraction becomes unwieldy, fall back to:

- Extract shared UI components
- Keep data fetching in routes
- Accept some duplication for clarity

## Key Decisions Needed

1. **Should Island Device have club theming?**
   - Currently: No (has sync status instead)
   - Could add: Club branding even in offline mode

2. **Should routes be unified or separate?**
   - Recommendation: Keep separate for clarity
   - `/islands/*` - Online, requires auth, club theming
   - `/island-device/*` - Offline-first, device-locked, sync status

3. **How much UI divergence is acceptable?**
   - Recommendation: Core flows identical, chrome different
   - Online: ClubHeader + theming
   - Offline: SyncStatus + device info

## Files to Create/Modify

### New Files (Option 4)

- `src/hooks/use-mode.ts`
- `src/hooks/use-saunas.ts`
- `src/hooks/use-availability.ts`
- `src/hooks/use-boats.ts`
- `src/hooks/use-reservations.ts`
- `src/components/reservation/boat-search.tsx`
- `src/components/reservation/party-size-form.tsx`
- `src/components/reservation/reservation-summary.tsx`
- `src/components/reservation/success-screen.tsx`

### Files to Delete

- `src/app/island-device/[islandId]/saunas/[saunaId]/page.tsx` (created in this session, not committed)

### Files to Refactor

- `src/app/islands/[islandId]/reserve/page.tsx` - Use hooks
- `src/app/islands/[islandId]/page.tsx` - Use hooks
- `src/app/island-device/[islandId]/page.tsx` - Use hooks

## Testing Strategy

1. **Unit Tests:** Test hooks in isolation with mocked data sources
2. **Integration Tests:** Test components with real hooks
3. **E2E Tests:** Test both flows end-to-end
4. **Snapshot Tests:** Ensure UI consistency

## Migration Risk Assessment

**Low Risk:**

- Hooks are additive, don't break existing code
- Can migrate one route at a time
- Easy to rollback (just don't use the hooks)

**Medium Risk:**

- Need to ensure mode detection is reliable
- Sync behavior must work correctly

**High Risk:**

- None identified

## Decision

**✅ APPROVED: Option 4 - Hybrid Approach with Smart Data Hooks**

Date: 2025-10-22
Status: In Progress

## Implementation Steps

1. ✅ Get approval on approach
2. ✅ Create `use-mode.ts` hook as foundation
3. ✅ Create `use-saunas.ts` data hook
4. ✅ Create `use-boats.ts` data hook
5. ✅ Create `use-availability.ts` data hook
6. ✅ Create `use-reservations.ts` data hook
7. ✅ Extract shared UI components
8. [ ] Update online routes to use hooks
9. [ ] Update offline routes to use hooks
10. [ ] Add E2E tests for both flows

## Completed Work

### Data Hooks ✅

- `src/hooks/use-mode.ts` - Mode detection (online vs offline)
- `src/hooks/use-saunas.ts` - Sauna data with availability
- `src/hooks/use-boats.ts` - Boat search and daily limit checks
- `src/hooks/use-availability.ts` - Next available time calculation
- `src/hooks/use-reservations.ts` - Create/cancel/list reservations
- `src/hooks/index.ts` - Unified exports

### Shared Components ✅

- `src/components/reservation/boat-search.tsx` - Boat search UI
- `src/components/reservation/party-size-form.tsx` - Party size input
- `src/components/reservation/reservation-summary.tsx` - Confirmation screen
- `src/components/reservation/success-screen.tsx` - Success state
- `src/components/reservation/index.ts` - Unified exports

### Infrastructure ✅

- All hooks automatically detect mode and use appropriate data source
- All components are mode-agnostic and work with both API and IndexedDB data
- Type-safe interfaces shared across online and offline modes
