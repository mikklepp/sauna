import type {
  Club,
  Island,
  Sauna,
  Boat,
  Reservation,
  SharedReservation,
  SharedReservationParticipant,
  ReservationStatus,
  GenderOrder,
} from '@prisma/client';

// ============================================================================
// Extended Types with Relations
// ============================================================================

export type ClubWithRelations = Club & {
  islands: Island[];
  boats: Boat[];
};

export type IslandWithRelations = Island & {
  club: Club;
  saunas: Sauna[];
};

export type SaunaWithRelations = Sauna & {
  island: IslandWithRelations;
  reservations?: Reservation[];
  sharedReservations?: SharedReservation[];
};

export type ReservationWithRelations = Reservation & {
  sauna: Sauna;
  boat: Boat;
};

export type SharedReservationWithParticipants = SharedReservation & {
  sauna: Sauna;
  participants: (SharedReservationParticipant & {
    boat: Boat;
  })[];
};

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateReservationDTO {
  saunaId: string;
  boatId: string;
  startTime: Date;
  adults: number;
  kids: number;
}

export interface CreateSharedReservationDTO {
  saunaId: string;
  date: Date;
  startTime: Date;
  malesDurationHours: number;
  femalesDurationHours: number;
  genderOrder: GenderOrder;
  name?: string;
  description?: string;
}

export interface JoinSharedReservationDTO {
  sharedReservationId: string;
  boatId: string;
  adults: number;
  kids: number;
}

export interface CreateBoatDTO {
  clubId: string;
  name: string;
  membershipNumber: string;
  captainName?: string;
  phoneNumber?: string;
}

export interface UpdateClubThemeDTO {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

// ============================================================================
// Availability Types
// ============================================================================

export interface NextAvailableSlot {
  saunaId: string;
  saunaName: string;
  startTime: Date;
  endTime: Date;
  reason: 'heating' | 'buffer' | 'next_free';
}

export interface SaunaAvailability {
  sauna: Sauna;
  isCurrentlyReserved: boolean;
  currentReservation?: ReservationWithRelations;
  nextAvailable: NextAvailableSlot;
  sharedReservationToday?: SharedReservationWithParticipants;
}

// ============================================================================
// Sync Types (for Island Device)
// ============================================================================

export type SyncEntityType =
  | 'reservation'
  | 'shared_reservation'
  | 'shared_participant'
  | 'boat'
  | 'sauna';

export type SyncOperation = 'create' | 'update' | 'delete';

export interface SyncChange {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  data: Record<string, unknown>;
  timestamp: Date;
}

export interface SyncRequest {
  islandId: string;
  changes: SyncChange[];
  lastSyncTimestamp?: Date;
}

export interface SyncResponse {
  success: boolean;
  appliedChanges: string[];
  rejectedChanges: {
    id: string;
    reason: string;
  }[];
  serverChanges: SyncChange[];
  newSyncTimestamp: Date;
}

export interface SyncStatus {
  islandId: string;
  lastSyncAt: Date | null;
  pendingChanges: number;
  status: 'synced' | 'pending' | 'failed';
  errorMessage?: string;
}

// ============================================================================
// Report Types
// ============================================================================

export interface SaunaAnnualReport {
  saunaId: string;
  saunaName: string;
  year: number;

  // Individual reservations (for invoicing)
  totalHoursReserved: number;
  totalIndividualReservations: number;

  // Party size
  individualAdults: number;
  individualKids: number;
  sharedAdults: number;
  sharedKids: number;
  totalAdults: number;
  totalKids: number;

  // Unique boats
  uniqueBoatsTotal: number;
  uniqueBoatsIndividual: number;
  uniqueBoatsShared: number;
  uniqueBoatsBoth: number;

  // Monthly breakdown (optional)
  monthlyData?: MonthlyReportData[];
}

export interface MonthlyReportData {
  month: number; // 1-12
  year: number;
  hours: number;
  adults: number;
  kids: number;
  reservations: number;
}

export interface BoatAnnualReport {
  boatId: string;
  boatName: string;
  membershipNumber: string;
  year: number;

