import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { GenderOrder } from '@prisma/client';

// Extend Zod with OpenAPI metadata
extendZodWithOpenApi(z);

// ============================================================================
// Extended Zod Schemas with OpenAPI Metadata
// ============================================================================

/**
 * Reservation Schemas
 */
export const createReservationSchema = z
  .object({
    saunaId: z.string().uuid().openapi({
      description: 'ID of the sauna to reserve',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    boatId: z.string().uuid().openapi({
      description: 'ID of the boat making the reservation',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    startTime: z.coerce.date().openapi({
      description: 'Start time of the reservation (must be on the hour)',
      example: '2025-10-11T14:00:00Z',
    }),
    adults: z.number().int().min(1).max(15).openapi({
      description: 'Number of adults (1-15)',
      example: 2,
    }),
    kids: z.number().int().min(0).max(15).default(0).openapi({
      description: 'Number of kids (0-15, default: 0)',
      example: 0,
    }),
  })
  .openapi('CreateReservationRequest');

export const reservationResponseSchema = z
  .object({
    id: z.string().uuid(),
    saunaId: z.string().uuid(),
    boatId: z.string().uuid(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    adults: z.number().int(),
    kids: z.number().int(),
    status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    cancelledAt: z.string().datetime().nullable(),
  })
  .openapi('ReservationResponse');

/**
 * Shared Reservation Schemas
 */
export const createSharedReservationSchema = z
  .object({
    saunaId: z.string().uuid().openapi({
      description: 'ID of the sauna',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    date: z.coerce.date().openapi({
      description: 'Date of the shared reservation',
      example: '2025-10-11',
    }),
    startTime: z.coerce.date().openapi({
      description: 'Start time (must be on the hour)',
      example: '2025-10-11T15:00:00Z',
    }),
    malesDurationHours: z.number().int().min(1).max(4).openapi({
      description: 'Duration for males in hours (1-4)',
      example: 2,
    }),
    femalesDurationHours: z.number().int().min(1).max(4).openapi({
      description: 'Duration for females in hours (1-4)',
      example: 2,
    }),
    genderOrder: z.nativeEnum(GenderOrder).openapi({
      description: 'Gender order (MALES_FIRST or FEMALES_FIRST)',
      example: 'MALES_FIRST',
    }),
    name: z.string().optional().openapi({
      description: 'Optional name for the shared reservation',
      example: 'Club Sauna',
    }),
    description: z.string().optional().openapi({
      description: 'Optional description',
      example: 'Weekly club gathering',
    }),
  })
  .openapi('CreateSharedReservationRequest');

export const joinSharedReservationSchema = z
  .object({
    boatId: z.string().uuid().openapi({
      description: 'ID of the boat joining',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    adults: z.number().int().min(1).max(15).openapi({
      description: 'Number of adults (1-15)',
      example: 2,
    }),
    kids: z.number().int().min(0).max(15).default(0).openapi({
      description: 'Number of kids (0-15, default: 0)',
      example: 1,
    }),
  })
  .openapi('JoinSharedReservationRequest');

/**
 * Boat Schemas
 */
export const createBoatSchema = z
  .object({
    clubId: z.string().uuid().openapi({
      description: 'ID of the club',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    name: z.string().min(1).max(100).openapi({
      description: 'Boat name (1-100 characters)',
      example: 'Sea Breeze',
    }),
    membershipNumber: z.string().min(1).max(50).openapi({
      description: 'Unique membership number (1-50 characters)',
      example: 'MB001',
    }),
    captainName: z.string().max(100).nullable().optional().openapi({
      description: 'Captain name (optional, max 100 characters)',
      example: 'John Doe',
    }),
    phoneNumber: z.string().max(20).nullable().optional().openapi({
      description: 'Phone number (optional, max 20 characters)',
      example: '+358401234567',
    }),
  })
  .openapi('CreateBoatRequest');

export const boatResponseSchema = z
  .object({
    id: z.string().uuid(),
    clubId: z.string().uuid(),
    name: z.string(),
    membershipNumber: z.string(),
    captainName: z.string().nullable(),
    phoneNumber: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('BoatResponse');

/**
 * Club Schemas
 */
export const createClubSchema = z
  .object({
    name: z.string().min(1).max(100).openapi({
      description: 'Club name (1-100 characters)',
      example: 'My Sailing Club',
    }),
    timezone: z.string().default('Europe/Helsinki').openapi({
      description: 'IANA timezone string',
      example: 'Europe/Helsinki',
    }),
    logoUrl: z.string().url().optional().openapi({
      description: 'Optional logo URL',
      example: 'https://example.com/logo.png',
    }),
    primaryColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional()
      .openapi({
        description: 'Primary color in hex format',
        example: '#FF5733',
      }),
    secondaryColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional()
      .openapi({
        description: 'Secondary color in hex format',
        example: '#33C3FF',
      }),
  })
  .openapi('CreateClubRequest');

export const updateClubThemeSchema = z
  .object({
    logoUrl: z.string().url().optional().openapi({
      description: 'Logo URL',
      example: 'https://example.com/logo.png',
    }),
    primaryColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional()
      .openapi({
        description: 'Primary color in hex format (#RRGGBB)',
        example: '#FF5733',
      }),
    secondaryColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional()
      .openapi({
        description: 'Secondary color in hex format (#RRGGBB)',
        example: '#33C3FF',
      }),
  })
  .openapi('UpdateClubThemeRequest');

export const clubResponseSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    secret: z.string(),
    secretValidFrom: z.string().datetime(),
    secretValidUntil: z.string().datetime(),
    logoUrl: z.string().nullable(),
    primaryColor: z.string().nullable(),
    secondaryColor: z.string().nullable(),
    timezone: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('ClubResponse');

/**
 * Island Schemas
 */
export const createIslandSchema = z
  .object({
    clubId: z.string().uuid().openapi({
      description: 'ID of the club',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    name: z.string().min(1).max(100).openapi({
      description: 'Island name (1-100 characters)',
      example: 'North Island',
    }),
    numberOfSaunas: z.number().int().min(1).max(3).openapi({
      description: 'Number of saunas on the island (1-3)',
      example: 2,
    }),
  })
  .openapi('CreateIslandRequest');

export const islandResponseSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    clubId: z.string().uuid(),
    numberOfSaunas: z.number().int(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('IslandResponse');

/**
 * Sauna Schemas
 */
export const createSaunaSchema = z
  .object({
    islandId: z.string().uuid().openapi({
      description: 'ID of the island',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    name: z.string().min(1).max(100).openapi({
      description: 'Sauna name (1-100 characters)',
      example: 'Main Sauna',
    }),
    heatingTimeHours: z.number().int().min(1).max(5).default(2).openapi({
      description: 'Heating time in hours (1-5, default: 2)',
      example: 2.5,
    }),
    autoClubSaunaEnabled: z.boolean().default(false).openapi({
      description: 'Enable automatic Club Sauna generation',
      example: false,
    }),
  })
  .openapi('CreateSaunaRequest');

export const saunaResponseSchema = z
  .object({
    id: z.string().uuid(),
    islandId: z.string().uuid(),
    name: z.string(),
    heatingTimeHours: z.number(),
    autoClubSaunaEnabled: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('SaunaResponse');

/**
 * Authentication Schemas
 */
export const validateClubSecretSchema = z
  .object({
    secret: z.string().min(1).openapi({
      description: 'Club secret for authentication',
      example: 'ABC123XYZ',
    }),
  })
  .openapi('ValidateClubSecretRequest');

export const adminLoginSchema = z
  .object({
    username: z.string().min(3).openapi({
      description: 'Admin username (min 3 characters)',
      example: 'admin',
    }),
    password: z.string().min(8).openapi({
      description: 'Admin password (min 8 characters)',
      example: 'password123',
    }),
  })
  .openapi('AdminLoginRequest');

export const adminRegisterSchema = z
  .object({
    username: z.string().min(3).openapi({
      description: 'Admin username (min 3 characters)',
      example: 'admin',
    }),
    password: z.string().min(8).openapi({
      description: 'Admin password (min 8 characters)',
      example: 'password123',
    }),
    name: z.string().optional().openapi({
      description: 'Full name (optional)',
      example: 'John Doe',
    }),
    email: z.string().email().optional().openapi({
      description: 'Email address (optional)',
      example: 'admin@example.com',
    }),
  })
  .openapi('AdminRegisterRequest');

/**
 * Generic Response Schemas
 */
export const successResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.any(),
  })
  .openapi('SuccessResponse');

export const errorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z.string(),
  })
  .openapi('ErrorResponse');

/**
 * Search Schemas
 */
export const boatSearchSchema = z
  .object({
    query: z.string().min(1).openapi({
      description: 'Search query (boat name or membership number)',
      example: 'Sea',
    }),
  })
  .openapi('BoatSearchRequest');
