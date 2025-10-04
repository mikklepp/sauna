# Design System Documentation

## Overview

This document describes the design system implemented for the Sauna Reservation System. The system features a modern, clean aesthetic with dynamic club branding support across three distinct user experiences.

## Design Baseline

The design system is built on proven patterns from:
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Component architecture
- Inspired by: Vercel, Linear, and Stripe design systems

## Design Principles

1. **Club-First Branding**: Member-facing pages prominently feature club logo and colors
2. **Clear Visual Hierarchy**: Important actions and information are visually prominent
3. **Status Communication**: Color-coded badges for instant status recognition
4. **Responsive Design**: Optimized for desktop, tablet, and mobile devices
5. **Touch-Friendly**: Minimum 44px touch targets for Island Device interface

## Architecture

### Three User Experiences

#### 1. Member-Facing Pages (Club-Branded)
- **Pages**: `/islands`, `/islands/[islandId]`, reservation flows
- **Branding**: Club logo + primary/secondary colors
- **Style**: Vacation-ready, welcoming, gradient backgrounds
- **Components**: ClubHeader, status badges, club-colored buttons

#### 2. Admin Portal (Professional)
- **Pages**: `/admin/*`
- **Branding**: System colors (blue/green)
- **Style**: Professional, data-dense, dashboard-like
- **Components**: Tables, forms, charts

#### 3. Island Device (Touch-First)
- **Pages**: `/island-device/*`
- **Branding**: Minimal, large touch targets
- **Style**: High contrast, 60px+ buttons, simple navigation
- **Components**: Touch-optimized cards and buttons

## Color System

### HSL-Based Tokens

All colors use HSL format for CSS custom properties, enabling easy manipulation:

```css
--club-primary: 221.2 83.2% 53.3%;
--club-secondary: 142 76% 36%;
```

### Color Categories

#### System Colors (Admin/Base)
- `--primary`: System blue (221.2 83.2% 53.3%)
- `--secondary`: Neutral gray (210 40% 96.1%)
- `--muted`: Subtle gray (210 40% 96.1%)
- `--accent`: Highlight gray (210 40% 96.1%)
- `--destructive`: Error red (0 84.2% 60.2%)

#### Status Colors
- `--success`: Green (142 76% 36%) - Available, completed
- `--warning`: Orange (38 92% 50%) - Pending, caution
- `--error`: Red (0 84.2% 60.2%) - Reserved, errors
- `--info`: Blue (199 89% 48%) - Information

#### Club Branding (Dynamic)
- `--club-primary`: Main club color (set via inline styles)
- `--club-primary-foreground`: Contrast text color
- `--club-secondary`: Secondary club color
- `--club-secondary-foreground`: Contrast text color

## Typography

### Font Stack
- **Sans**: 'Inter Variable', system-ui fallbacks
- **Mono**: 'JetBrains Mono', 'Fira Code', monospace

### Heading Scale
- `h1`: 4xl (2.25rem) - Page titles
- `h2`: 3xl (1.875rem) - Section headers
- `h3`: 2xl (1.5rem) - Card titles
- `h4`: xl (1.25rem) - Subsection headers
- `h5`: lg (1.125rem) - Small headers
- `h6`: base (1rem) - Inline headers

## Component Library

### ClubHeader
Reusable branded header component.

**Location**: `src/components/club-header.tsx`

**Props**:
```typescript
interface ClubHeaderProps {
  clubName: string;
  clubLogo?: string | null;
  title?: string;
  showBack?: boolean;
  backHref?: string;
  actions?: React.ReactNode;
  primaryColor?: string;
  secondaryColor?: string;
}
```

**Features**:
- Gradient background using club colors
- Logo display with Next.js Image optimization
- Back button navigation
- Custom action buttons
- Sticky positioning

### Status Badges

Pre-built badge utilities for common status indicators.

**Usage**:
```tsx
<span className="badge-available">Available</span>
<span className="badge-reserved">Reserved</span>
<span className="badge-club-sauna">Club Sauna</span>
<span className="badge-pending">Pending</span>
<span className="badge-info">Info</span>
```

**Styles**:
- Available: Green background, success text
- Reserved: Red background, error text
- Club Sauna: Secondary color background, bold text
- Pending: Orange background, warning text
- Info: Blue background, info text

## Utility Classes

### Club Color Utilities

```css
.bg-club-primary         /* Background: primary club color */
.bg-club-secondary       /* Background: secondary club color */
.text-club-primary       /* Text: primary club color */
.text-club-secondary     /* Text: secondary club color */
.border-club-primary     /* Border: primary club color */
.border-club-secondary   /* Border: secondary club color */
.bg-club-gradient        /* Gradient: primary → secondary */
```

### Touch Target Utilities (Island Device)

```css
.touch-target      /* Min 44px × 44px */
.touch-target-lg   /* Min 60px × 60px */
```

### Animation Utilities

```css
.animate-in        /* Fade in + slide up animation */
.glass             /* Light glassmorphism effect */
.glass-dark        /* Dark glassmorphism effect */
```

### Shadow Utilities

```css
.shadow-card         /* Standard card shadow */
.shadow-card-hover   /* Elevated hover shadow with transform */
```

## Club Theme Utilities

### Location
`src/lib/club-theme.ts`

### Functions

#### `hexToHSL(hex: string): string`
Converts hex color to HSL format for CSS variables.

```typescript
hexToHSL('#3B82F6') // Returns: "221.2 83.2% 53.3%"
```

#### `getContrastColor(hexColor: string): string`
Calculates optimal foreground color (black/white) for contrast.

