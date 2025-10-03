import { z } from 'zod';
import { GenderOrder } from '@prisma/client';

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const createReservationSchema = z.object({
  saunaId: z.string().uuid(),
  boatId: z.string().uuid(),
  startTime: z.coerce.date(),
  adults: z.number().int().min(1).max(15),
  kids: z.number().int().min(0).max(15).default(0),
});

export const createSharedReservationSchema = z.object({
  saunaId: z.string().uuid(),
  date: z.coerce.date(),
  startTime: z.coerce.date(),
  malesDurationHours: z.number().int().min(1).max(4),
  femalesDurationHours: z.number().int().min(1).max(4),
  genderOrder: z.nativeEnum(GenderOrder),
  name: z.string().optional(),
  description: z.string().optional(),
});

export const joinSharedReservationSchema = z.object({
  sharedReservationId: z.string().uuid(),
  boatId: z.string().uuid(),
  adults: z.number().int().min(1).max(15),
  kids: z.number().int().min(0).max(15).default(0),
});

export const createBoatSchema = z.object({
  clubId: z.string().uuid(),
  name: z.string().min(1).max(100),
  membershipNumber: z.string().min(1).max(50),
  captainName: z.string().max(100).optional(),
  phoneNumber: z.string().max(20).optional(),
});

export const updateClubThemeSchema = z.object({
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const createClubSchema = z.object({
  name: z.string().min(1).max(100),
  timezone: z.string().default('Europe/Helsinki'),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const createIslandSchema = z.object({
  clubId: z.string().uuid(),
  name: z.string().min(1).max(100),
  numberOfSaunas: z.number().int().min(1).max(3),
});

export const createSaunaSchema = z.object({
  islandId: z.string().uuid(),
  name: z.string().min(1).max(100),
  heatingTimeHours: z.number().int().min(1).max(5).default(2),
  autoClubSaunaEnabled: z.boolean().default(false),
});

export const boatSearchSchema = z.object({
  query: z.string().min(1),
  clubId: z.string().uuid(),
});

export const validateClubSecretSchema = z.object({
  secret: z.string().min(1),
});

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate party size
 */
export function validatePartySize(adults: number, kids: number): {
  valid: boolean;
  error?: string;
} {
  if (adults < 1) {
    return {
      valid: false,
      error: 'At least 1 adult is required',
    };
  }
  
  if (adults > 15) {
    return {
      valid: false,
      error: 'Maximum 15 adults allowed',
    };
  }
  
  if (kids < 0) {
    return {
      valid: false,
      error: 'Kids count cannot be negative',
    };
  }
  
  if (kids > 15) {
    return {
      valid: false,
      error: 'Maximum 15 kids allowed',
    };
  }
  
  const total = adults + kids;
  if (total > 20) {
    return {
      valid: false,
      error: 'Total party size cannot exceed 20 people',
    };
  }
  
  return { valid: true };
}

/**
 * Validate membership number format
 */
export function validateMembershipNumber(number: string): {
  valid: boolean;
  error?: string;
} {
  if (!number || number.trim().length === 0) {
    return {
      valid: false,
      error: 'Membership number is required',
    };
  }
  
  if (number.length > 50) {
    return {
      valid: false,
      error: 'Membership number is too long',
    };
  }
  
  return { valid: true };
}

/**
 * Validate phone number format (optional, basic validation)
 */
export function validatePhoneNumber(phone: string | null | undefined): {
  valid: boolean;
  error?: string;
} {
  if (!phone || phone.trim().length === 0) {
    return { valid: true }; // Phone is optional
  }
  
  // Basic phone validation: allow +, digits, spaces, hyphens, parentheses
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  
  if (!phoneRegex.test(phone)) {
    return {
      valid: false,
      error: 'Phone number contains invalid characters',
    };
  }
  
  if (phone.length > 20) {
    return {
      valid: false,
      error: 'Phone number is too long',
    };
  }
  
  return { valid: true };
}

/**
 * Validate hex color code
 */
export function validateHexColor(color: string | null | undefined): {
  valid: boolean;
  error?: string;
} {
  if (!color || color.trim().length === 0) {
    return { valid: true }; // Color is optional
  }
  
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  
  if (!hexRegex.test(color)) {
    return {
      valid: false,
      error: 'Color must be in hex format (e.g., #FF5733)',
    };
  }
  
  return { valid: true };
}

/**
 * Validate timezone string
 */
export function validateTimezone(timezone: string): {
  valid: boolean;
  error?: string;
} {
  try {
    // Try to create a date formatter with the timezone
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid timezone format',
    };
  }
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

/**
 * Validate CSV import data
 */
export interface CSVBoatRow {
  name: string;
  membershipNumber: string;
  captainName?: string;
  phoneNumber?: string;
}

export function validateCSVBoatRow(row: any, rowNumber: number): {
  valid: boolean;
  error?: string;
  data?: CSVBoatRow;
} {
  if (!row.name || typeof row.name !== 'string') {
    return {
      valid: false,
      error: `Row ${rowNumber}: Boat name is required`,
    };
  }
  
  if (!row.membershipNumber || typeof row.membershipNumber !== 'string') {
    return {
      valid: false,
      error: `Row ${rowNumber}: Membership number is required`,
    };
  }
  
  const membershipValidation = validateMembershipNumber(row.membershipNumber);
  if (!membershipValidation.valid) {
    return {
      valid: false,
      error: `Row ${rowNumber}: ${membershipValidation.error}`,
    };
  }
  
  if (row.phoneNumber) {
    const phoneValidation = validatePhoneNumber(row.phoneNumber);
    if (!phoneValidation.valid) {
      return {
        valid: false,
        error: `Row ${rowNumber}: ${phoneValidation.error}`,
      };
    }
  }
  
  return {
    valid: true,
    data: {
      name: row.name.trim(),
      membershipNumber: row.membershipNumber.trim(),
      captainName: row.captainName?.trim() || undefined,
      phoneNumber: row.phoneNumber?.trim() || undefined,
    },
  };
}