  // Individual reservations (for invoicing)
  totalIndividualReservations: number;
  totalHoursReserved: number;

  // Shared participation (separate, not for invoicing)
  totalSharedParticipations: number;
  sharedAdults: number;
  sharedKids: number;

  // Per island breakdown
  perIslandData: {
    islandId: string;
    islandName: string;
    individualReservations: number;
    sharedParticipations: number;
  }[];
}

export interface ClubAnnualReport {
  clubId: string;
  clubName: string;
  year: number;

  totalSaunas: number;
  totalBoats: number;
  totalReservations: number;
  totalSharedReservations: number;

  saunaReports: SaunaAnnualReport[];
}

// ============================================================================
// Search Types
// ============================================================================

export interface BoatSearchResult {
  id: string;
  name: string;
  membershipNumber: string;
  captainName: string | null;
  phoneNumber: string | null;
  matchType: 'name' | 'membership';
  matchScore: number;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface DailyLimitCheck {
  canReserve: boolean;
  hasIndividualReservation: boolean;
  hasSharedParticipation: boolean;
  existingReservation?: {
    type: 'individual' | 'shared';
    id: string;
    startTime: Date;
  };
}

export interface CancellationCheck {
  canCancel: boolean;
  reason?: 'too_late' | 'already_started' | 'already_cancelled';
  minutesUntilStart?: number;
}

// ============================================================================
// Club Sauna Automation Types
// ============================================================================

export interface ClubSaunaEligibility {
  saunaId: string;
  isEligible: boolean;
  date: Date;
  reason: 'high_season' | 'shoulder_season' | 'not_eligible';
}

export interface ClubSaunaEvaluation {
  sharedReservationId: string;
  participantCount: number;
  shouldCancel: boolean;
  conversions: {
    boatId: string;
    startTime: Date;
    endTime: Date;
  }[];
}

// ============================================================================
// Theme Types
// ============================================================================

export interface ClubTheme {
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

export interface ThemeConfig {
  '--primary': string;
  '--primary-foreground': string;
  '--secondary': string;
  '--secondary-foreground': string;
}

// ============================================================================
// IndexedDB Types (Island Device Local Storage)
// ============================================================================

export interface LocalClub {
  id: string;
  name: string;
  secret: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  timezone: string;
}

export interface LocalIsland {
  id: string;
  clubId: string;
  name: string;
  numberOfSaunas: number;
}

export interface LocalSauna {
  id: string;
  islandId: string;
  name: string;
  heatingTimeHours: number;
  autoClubSaunaEnabled: boolean;
}

export interface LocalBoat {
  id: string;
  clubId: string;
  name: string;
  membershipNumber: string;
  captainName: string | null;
  phoneNumber: string | null;
}

export interface LocalReservation {
  id: string;
  saunaId: string;
  boatId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  adults: number;
  kids: number;
  status: ReservationStatus;
  createdAt: string; // ISO string
  cancelledAt: string | null; // ISO string
  syncStatus: 'synced' | 'pending' | 'failed';
}

export interface LocalSharedReservation {
  id: string;
  saunaId: string;
  date: string; // ISO date string
  startTime: string; // ISO time string
  malesDurationHours: number;
  femalesDurationHours: number;
  genderOrder: GenderOrder;
  name: string | null;
  description: string | null;
  isAutoGenerated: boolean;
  autoCancelledAt: string | null; // ISO string
  convertedToIndividual: boolean;
  syncStatus: 'synced' | 'pending' | 'failed';
}

export interface LocalSharedParticipant {
  id: string;
  sharedReservationId: string;
  boatId: string;
  adults: number;
  kids: number;
  joinedAt: string; // ISO string
  syncStatus: 'synced' | 'pending' | 'failed';
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// Re-export Prisma types
// ============================================================================

export type {
  Club,
  Island,
  Sauna,
  Boat,
  Reservation,
  SharedReservation,
  SharedReservationParticipant,
  ReservationStatus,
  GenderOrder,
};
