## Specification Document

# Sauna Reservation System - Product Specification

## 1. Product Overview

### 1.1 Purpose

A dedicated sauna reservation system for island communities, providing streamlined booking management through a combination of web service backend and mobile/web application frontend.

### 1.2 System Components

- **Mobile Application (Island Device)**: Dedicated device per island (offline capable)
- **Mobile Application OR Web App (User Access)**: Personal devices or web browser with club access via QR code/club secret (requires internet)
- **Web Service**: Backend API and data management system
- **Web Portal**: Configuration interface for club administrators

## 2. Core Functionality

### 2.1 Sauna Management

- Support for 1-3 saunas per island
- Each sauna operates on hourly reservation slots (starting at top of the hour)
- Standard reservations are for 1-hour durations
- Shared sauna reservations have configurable duration per sex
- **Operating Hours**: 24/7 - no time restrictions

### 2.2 Reservation Types

#### 2.2.1 Individual Reservations

- Single boat reserves entire sauna for 1 hour
- Next available time slot only (no advance booking)
- Subject to all standard availability rules
- Tracked for annual reporting and invoicing purposes

#### 2.2.2 Shared Sauna Reservations

- Multiple boats can participate in a single reservation
- Can be created for any future date (advance booking allowed)
- Configuration parameters:
  - Linked to specific sauna
  - Start time (top of the hour)
  - Duration for males (in hours)
  - Duration for females (in hours)
  - Gender order: Males first OR Females first
  - Optional name/description (e.g., "Ladies Night", "Weekend Social")
- Participants join by selecting their boat and entering party size
- List of participating boats displayed
- Not counted toward the "one reservation per boat per day" limit for individual reservations
- **Reporting**: Tracked separately from individual reservations (not used for invoicing)

### 2.3 Time Slot Logic

#### When Sauna is Currently Reserved (In Use/Heated)

- Next available time = next free hour slot
- **Exception**: If the next free slot is within 15 minutes, skip to the following slot
- **UI Display**: Clearly indicate the sauna is currently reserved and heated
- Example: Current time 2:48 PM, current reservation ends 3:00 PM
  - Next slot would be 3:00 PM (in 12 minutes)
  - System skips and offers 4:00 PM instead
  - Display: "Sauna is currently reserved until 3:00 PM. Next available: 4:00 PM (sauna will be heated)"

#### When Sauna is Not Currently Reserved (Cold/Unheated)

- Propose a time slot based on configurable heating time (default 2-3 hours in future)
- **Heating time is configured in decimal hours** (e.g., 2.5h, 3.0h)
- Rationale: Allows sufficient heating time for a cold sauna
- **UI Display**: Clearly indicate the sauna is currently unheated and requires heating time
- Example: Current time 2:00 PM, sauna not in use, heating time 2.5 hours
  - Offer time slot at 4:30 PM (rounded to 5:00 PM)
  - Display: "Sauna is currently unheated. Next available: 5:00 PM (includes 2.5h heating time)"

#### When Shared Sauna Reservation Exists for Current Date

- Display shared reservation as an alternative option alongside individual reservation
- Show shared reservation details:
  - Name/description (if provided)
  - Start time
  - Gender schedule (e.g., "Males 6-8 PM, Females 8-10 PM")
  - List of participating boats
- User can choose to:
  - Make individual reservation (next available)
  - Join shared reservation

### 2.4 Individual Reservation Workflow

**Step 1: Sauna Selection**

- Display list of available saunas (1-3) on the island
- For each sauna show:
  - Current status (Available/In Use)
  - Next available time for individual reservation
  - Shared reservation option (if one exists for current date):
    - "Join Shared: [Name] at [Time]" or
    - "Join Shared Sauna at [Time]" (if no name)
- **Key Constraint**: User can ONLY book the next available time slot shown for individual reservations
- No ability to select alternative times or dates for individual reservations

**Step 2: Boat Selection**

- Text search interface
- Search from preconfigured list of boats
- **Search Priority**:
  - Primary: Boat name (fuzzy match)
  - Secondary: Membership number (exact or partial match)
- Real-time filtering as user types
- **Validation**: Check if selected boat already has a reservation (individual OR shared) on the island today
  - If yes: Display error message "This boat already has a reservation on the island today (individual or shared)" and prevent booking
  - If no: Proceed to party size entry
- Boat data displayed:
  - Boat name (not unique, for display only)
  - Membership number (required, unique identifier)
  - Captain name (optional, displayed during reservation)
  - Phone number (optional)

**Step 3: Party Size Entry**

- Prompt: "How many people will be using the sauna?"
- Input fields:
  - Number of adults (required, minimum 1)
  - Number of kids (optional, default 0)
- Validation: Total party size should be reasonable (e.g., max 10-15 people)

**Step 4: Confirmation**

- Confirm reservation details showing:
  - Sauna name
  - Time slot
  - Boat name
  - Captain name (if configured)
  - Membership number
  - Party size (X adults, Y kids)
- Create reservation record

### 2.5 Shared Sauna Reservation Workflow

#### Creating Shared Reservation (Admin Function via Web Portal)

- Select sauna
- Set date and start time
- Configure duration for males (hours)
- Configure duration for females (hours)
- Set gender order (Males first / Females first)
- Add optional name/description
- Create shared reservation

#### Joining Shared Reservation (User Function)

**Step 1: Sauna Selection**

- User sees shared reservation option displayed with individual reservation option
- User selects "Join Shared Reservation"

**Step 2: View Shared Reservation Details**

- Display:
  - Sauna name
  - Shared reservation name (if provided)
  - Start time
  - Gender schedule (e.g., "Males: 6:00-8:00 PM, Females: 8:00-10:00 PM")
  - List of boats already participating:
    - Boat name
    - Captain name (if available)
    - Adults/kids count

**Step 3: Boat Selection**