```typescript
getContrastColor('#3B82F6') // Returns: "210 40% 98%" (white)
getContrastColor('#FFFFFF') // Returns: "222.2 84% 4.9%" (black)
```

#### `applyClubTheme(primaryColor?: string, secondaryColor?: string)`
Applies club theme to document root (client-side only).

```typescript
applyClubTheme('#3B82F6', '#10B981')
```

#### `getClubColorStyles(primaryColor?: string, secondaryColor?: string): React.CSSProperties`
Generates inline React styles for club colors.

```typescript
const styles = getClubColorStyles('#3B82F6', '#10B981');
<div style={styles}>...</div>
```

#### `getClubGradient(primaryColor: string, secondaryColor: string, angle?: number): string`
Creates gradient CSS string.

```typescript
getClubGradient('#3B82F6', '#10B981', 135)
// Returns: "linear-gradient(135deg, #3B82F6 0%, #10B981 100%)"
```

## Implementation Status

### ✅ Completed

1. **Design System Foundation**
   - [x] HSL-based color token system
   - [x] Status color definitions
   - [x] Typography scale and font stack
   - [x] Shadow and spacing utilities

2. **Club Theme System**
   - [x] Color conversion utilities (hex → HSL)
   - [x] Contrast calculation
   - [x] Dynamic theme application
   - [x] Inline style generation

3. **Reusable Components**
   - [x] ClubHeader component
   - [x] Status badge utilities

4. **Member-Facing Pages**
   - [x] Islands selection page (`/islands`)
     - Club-branded header with logo
     - Gradient card headers
     - Hover animations
     - Staggered card animations

   - [x] Sauna display page (`/islands/[islandId]`)
     - ClubHeader integration
     - Status badges (Available/Reserved/Club Sauna)
     - Club-branded "Next Available" section
     - Enhanced Club Sauna section
     - Visual hierarchy improvements

### 🔄 In Progress

5. **Member-Facing Pages (Remaining)**
   - [ ] Reservation flow (`/islands/[islandId]/reserve`)
   - [ ] Reservation list (`/islands/[islandId]/saunas/[saunaId]/reservations`)
   - [ ] Shared sauna page (`/islands/[islandId]/shared/[sharedId]`)

### ⏳ Pending

6. **Admin Portal Redesign**
   - [ ] Dashboard (`/admin`)
   - [ ] Islands management
   - [ ] Saunas management
   - [ ] Boats management
   - [ ] Shared reservations management
   - [ ] Club theme editor
   - [ ] Reports interface

7. **Island Device Interface**
   - [ ] Setup wizard
   - [ ] Main interface with touch targets
   - [ ] Settings page
   - [ ] Offline indicators

8. **Testing & Refinement**
   - [ ] Responsive behavior testing
   - [ ] Touch interaction testing
   - [ ] Color contrast validation (WCAG AA)
   - [ ] Cross-browser compatibility

## Design Patterns

### Page Structure (Member-Facing)

```tsx
export default function MemberPage() {
  const [club, setClub] = useState<ClubData | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {club && (
        <ClubHeader
          clubName={club.name}
          clubLogo={club.logoUrl}
          title="Page Title"
          showBack={true}
          primaryColor={club.primaryColor || undefined}
          secondaryColor={club.secondaryColor || undefined}
        />
      )}

      <main className="container mx-auto px-4 py-8">
        {/* Page content */}
      </main>
    </div>
  );
}
```

### Card with Status Badge

```tsx
<Card className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-xl">
  <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
    <CardTitle className="flex items-center gap-2">
      <Icon className="h-6 w-6 text-club-primary" />
      Card Title
    </CardTitle>
    <CardDescription>
      <span className="badge-available">Available</span>
    </CardDescription>
  </CardHeader>

  <CardContent className="pt-6">
    {/* Card content */}
  </CardContent>
</Card>
```

### Club-Branded Button

```tsx
<Button className="bg-club-primary text-white hover:opacity-90">
  Primary Action
</Button>

<Button
  variant="outline"
  className="border-club-secondary/50 text-club-secondary hover:bg-club-secondary/10"
>
  Secondary Action
</Button>
```

### Gradient Section

```tsx
<div className="rounded-xl border-2 border-club-primary/20 bg-gradient-to-br from-club-primary/5 to-club-primary/10 p-5">
  <div className="flex items-center justify-between">
    <span className="text-sm font-semibold uppercase tracking-wide text-gray-700">
      Section Title
    </span>
    <span className="text-2xl font-bold text-club-primary">
      Highlighted Value
    </span>
  </div>
</div>
```

## File Structure

```
src/
├── app/
│   ├── globals.css              # Design tokens & utilities
│   ├── islands/
│   │   ├── page.tsx            # ✅ Islands selection
│   │   └── [islandId]/
│   │       ├── page.tsx        # ✅ Sauna display
│   │       ├── reserve/        # 🔄 To be updated
│   │       └── saunas/         # 🔄 To be updated
│   ├── admin/                  # ⏳ To be updated
│   └── island-device/          # ⏳ To be updated
├── components/
│   ├── ui/                     # Shadcn/ui components
│   └── club-header.tsx         # ✅ Club header component
└── lib/
    └── club-theme.ts           # ✅ Theme utilities
```

## Color Accessibility

All color combinations are designed to meet WCAG AA standards:
- Contrast ratio ≥ 4.5:1 for normal text
- Contrast ratio ≥ 3:1 for large text
- `getContrastColor()` automatically selects optimal foreground color

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Android)

## Next Steps

1. Complete remaining member-facing pages
2. Apply design system to admin portal
3. Optimize Island Device interface for touch
4. Conduct responsive testing
5. Validate color contrast ratios
6. Gather user feedback and iterate