- Same search interface as individual reservations
- Same search prioritization (boat name primary, membership# secondary)
- **Validation**: Check if selected boat already has a reservation (individual OR shared) on the island today
  - If yes: Display error message and prevent joining
  - If no: Proceed to party size entry

**Step 4: Party Size Entry**

- Same as individual reservation
- Gender selection may be implicit based on schedule

**Step 5: Confirmation**

- Show summary with shared reservation details and boat participation
- Add boat to shared reservation participant list

### 2.6 Viewing Reservations

**Reservation List View**

- Accessible per sauna
- Display all reservations for selected sauna for current day:
  - **Individual Reservations**:
    - Time slot (start time)
    - Boat name
    - Captain name (if available)
    - Membership number
    - Party size (adults/kids)
    - Cancel button (if > 15 min before start time)
    - "Too late to cancel" message (if ≤ 15 min before start time)
  - **Shared Reservations**:
    - Start time
    - Shared reservation name (if provided)
    - Gender schedule display
    - "View Participants" button/expandable section
    - Participant list:
      - Boat name, captain, membership#, adults/kids per boat
    - Join button (if reservation is in future)

- **Display Behavior**:
  - Show both past and future reservations for current day
  - If all reservations don't fit on screen: Auto-scroll to show future reservations
  - Visual distinction: Past reservations grayed out or with subtle styling
- Sorted chronologically (earliest first)
- Clear visual separation between past and future

**Cancellation Process**

- Individual reservations only (cannot leave shared reservations)
- Time restriction: Cancellation only allowed until 15 minutes before start time
- Confirmation dialog required
- Immediate removal from list upon confirmation

## 3. Data Model

### 3.1 Club

- Club ID
- Club Name
- Club Secret (annual rotating credential)
- Secret Valid From (date)
- Secret Valid Until (date)
- Created At

### 3.2 Island

- Island ID
- Island Name
- Club ID (foreign key)
- Number of Saunas (1-3)
- Created At

### 3.3 Sauna

- Sauna ID
- Island ID (foreign key)
- Sauna Name
- Status (Available/Reserved)
- Heating Time (hours, configurable per sauna, default 2-3 hours)
- Created At

### 3.4 Boat

- Boat ID
- Boat Name (not unique, display purposes only)
- Membership Number (required, unique identifier within club)
- Captain Name (optional, displayed in reservations)
- Phone Number (optional)
- Club ID (foreign key)
- Created At

### 3.5 Reservation (Individual)

- Reservation ID
- Sauna ID (foreign key)
- Boat ID (foreign key)
- Start Time (timestamp, top of hour)
- End Time (timestamp, start time + 1 hour)
- Number of Adults (integer, required)
- Number of Kids (integer, default 0)
- Status (Active/Completed/Cancelled)
- Created At (timestamp)
- Cancelled At (timestamp, nullable)

### 3.6 Shared Sauna Reservation

- Shared Reservation ID
- Sauna ID (foreign key)
- Date (date)
- Start Time (time, top of hour)
- Males Duration (hours, integer)
- Females Duration (hours, integer)
- Gender Order (enum: MalesFirst, FemalesFirst)
- Name/Description (optional string)
- Created At (timestamp)
- Created By (admin reference)

### 3.7 Shared Reservation Participant

- Participant ID
- Shared Reservation ID (foreign key)
- Boat ID (foreign key)
- Number of Adults (integer, required)
- Number of Kids (integer, default 0)
- Joined At (timestamp)

## 4. User Interface Requirements

### 4.1 Main Screen

- Display all saunas for the island
- For each sauna show:
  - Sauna name/identifier
  - Current status (Available/In Use)
  - Next available time slot

### 4.2 Boat Search Screen

- Text input field for search
- **Search prioritization**:
  - **Primary match**: Boat name (fuzzy/partial matching)
  - **Secondary match**: Membership number (exact or partial)
- Real-time filtering as user types
- Display results showing:
  - Boat name (bold/prominent)
  - Captain name (if configured)
  - Membership number (secondary text)
- **Validation feedback**: If boat already has any reservation (individual or shared) today, display clear message:
  - "This boat already has a reservation on the island today"
  - Prevent selection/booking

### 4.3 Party Size Screen

- Header: "How many people will be using the sauna?"
- Input fields:
  - "Adults" (number input, required, min 1)
  - "Kids" (number input, optional, default 0)
- Visual: Simple, clear number pickers or input fields
- Continue button (enabled when adults ≥ 1)

### 4.4 Confirmation Screen

- Summary of reservation:
  - Sauna name
  - Reserved time slot
  - Boat name
  - Captain name (if available)
  - Membership number
  - Party size: "X adults, Y kids" or "X adults" if no kids
- Confirm/Cancel buttons

### 4.5 Reservation List Screen

- Accessed per sauna (view button/link on main screen)
- Header: Sauna name
- Display reservations for **current day only**:

  **Individual Reservations**:
  - Time slot (e.g., "2:00 PM - 3:00 PM")
  - Boat name
  - Captain name (if available)
  - Membership number
  - Party size (e.g., "3 adults, 2 kids")
  - Cancel button (if > 15 min before start time AND reservation is in future)
  - "Too late to cancel" message (if ≤ 15 min before start time)
  - Past reservations: Grayed out or dimmed styling, no cancel option

  **Shared Reservations**:
  - Time slot with duration (e.g., "6:00 PM - 10:00 PM")
  - Shared reservation name (if provided) or "Shared Sauna"
  - Gender schedule (e.g., "Males 6-8 PM, Females 8-10 PM")
  - Expandable/collapsible participant list:
    - Boat name, captain, membership#
    - Adults/kids per participant
  - "Join" button (if reservation hasn't started yet)

- **Scroll behavior**:
  - If all reservations don't fit on screen, auto-scroll to show future reservations
  - Past reservations of current day visible if user scrolls up
- Empty state: "No reservations for this sauna today"
- Reservations sorted chronologically (earliest first)
- Visual divider between past and future reservations

### 4.6 Cancellation Confirmation Dialog

- Modal/overlay dialog
- Message: "Cancel reservation for [Boat Name] at [Time]?"
- Two prominent buttons:
  - "Confirm Cancel" (destructive action styling)
  - "Keep Reservation" (default/safe action)
- Dismissible (tap outside or back button)

### 4.7 QR Code Authentication (Web App)

- Members scan QR code displayed at the club
- QR code contains authentication URL with embedded club secret:
  - Format: `https://your-app.com/auth?secret=ABC123`
  - Club Secret (annually rotating, expires December 31st)
- Upon successful scan:
  - Member's device opens the authentication URL
  - Backend validates club secret automatically
  - Member is authenticated and redirected to island selection
  - Session stored in browser cookies

### 4.8 Island Selection (User Device Mode)

- List of all islands in the club
- Island name for each
- Number of saunas per island
- Select island to view/manage
- Ability to switch between islands

### 4.9 Main Screen - Sauna Display

- List of saunas on selected island (1-3)
- For each sauna:
  - Sauna name
  - Current status (Available/In Use)
  - Next available time for individual reservation
  - Shared reservation indicator (if exists for today):
    - "Join Shared: [Name]" or "Join Shared Sauna"
    - Time and brief schedule info
  - "View Reservations" button
  - "Make Reservation" button (for individual)
  - "Join Shared" button (if applicable)

### 4.10 Shared Reservation Detail View

- Displayed when user selects to join shared reservation
- Information shown:
  - Sauna name
  - Shared reservation name (if provided)
  - Date
  - Start time
  - Gender schedule with times:
    - "Males: 6:00 PM - 8:00 PM"
    - "Females: 8:00 PM - 10:00 PM"
  - Current participants:
    - Boat name, captain (if available)
    - Party size per boat
  - "Join This Shared Sauna" button

## 5. Business Rules

### 5.1 Time Slot Rules

- All reservations start at the top of the hour (e.g., 2:00, 3:00, 4:00)
- All reservations are exactly 1 hour in duration
- Minimum buffer before next available slot: 15 minutes
- Heating time consideration: Configurable per sauna (default 2-3 hours when sauna is cold)
- Cancellation cutoff: 15 minutes before start time

### 5.2 Availability Rules

- Only one individual reservation per sauna per time slot
- Individual reservations cannot overlap
- Past time slots cannot be booked for individual reservations
- **One reservation (individual OR shared) per boat per island per day** (enforced by membership number)
  - **Day boundary** = 6:00 AM (the "current day" starts at the most recent 6 AM)
  - If current time is Tuesday 2:00 AM, check for reservations from Monday 6:00 AM onwards (still in "Monday's day")
  - If current time is Tuesday 7:00 AM, check for reservations from Tuesday 6:00 AM onwards (now in "Tuesday's day")
  - Example: A boat can book at Monday 11:00 PM and again at Tuesday 5:00 AM (before crossing the 6 AM boundary)
  - Example: A boat CANNOT book at Tuesday 7:00 AM and again at Tuesday 11:00 PM (both after the 6 AM boundary)
  - Prevents multiple reservations on the same "day" while allowing late-night to early-morning transitions
- Users can only book the next available time slot for individual reservations (no future date selection)
- Shared reservations can be created for any future date
- Shared reservations can overlap or coexist with individual reservations (different use cases)

### 5.3 Boat Association

- Each reservation must be associated with a boat
- Boat must have a valid membership number
- Boats are identified uniquely by membership number (boat names may be duplicated)
- Boats belong to clubs (not individual islands)
- Captain name (optional) is displayed when present
- A boat can have either ONE individual reservation OR ONE shared reservation participation per island per day (not both)
  - Day is defined as starting at the most recent 6:00 AM (any reservation with startTime >= most recent 6 AM)

### 5.4 Cancellation Rules

- **Individual reservations only**: Cancellation allowed until 15 minutes before start time
- **Shared reservations**: Cannot cancel individual participation (design decision TBD)
- After the 15-minute cutoff, cancellation is not permitted
- Cancellation requires explicit confirmation (two-step process)
- Cancelled reservations are tracked for reporting purposes
- Cancelled slots immediately become available for rebooking
- No penalties or no-show handling for missed reservations

### 5.5 Club and Access Rules

- Each club has a unique secret that rotates annually
- Club secret provides access to all islands within the club
- **Single timezone per club** (all islands in a club operate in same timezone)
- Dedicated island devices operate offline after initial configuration
- User devices require internet connection and valid club secret
- Users with club access can view and book any island in the club

### 5.6 Shared Sauna Rules

- Shared reservations are created by administrators via web portal
- Can be created for any future date
- Multiple boats can participate
- Each participating boat provides adult/kid count
- **Participation counts toward the one-reservation-per-day limit**
- **Participation tracked in sauna metrics (adults/kids, unique boats)**
- Individual reservations take precedence for invoicing purposes

## 6. Technical Requirements

### 6.1 Mobile Application

**Platform**: TBD (iOS/Android/Cross-platform)

**Deployment Modes**:

1. **Dedicated Island Device Mode** (Priority Device):
   - One device permanently assigned to one island
   - **Absolute priority** for all data operations
   - Offline-capable after initial configuration
   - Local database is source of truth
   - Auto-selects configured island on launch
   - Other devices sync TO this device
   - Must be a native mobile app
2. **User Access Mode** (Secondary Access):
   - **Option A: Native Mobile App**
     - Installed on personal smartphones/tablets
     - QR code authentication using club secret
   - **Option B: Web Application**
     - Access via web browser (responsive design)
     - Login using club secret directly
     - No installation required
   - Both options:
     - Require internet connection
     - Can access all islands within the club
     - Session-based authentication
     - **Sync Status Display**: Show whether changes have been successfully synced to Island Device
     - **Fallback**: If communication fails, users can visit Island Device directly

**Data Management**:

- **Island Device**:
  - Local SQLite or similar embedded database
  - Source of truth for all reservations
  - Accepts sync requests from user access points
  - Conflict resolution not needed (island device wins)
- **User Access Points** (Mobile App or Web App):
  - Cache configuration data
  - Submit changes to backend AND Island Device (if online)
  - Display sync status:
    - ✓ "Synced to Island Device"
    - ⟳ "Syncing..."
    - ⚠ "Not synced - visit Island Device"
  - Queue operations when Island Device offline

**Web App Advantages**:

- No app store approval process
- Works on any device with a browser
- Easier updates (no user app updates required)
- Lower barrier to entry for users
- Same functionality as native mobile app for users

**Synchronization Architecture**:

```
User Access (Mobile/Web) → Backend API → Island Device (if online)
                              ↓
                    Island Device periodically syncs with backend (when online)
```

**Priority Rules**:

- Island Device changes are immediately authoritative
- User access changes pending until confirmed by Island Device
- In case of conflict: Island Device version always wins
- User access points poll for Island Device sync confirmation

### 6.2 Web Service

**Core Functionality**:

- RESTful API architecture
- Real-time availability checking
- Multi-club and multi-island support
- Data persistence and backup
- QR code generation for club access

**API Endpoints** (examples):

- Authentication: `/api/auth/validate-club-secret`
- Configuration: `/api/clubs/{clubId}/config`
- Islands: `/api/clubs/{clubId}/islands`
- Reservations: `/api/islands/{islandId}/reservations`
- Shared Reservations: `/api/islands/{islandId}/shared-reservations`
- Join Shared: `/api/shared-reservations/{id}/join`
- Availability: `/api/saunas/{saunaId}/next-available`
- Boat validation: `/api/boats/{membershipNumber}/daily-limit`
- Island Device Sync: `/api/islands/{islandId}/sync-status`
- Push to Island Device: `/api/islands/{islandId}/push-reservation`

**Reporting Engine**:

- Annual statistics generation
- Data aggregation per sauna, boat, and island
- Export capabilities (CSV, PDF)

### 6.3 Web Portal (Admin Configuration)

**Purpose**: Configuration management interface for club administrators

**Functionality**:

- Club management:
  - Create/edit club information
  - Generate and manage club secrets (annual rotation)
  - Generate QR codes for club access
  - **Upload club logo**
  - **Configure club colors** (primary and secondary)
- Island management:
  - Add/edit islands
  - Configure island names
  - Assign islands to clubs
- Sauna management:
  - Add/edit saunas per island
  - Configure sauna names
  - Set heating time per sauna
- Boat management:
  - Add/edit boats
  - Manage boat details (name, membership#, captain, phone)
  - Assign boats to clubs
  - Bulk import/export capabilities

- Shared Sauna Management:
  - Create shared reservations for specific saunas and dates
  - Configure gender schedule and duration
  - Add optional name/description
  - View participant lists
  - Cancel/modify shared reservations

- Device configuration:
  - Generate configuration packages for dedicated devices
  - Assign island to dedicated device
  - Download offline configuration bundle

- Reporting:
  - View annual statistics
  - Export reports
  - Filter by club, island, sauna, or boat

**Access Control**:

- Admin authentication
- Role-based permissions (club admin, system admin)

### 6.4 User Interface Design System

**Component Library**: shadcn/ui

- Accessible, customizable React components
- Built on Radix UI primitives
- Tailwind CSS styling
- Fully themeable

**Theming System**:

- **Club-Specific Theming**:
  - Each club has customizable branding
  - Logo: Upload and display in headers/navigation
  - Primary Color: Main brand color for buttons, headers, active states
  - Secondary Color: Accent color for highlights, secondary actions
- **Theme Application**:
  - Themes applied dynamically based on club context
  - CSS custom properties for color variables
  - Logo displayed prominently in navigation
  - Consistent application across all user-facing interfaces
- **Default Theme**:
  - System provides default theme for admin portal
  - Neutral color scheme for configuration interfaces
- **Theme Configuration** (via Admin Portal):
  - Visual theme editor
  - Logo upload (SVG, PNG recommended)
  - Color pickers for primary/secondary colors
  - Live preview of theme application
  - Accessibility contrast checking

**Responsive Design**:

- Mobile-first approach
- Works on phones, tablets, and desktops
- Touch-friendly interface elements
- Progressive enhancement

### 6.5 Security

**Authentication**:

- Club secret-based access for user devices
- Annual secret rotation (automated or manual)
- Device authentication for dedicated island devices
- Admin portal: Username/password with 2FA recommended

**Data Protection**:

- Encryption in transit (HTTPS/TLS)
- Secure storage of membership information
- QR code expiration aligned with club secret validity
- Audit logging for configuration changes

**Privacy**:

- Minimal personal data collection
- No tracking of actual sauna usage
- Phone numbers optional and protected

### 6.6 Development Infrastructure

**Version Control**:

- Git repository hosted on GitHub/GitLab
- Branching strategy: main, develop, feature branches
- Pull request workflow with code review
- Semantic versioning for releases

**Repository Structure**:

```
/
├── README.md                 # Detailed development notes
├── docs/                     # Additional documentation
│   ├── API.md               # API documentation
│   ├── DEPLOYMENT.md        # Deployment guide
│   └── ARCHITECTURE.md      # System architecture
├── packages/
│   ├── web-app/             # Web application (React/Next.js)
│   ├── mobile-app/          # Mobile application (React Native)
│   ├── api/                 # Backend API
│   ├── shared/              # Shared types and utilities
│   └── admin-portal/        # Admin configuration portal
├── tests/
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── e2e/                 # End-to-end tests
└── .github/
    └── workflows/           # CI/CD workflows
```

**README.md Requirements**:

- Project overview and architecture
- Prerequisites and dependencies
- Local development setup instructions
- Database schema and migrations
- API endpoint documentation
- Testing strategy and commands
- Deployment procedures
- Environment variables and configuration
- Troubleshooting guide
- Contributing guidelines
- Technology stack details

**Automated Testing**:

- **Unit Tests**:
  - Component testing (React Testing Library)
  - Business logic testing (Jest/Vitest)
  - Minimum 80% code coverage target
- **Integration Tests**:
  - API endpoint testing
  - Database interaction testing
  - Authentication flow testing
- **End-to-End Tests**:
  - User flow testing (Playwright/Cypress)
  - Critical path coverage
  - Reservation creation and cancellation
  - Shared reservation joining
  - Admin configuration flows
- **Test Execution**:
  - Run on every pull request
  - Required passing for merge
  - Coverage reports generated

**Automated Build**:

- **CI/CD Pipeline** (GitHub Actions or similar):
  - Trigger on push to main/develop
  - Install dependencies
  - Run linting (ESLint, Prettier)
  - Run type checking (TypeScript)
  - Run all tests
  - Build all packages
  - Generate build artifacts
- **Build Optimization**:
  - Tree shaking and code splitting
  - Asset optimization (images, fonts)
  - Bundle size monitoring
  - Performance budgets

**Automated Deployment to Vercel**:

- **Production Deployment**:
  - Automatic deployment on merge to main
  - Preview deployments for pull requests
  - Environment variable management
  - Custom domain configuration per club (optional)
- **Vercel Configuration** (vercel.json):
  - Build settings
  - Output directory configuration
  - Environment variable mappings
  - Routing rules
  - Headers and redirects
- **Deployment Environments**:
  - Production: main branch → production.vercel.app
  - Staging: develop branch → staging.vercel.app
  - Preview: PR branches → unique preview URLs
- **Post-Deployment**:
  - Smoke tests run automatically
  - Health check endpoints monitored
  - Rollback capability if issues detected
  - Deployment notifications (Slack/Discord)

**Technology Stack**:

- **Frontend**: Next.js 14+ (React 18+)
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **State Management**: React Context / Zustand
- **API Client**: tRPC or REST with React Query
- **Backend**: Next.js API Routes or separate Node.js/Express
- **Database**: PostgreSQL (Vercel Postgres) or Supabase
- **ORM**: Prisma or Drizzle
- **Authentication**: NextAuth.js or custom
- **Testing**: Vitest, React Testing Library, Playwright
- **Deployment**: Vercel
- **Monitoring**: Vercel Analytics, Sentry (optional)

**Code Quality**:

- ESLint with strict rules
- Prettier for code formatting
- TypeScript strict mode
- Pre-commit hooks (Husky + lint-staged)
- Conventional commits
- Automated dependency updates (Dependabot/Renovate)

## 7. Reporting Requirements

### 7.1 Annual Reports (Key Metrics)

**Per Sauna Reports**:

1. **Total Hours Reserved (Individual Reservations Only)**
   - Sum of all individual reservation hours (1 hour per reservation)
   - Includes completed individual reservations
   - Excludes cancelled individual reservations that never occurred
   - **Used for invoicing purposes**
   - Shared reservations NOT included in this metric
2. **Total Adults and Kids**
   - **Individual Reservations**:
     - Sum of all adults across all individual reservations
     - Sum of all kids across all individual reservations
   - **Shared Reservations** (reported separately):
     - Sum of all adults across all shared reservation participants
     - Sum of all kids across all shared reservation participants
   - **Combined Total** (optional):
     - Grand total of adults (individual + shared)
     - Grand total of kids (individual + shared)
   - Breakdown by month/quarter optional
3. **Unique Boats Count**
   - Count of distinct boats (by membership number) that used the sauna
   - **Includes both individual reservations AND shared participation**
   - Yearly unique count
   - Optional breakdown: Individual only vs Shared only vs Both

**Per Boat Reports**:

1. **Total Individual Reservations**
   - Count of individual reservations made by each boat (by membership number)
   - Annual total per boat
   - Can be aggregated across all islands or per island
   - **Primary metric for invoicing**
2. **Shared Reservation Participation (Separate Tracking)**
   - Count of shared reservations joined by each boat
   - Listed separately from individual reservations
   - Includes adults/kids count per shared participation
   - NOT used for invoicing
   - **Counts toward daily reservation limit**

**Shared Sauna Reports**:

1. **Total Shared Reservations Per Sauna**
   - Count of shared reservations held per sauna
   - Total participants across all shared reservations
   - Total adults/kids in shared reservations

2. **Participation Summary**
   - Which boats participated in shared reservations
   - Frequency of shared reservation participation per boat

**Report Outputs**:

- Available through web portal
- Export formats: CSV, PDF
- Date range selection (default: current year, Jan 1 - Dec 31)
- Filter options: By club, island, sauna, boat
- Clear separation: Individual vs Shared metrics
- Combined metrics showing totals across both types

### 7.2 Data Retention

**For Reporting**:

- Individual reservation records maintained after completion for invoicing and reporting
- Shared reservation records and participation maintained for reporting
- Minimum retention: 2 years for historical comparison
- Individual reservations include: Sauna, Boat, Date/Time, Adults, Kids, Status (Completed/Cancelled)
- Shared participation includes: Shared Reservation details, Boat, Adults, Kids, Join timestamp

**Excluded from Reports**:

- Cancelled individual reservations that never took place (cancelled before start time)
- No-show data (not tracked)

### 7.3 Real-time Metrics (Optional Future Enhancement)

- Current day usage statistics
- Peak usage times
- Average party size
- Cancellation rates
- Shared vs individual reservation ratios

## 8. Configuration and Deployment Workflow

### 8.1 Initial Setup (via Web Portal)

**Step 1: Club Creation**

- Admin creates club in web portal
- Sets club name
- System generates initial club secret
- Admin generates QR code for club access

**Step 2: Island Configuration**

- Admin adds islands to club
- Sets island names
- Specifies number of saunas per island (1-3)

**Step 3: Sauna Configuration**

- For each island, admin configures saunas:
  - Sauna name
  - Heating time (hours)

**Step 4: Boat Configuration**

- Admin adds boats to club:
  - Boat name
  - Membership number (unique within club)
  - Captain name (optional)
  - Phone number (optional)
- Bulk import option (CSV upload)

**Step 5: Create Shared Reservations (Optional)**

- Admin can create shared sauna reservations:
  - Select sauna
  - Set future date and start time
  - Configure males duration and females duration
  - Set gender order
  - Add optional name/description

### 8.2 Dedicated Device Deployment

**Step 1: Download Configuration**

- Admin selects island in web portal
- Downloads configuration package containing:
  - Island data
  - Sauna configurations
  - Complete boat list for club
  - Device authentication credentials

**Step 2: Device Setup**

- Install app on dedicated device
- Import configuration package
- App enters "Dedicated Device Mode"
- Device locked to selected island
- Local database initialized with configuration

**Step 3: Offline Operation**

- Device operates independently without internet
- All reservations stored locally
- Periodic sync when internet available (optional)

### 8.3 User Access Setup

**Option A: Native Mobile App**

**Step 1: App Installation**

- User downloads app from app store
- Opens app (no configuration present)

**Step 2: QR Code Scanning**

- User selects "Scan Club QR Code"
- Scans QR code (provided by club admin)
- App validates club secret with backend (requires internet)
- **Note**: User app requires internet connectivity at all times

**Step 3: Island Access**

- App downloads club configuration
- User presented with list of all islands in club
- User selects island to view/manage
- Can switch between islands within the club

**Option B: Web Application**

**Step 1: Navigate to Web App**

- User visits club-specific URL or general web app URL
- Example: `https://saunareservations.app` or `https://saunareservations.app/[club-name]`

**Step 2: Authentication**

- **Method 1: Direct Secret Entry**
  - User enters club secret directly
  - Backend validates secret
- **Method 2: QR Code Scan** (if device has camera)
  - User clicks "Scan QR Code"
  - Scans club QR code with device camera
  - Extracts and validates club secret
- **Method 3: Link from QR Code**
  - QR code contains URL with embedded club secret
  - Example: `https://saunareservations.app?secret=ABC123XYZ`
  - User scans QR, opens link, automatically authenticated

**Step 3: Island Access**

- Web app downloads club configuration
- User presented with list of all islands in club
- User selects island to view/manage
- Can switch between islands within the club
- Session maintained via browser session/cookies

**Making Reservations (Both Options)**

- User makes reservation on selected island
- System attempts to sync to Island Device:
  - **Success**: Shows "✓ Synced to Island Device"
  - **In Progress**: Shows "⟳ Syncing..."
  - **Failure**: Shows "⚠ Not synced - please visit Island Device"
- If sync fails, user is advised to visit Island Device to confirm/make reservation

### 8.4 Annual Club Secret Rotation

**Process**:

- Admin initiates secret rotation in web portal (typically Jan 1)
- New secret generated
- New QR code created
- Old secret remains valid for grace period (e.g., 30 days)
- Dedicated devices updated via sync or manual configuration update
- User devices require re-authentication with new QR code after grace period

### 8.5 Configuration Updates

**Via Web Portal**:

- Add/edit/remove boats
- Modify sauna settings (name, heating time)
- Add/remove islands or saunas
- Create/modify/cancel shared reservations

**Propagation**:

- **Island Devices (Absolute Priority)**:
  - Periodic sync when online (recommended: hourly)
  - Manual configuration update download
  - Island Device data always takes precedence
- **User Access Points** (Mobile App or Web App):
  - Automatic download on session start (when online)
  - Configuration cached (mobile app) or session-based (web app)
  - Sync status always displayed for reservations

**Synchronization Flow**:

```
1. User Access Point (Mobile/Web) makes reservation → Backend API
2. Backend attempts push to Island Device (if online)
3. Island Device confirms receipt → Backend updates status
4. User Access Point polls for confirmation → Shows sync status
5. If Island Device offline: User advised to visit device
```

**Conflict Resolution**:

- Island Device is always source of truth
- User Access Point reservations are "pending" until Island Device confirms
- Double-bookings prevented by Island Device validation
- Users can manually check Island Device if uncertain

## 9. Open Questions & Future Considerations

1. ~~**Cancellation Policy**: How can users cancel reservations? Time limits?~~ ✓ Resolved: 15 minutes before start time
2. ~~**No-show Handling**: What happens if a reserved sauna isn't used?~~ ✓ Resolved: No tracking or penalties
3. ~~**Admin Interface**: How are boats and saunas configured?~~ ✓ Resolved: Web portal
4. ~~**Reporting**: What analytics or usage reports are needed?~~ ✓ Resolved: Annual metrics specified
5. ~~**Peak Hours**: Should there be limits on reservations per boat per day?~~ ✓ Resolved: One individual reservation per day per island (day starts at most recent 6 AM)
6. ~~**Heating Time**: Should this be configurable per sauna?~~ ✓ Resolved: Yes, configurable
7. ~~**Multi-day Reservations**: Are advance bookings allowed? How far ahead?~~ ✓ Resolved: Only next available for individual, any future date for shared
8. ~~**Operating Hours**: Are there specific hours when saunas can be reserved?~~ ✓ Resolved: 24/7 operation
9. ~~**Past Reservation Display**: Should the reservation list show only future/current reservations, or also recently past ones?~~ ✓ Resolved: Current day past + future, auto-scroll to future
10. ~~**Search Optimization**: Should boat search prioritize certain fields?~~ ✓ Resolved: Boat name primary, membership# secondary
11. ~~**Time Zone**: How to handle if islands are in different time zones?~~ ✓ Resolved: Single timezone per club
12. ~~**Sync Conflicts**: For dedicated devices, how to handle conflicting reservations made during offline period?~~ ✓ Resolved: Island Device has absolute priority
13. **Shared Reservation Cancellation**: Can participants leave a shared reservation? If so, what's the time limit?
14. **Shared Reservation Capacity**: Should there be a limit on number of participants in shared reservations?
15. **Grace Period**: How long should old club secrets remain valid during annual rotation?
16. **Maximum Party Size**: Is there a reasonable limit on total people (adults + kids)?
17. **Device Management**: Can a dedicated device be reassigned to a different island?
18. **Notification System**: Should users receive reminders? How without requiring phone numbers?
19. **Historical Data Migration**: When implementing, how to handle existing reservation data?
20. **Backup and Recovery**: Disaster recovery plan for dedicated offline devices?
21. **Multi-language Support**: Should the app support multiple languages?
22. **Accessibility**: WCAG compliance requirements for web portal and mobile app?
23. ~~**Island Device Fallback**: If Island Device fails completely, can user devices operate independently temporarily?~~ Addressed: Users visit Island Device
24. **Sync Retry Logic**: How many times should user access points retry syncing to Island Device?
25. **Gender Self-Selection**: For shared reservations, how do users indicate which time slot (male/female) they're joining?
26. **Web App vs Mobile App**: Should user access be primarily web-based, mobile app, or both?
27. **QR Code URL Format**: ✅ **DECIDED** - QR codes contain direct authentication URLs (`/auth?secret=ABC123`) for seamless member access
28. **Session Duration**: How long should web app sessions remain active?
29. **Browser Compatibility**: Which browsers must the web app support?
30. **Theme Preview**: Should admins be able to preview theme changes before publishing?
31. **Logo Specifications**: What are the requirements for logo files (format, size, dimensions)?
32. **Color Accessibility**: How to ensure club colors meet accessibility standards?
33. **Multi-Club Theme Management**: Can same deployment serve multiple clubs with different themes?
34. **Build Performance**: Target build time for CI/CD pipeline?
35. **Test Coverage Targets**: Specific coverage requirements for different test types?
36. **Deployment Rollback**: Automated rollback criteria if deployment issues detected?

## 10. Success Criteria

**User Experience**:

- Simple, intuitive interface requiring minimal training
- Fast individual reservation process (< 45 seconds per booking including party size entry)
- Easy shared reservation joining (< 30 seconds)
- Accurate real-time availability information
- 15-minute cancellation cutoff is clearly communicated and enforced
- Users understand fallback procedure: Visit Island Device if sync fails
- Shared reservations are easy to discover and join
- Search prioritizes boat names effectively
- Current day view shows past reservations without cluttering future availability
- Daily reservation limit (one per boat) enforced across both individual and shared types

**Technical Performance**:

- 99.9% uptime for web service
- Zero double-booking incidents
- **Island Devices operate reliably in offline mode with absolute data priority**
- **User Access Points (Mobile/Web) clearly display sync status with Island Device**
- User access can reach any island within club via club secret
- Web app works seamlessly across modern browsers (Chrome, Firefox, Safari, Edge)
- Page load time < 2 seconds
- Time to interactive < 3 seconds

**Branding & Theming**:

- Club logo displayed prominently throughout user interface
- Club colors (primary/secondary) consistently applied
- Theme customization easy and intuitive for admins
- Visual consistency across all screens and components
- Accessible color contrasts maintained

**Development & Deployment**:

- Comprehensive README.md with clear setup instructions
- All tests pass before deployment
- Automated deployment to Vercel completes in < 10 minutes
- Code coverage meets targets (80%+ for critical paths)
- Build artifacts optimized for performance
- Deployment preview URLs work for all PRs
- Zero-downtime deployments

**Data & Reporting**:

- Annual reporting provides accurate usage statistics with clear separation and combination of individual vs shared metrics
- Configuration changes propagate within 24 hours (or immediately with manual sync)
- Reports export successfully to CSV and PDF formats

## 11. E2E Testing Best Practices

Based on systematic testing and debugging of the complete E2E test suite, the following best practices have been established for reliable, maintainable Playwright tests.

### 11.1 Core Principles

**Always Use Explicit Waits**

- Never rely solely on `waitForLoadState('networkidle')`
- Network idle doesn't guarantee DOM elements are visible or populated
- Always wait for the specific element you need before interacting with it

**Prefer data-testid Over Role-Based Selectors**

- ✅ `page.getByTestId('island-link')`
- ❌ `page.getByRole('button', { name: /view all reservations/i })`
- data-testid selectors are:
  - More reliable and less fragile
  - Not affected by text changes or localization
  - Faster to execute
  - Less prone to strict mode violations

**Wait for Content, Not Just Visibility**

- Elements can exist in DOM but be empty while data loads
- Example: Header element renders immediately but island name loads asynchronously
- ✅ Use `toContainText()` with timeout to wait for content
- ❌ Don't separate `waitFor({ state: 'visible' })` from content assertions

### 11.2 Common Timing Patterns

**Island/Page Navigation Pattern**

```typescript
// Wait for link visibility before clicking
const islandLink = page.locator('[data-testid="island-link"]').first();
await islandLink.waitFor({ state: 'visible', timeout: 5000 });
await islandLink.click();

// Wait for navigation
await page.waitForURL(/\/islands\/[^/]+$/);
await page.waitForLoadState('networkidle');

// Wait for content to load (sauna cards, headers, etc.)
const saunaCards = page.locator('[data-testid="sauna-card"]');
await saunaCards.first().waitFor({ state: 'visible', timeout: 5000 });
```

**Header Content Pattern**

```typescript
// DON'T: Wait for header visibility separately
await page.locator('header').waitFor({ state: 'visible', timeout: 5000 });
await expect(page.locator('header')).toContainText(islandName);

// DO: Wait for header to contain expected text (combines both checks)
await expect(page.locator('header')).toContainText(islandName, {
  timeout: 10000,
});
```

**Reservation List Pattern**

```typescript
// After navigation to reservations page
await page.waitForURL(/\/saunas\/[^/]+\/reservations$/);
await page.waitForLoadState('networkidle');

// Wait for actual reservation items to load (not just network idle)
await page
  .locator('[data-testid="reservation-item"]')
  .first()
  .waitFor({ state: 'visible', timeout: 5000 });
```

### 11.3 Scoping Selectors

**Avoid Strict Mode Violations**

```typescript
// DON'T: Query entire page when multiple elements exist
const cancelButton = page.getByTestId('cancel-button'); // Fails if 2+ buttons

// DO: Scope to specific container
const firstReservation = page
  .locator('[data-testid="reservation-item"]')
  .first();
const cancelButton = firstReservation.getByTestId('cancel-button');
```

### 11.4 Test Data Management

**Use Specific, Unique Test Data**

- ✅ `'Test Gamma'` - specific boat name
- ❌ `'Test'` - matches multiple boats, gets filtered from search results
- Prevents false positives from data contamination
- Reduces flaky tests from overlapping test runs

**Handle Precondition Failures Gracefully**

```typescript
// DON'T: Assume first action always succeeds
const result = await createReservationWithBoat(page, 'Test Alpha');
expect(result.success).toBe(true); // Fails if boat already has reservation

// DO: Skip test if precondition not met
const result = await createReservationWithBoat(page, 'Test Alpha');
if (!result.success) {
  test.skip(); // Behavior already validated by existing reservation
}
```

### 11.5 URL and Navigation

**Match Actual Routes, Not Expected Routes**

```typescript
// DON'T: Assume simplified URL patterns
await page.waitForURL(/\/reservations$/);

// DO: Match actual nested route structure
await page.waitForURL(/\/saunas\/[^/]+\/reservations$/);
```

**Use Helper Functions for Navigation**

```typescript
// DON'T: Construct URLs with complex regex replacements
await page.goto(
  page.url().replace(/\/islands\/[^/]+\/.*$/, (match) => {
    const islandId = match.match(/\/islands\/([^/]+)/)?.[1];
    return `/islands/${islandId}/reserve?saunaId=...`;
  })
);

// DO: Use helper functions that handle navigation logic
await navigateToReservePage(page);
```

### 11.6 Authentication and Session

**Reusable Authentication Helpers**

```typescript
// Helper handles complex flows: QR auth, welcome page, session persistence
await authenticateMember(page, clubSecret);

// Helper automatically handles:
// - Navigation to auth page with secret
// - Welcome page (first-time users)
// - Skip welcome (returning users with localStorage)
// - Wait for island selection page
```

**Critical: Cookie Name Consistency**

- Backend and middleware must use identical cookie names
- Example bug: `admin-session` vs `admin_session` broke all authentication
- Test both setting and checking cookies in E2E tests

### 11.7 Assertion Patterns

**Accept Multiple Valid Outcomes**

```typescript
// System can enforce rules in multiple ways
expect(secondResult.success).toBe(false);
expect(secondResult.error).toMatch(/Daily limit|No boats found/);

// "Daily limit" = error when clicking boat with reservation
// "No boats found" = boat filtered from search results proactively
```

**Wait for Expected Errors**

```typescript
// DON'T: Check immediately
await errorMsg.isVisible(); // Might not be rendered yet

// DO: Use explicit wait
await expect(errorMsg).toBeVisible({ timeout: 5000 });
```

### 11.8 What NOT to Do

❌ **Don't use hardcoded timeouts for waiting**

```typescript
await page.waitForTimeout(2000); // Fragile and slow
```

❌ **Don't use text-matching selectors for interactive elements**

```typescript
page.getByRole('button', { name: /view all reservations/i });
```

❌ **Don't skip explicit waits because "it worked locally"**

```typescript
await islandLink.click(); // Might not be visible yet
```

❌ **Don't reuse generic search terms across tests**

```typescript
await createReservationWithBoat(page, 'Test'); // Too generic
```

❌ **Don't assume network idle means content loaded**

```typescript
await page.waitForLoadState('networkidle');
// Header exists but island name not loaded yet
await expect(page.locator('header')).toContainText(islandName); // Fails
```

### 11.9 Test Organization

**Helper Functions**

- Create reusable helpers for common flows (auth, navigation, data setup)
- Store in `/e2e/helpers/` directory
- Document parameters and expected behavior
- Handle edge cases gracefully (skip if preconditions not met)

**Test Fixtures**

- Use specific, well-named test data
- Clean up between tests when needed
- Document test data dependencies
- Avoid test interdependencies

**Error Messages**

- Provide clear, actionable error messages
- Include context about what was expected vs. received
- Make debugging failures faster

### 11.10 CI/CD Considerations

**Consistent Test Environment**

- Reset test database before test suites
- Use fixed test data (specific boat names, islands, etc.)
- Handle both fresh and partially-populated databases
- Tests should be idempotent where possible

**Parallel Execution**

- Scope selectors properly to avoid conflicts
- Use unique test data per test where needed
- Don't rely on execution order

**Debugging Failed Tests**

- Screenshots automatically captured on failure
- Error context includes page state
- Logs show actual vs expected values
- HTML report for detailed investigation

### 11.11 Lessons Learned

From fixing 150+ E2E tests to achieve 100% pass rate:

1. **Timing is everything** - Most "flaky" tests are actually timing bugs
2. **Explicit is better than implicit** - Wait for exactly what you need
3. **Test the UI, not the implementation** - Use data-testid for stability
4. **Handle real-world conditions** - Tests should handle edge cases gracefully
5. **Fail fast with clear messages** - Make debugging easier for future you
6. **Consistency matters** - Small details like cookie names break everything
7. **Content loads asynchronously** - DOM elements appear before their content
8. **One source of truth** - Use helpers to centralize complex logic
9. **Skip > Fail** - Gracefully skip when preconditions aren't met
10. **Document patterns** - Future tests should follow established patterns

# Full Stack Implementation Request: Sauna Reservation System

## Overview

I need you to implement a complete, production-ready Sauna Reservation System based on the detailed software specification provided below. This is a complex, multi-component system that requires careful planning, implementation, and testing.

## Your Mission

You are tasked with building this entire system from scratch. You should work methodically, think deeply about architecture decisions, and produce high-quality, maintainable code. Take as much time and thinking as you need - this is a substantial project.

## How to Approach This

### Phase 1: Understanding & Planning (CRITICAL - Start Here)

1. **Read the entire specification carefully** - It's detailed and comprehensive
2. **Create an implementation roadmap** breaking down the work into logical phases
3. **Identify dependencies** between components
4. **Make key architectural decisions**:
   - Database schema design
   - API structure (REST vs tRPC)
   - State management approach
   - Authentication flow
   - Synchronization strategy for Island Devices
5. **Ask clarifying questions** if anything is ambiguous

### Phase 2: Foundation Setup

1. **Initialize the project structure**:
   - Set up the monorepo with proper package organization
   - Configure TypeScript, ESLint, Prettier
   - Set up the database with Prisma/Drizzle
   - Create the base Next.js application
2. **Create comprehensive README.md** with:
   - Project architecture overview
   - Setup instructions
   - Database schema documentation
   - API endpoints
   - Development workflow
   - Testing strategy
   - Deployment guide

3. **Set up CI/CD pipeline**:
   - GitHub Actions workflows
   - Automated testing
   - Vercel deployment configuration
   - Environment variable management

### Phase 3: Core Implementation

Work through the system in a logical order, such as:

1. **Database Layer**:
   - Design complete schema (Clubs, Islands, Saunas, Boats, Reservations, Shared Reservations, etc.)
   - Create migrations
   - Seed data for testing

2. **Backend API**:
   - Authentication endpoints
   - CRUD operations for all entities
   - Reservation logic (availability, validation, booking)
   - Shared reservation logic
   - Synchronization endpoints for Island Devices
   - Reporting endpoints

3. **Admin Portal**:
   - Club management (CRUD, theming, logo upload)
   - Island and Sauna configuration
   - Boat management with bulk import
   - Shared reservation creation
   - Reporting interface
   - QR code generation

4. **User-Facing Web App**:
   - Authentication via club secret/QR code
   - Island selection
   - Sauna availability display
   - Individual reservation flow
   - Shared reservation joining
   - Reservation list with cancellation
   - Sync status display
   - Theme application per club

5. **Theming System**:
   - shadcn/ui component integration
   - Dynamic theme loading based on club
   - CSS custom properties for colors
   - Logo display system
   - Theme editor in admin portal

### Phase 4: Testing

1. **Write unit tests** for business logic
2. **Write integration tests** for API endpoints
3. **Write E2E tests** for critical user flows
4. **Aim for 80%+ code coverage** on critical paths

### Phase 5: Documentation & Deployment

1. **Complete all documentation**
2. **Set up Vercel deployment**
3. **Configure environment variables**
4. **Test deployment process**
5. **Create deployment guide**

## Specification Document

[PASTE THE COMPLETE SPECIFICATION HERE]

## Key Requirements Reminders

### Must-Have Features

- ✅ Individual reservations (next available time only)
- ✅ Shared reservations (advance booking, gender scheduling)
- ✅ **Automatic "Club Sauna" feature with LOCAL scheduled jobs on Island Device**
  - **CRITICAL**: Must work completely offline on Island Device
  - Auto-evaluate at 20:00 (locally) and cancel if < 3 boats
  - Auto-create shared reservations for tomorrow at 20:00 (locally)
  - Auto-convert participants to individual reservations
  - Backend runs same jobs in single daily cron at 20:00 UTC
- ✅ One reservation per boat per island per day (individual OR shared)
- ✅ 15-minute cancellation cutoff
- ✅ Island Device priority (offline-capable, source of truth)
- ✅ User access via web app (with sync status display)
- ✅ Boat search (prioritize name, then membership#)
- ✅ Party size tracking (adults/kids)
- ✅ Club theming (logo + primary/secondary colors)
- ✅ Annual reporting (individual vs shared, separated for invoicing)
- ✅ 24/7 operation
- ✅ Current day view (past + future, scroll to future)
- ✅ Admin portal for all configuration
- ✅ QR code authentication
- ✅ Automated testing, build, and deployment to Vercel

### Technical Stack (Required)

- **Frontend**: Next.js 14+ (App Router), React 18+, TypeScript
- **UI**: shadcn/ui components, Tailwind CSS
- **Database**: PostgreSQL with Prisma or Drizzle ORM
- **Deployment**: Vercel
- **Scheduled Jobs**:
  - **Island Device**: Local scheduler/cron in mobile app (works offline)
  - **Backend**: Single daily Vercel Cron at 20:00 UTC (Club Sauna management + secret renewal)
- **Testing**: Vitest, React Testing Library, Playwright
- **CI/CD**: GitHub Actions

### Code Quality Requirements

- TypeScript strict mode
- ESLint + Prettier configured
- Comprehensive README.md
- Automated tests (unit, integration, E2E)
- Pre-commit hooks (Husky + lint-staged)
- 80%+ code coverage target
- Proper error handling throughout
- Accessible UI (WCAG compliance where possible)

## Working Style Expectations

### Think Step-by-Step

- Break down complex problems into smaller pieces
- Consider edge cases and error scenarios
- Plan before coding

### Use Available Tools

- **Web search**: Research best practices, look up API documentation, find examples
- **Analysis tool**: Test complex logic, validate database queries
- **Artifacts**: Create all code files, configuration files, documentation

### Be Thorough

- Don't skip error handling
- Include loading states and user feedback
- Consider offline scenarios for Island Devices
- Think about data validation at all layers
- Plan for scalability

### Communicate Clearly

- Explain your architectural decisions
- Document complex logic
- Provide clear instructions in README
- Comment non-obvious code

## Deliverables Expected

When you're done, I should have:

1. **Complete codebase** organized in a monorepo structure
2. **Comprehensive README.md** with all setup and deployment instructions
3. **Database schema** with migrations
4. **All API endpoints** implemented and documented
5. **Admin portal** fully functional
6. **User web app** fully functional with theming
7. **Test suite** covering critical functionality
8. **CI/CD pipeline** configured for Vercel
9. **Configuration files**:
   - `package.json` files for all packages
   - `tsconfig.json`
   - `vercel.json`
   - `.env.example`
   - ESLint/Prettier configs
   - GitHub Actions workflows
10. **Documentation**:
    - API documentation
    - Architecture overview
    - Deployment guide
    - Development workflow

## How to Deliver the Code

Since you'll be creating many files, please:

1. **Start with an implementation plan** outlining your approach
2. **Create artifacts** for major files (components, pages, API routes, etc.)
3. **Organize by package/module** so the structure is clear
4. **Provide the README.md first** with complete project structure
5. **Work incrementally** - show progress and ask for feedback
6. **Use multiple artifacts** - don't try to fit everything in one
7. **Prioritize critical path** - get core functionality working first

## Questions Before You Start?

Before diving into implementation:

- Do you understand the full scope of the project?
- Do you have any questions about the specification?
- Do you need clarification on any features or requirements?
- Are there any ambiguities I should resolve?

## Ready to Begin?

Once you're ready, please:

1. Confirm you understand the scope
2. Present your implementation plan/roadmap
3. Start building!

Take your time, think deeply, and build something great. This is a real-world application that needs to be production-ready, maintainable, and well-tested.

---

## Important Notes

- **Use extended thinking time** for complex architectural decisions
- **Search for best practices** when implementing authentication, database design, etc.
- **Test your logic** using the analysis tool for complex calculations
- **Ask questions** if anything is unclear - better to clarify than assume
- **Show your work** - explain key decisions and trade-offs

## Todo List

### Phase 1: Quick Wins ✅ COMPLETED

- ✅ Fix themeColor metadata warnings (moved to viewport export)
- ✅ Fix GitHub Actions artifact upload (.next directory path)
- ✅ Review and fix NPM audit security issues (documented in SECURITY_NOTES.md)
- ✅ Create Island Device E2E test cases (33 tests passing)

### Phase 2: Missing API Implementations ✅ COMPLETED

**Priority:** High (required for Island Device functionality)
**Status:** All implemented and tested

1. ✅ **Island Device Configuration API** (`/api/island-device/configure`)
2. ✅ **Device Synchronization API** (`/api/sync/device`)
3. ✅ **Shared Reservations Delete API** (`/api/shared-reservations/[id]`)
4. ✅ **Pre-commit Hooks for Code Quality**
5. ✅ **Club Secret Automatic Renewal System**
   - Server startup check via instrumentation.ts
   - Daily cron job at 20:00 UTC (combined with Club Sauna operations)
   - Manual renewal script
   - Secrets expire December 31st each year

### Phase 3: Design & UI Polish

**Priority:** Medium
**Estimated Time:** 6-8 hours
**Status:** Deferred (functional UI complete, polish can wait)

- Design improvements across all pages
- Consistent visual design system application
- Improve user experience and accessibility
- Mobile responsiveness review
- **Consistent API Error Handling**: Ensure all pages properly handle API errors and display user-friendly error messages instead of just logging to console or using basic alerts

### Phase 4: Infrastructure Upgrades

**Priority:** Medium-High
**Estimated Time:** 6-8 hours

1. **Prisma Upgrade** (5.22.0 → 6.17.0)
   - Follow upgrade guide: https://pris.ly/d/major-version-upgrade
   - Test all database operations after upgrade
   - Update types and regenerate client

2. **Next.js Upgrade** (14.x → 15.x)
   - Review breaking changes
   - Update dependencies
   - Test all functionality
   - Update configurations

3. **Dependency Security**
   - Upgrade vite to 7.1.9 (breaking change)
   - Upgrade vitest to latest
   - Address esbuild vulnerability (dev-only)

### Phase 5: DevOps & Environments ✅ COMPLETED

**Priority:** High (before production launch)
**Estimated Time:** 4-6 hours
**Status:** Complete - Ready for production deployment

1. **Vercel Environments**
   - Set up production environment
   - Set up development/staging environment
   - Separate databases for prod/dev
   - Environment-specific variables

2. **Monitoring & Analytics**
   - Vercel performance monitoring
   - Error tracking (Sentry or similar)
   - Optional: MixPanel or Posthog for analytics
   - Uptime monitoring

3. **PWA Validation**
   - Test PWA functionality thoroughly
   - Offline capability verification
   - Service worker testing
   - Add to home screen testing
   - iOS Safari compatibility

### Phase 6: Documentation & Optimization

**Priority:** Low-Medium
**Estimated Time:** 8-10 hours

- API documentation (OpenAPI/Swagger)
- Architecture diagrams
- Function lists and dependency graphs
- Code redundancy review and refactoring
- Performance optimization
- Lighthouse score improvements

Good luck! I'm excited to see what you build. 🚀
