import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  createReservationSchema,
  reservationResponseSchema,
  createSharedReservationSchema,
  joinSharedReservationSchema,
  createBoatSchema,
  boatResponseSchema,
  createClubSchema,
  clubResponseSchema,
  updateClubThemeSchema,
  createIslandSchema,
  islandResponseSchema,
  createSaunaSchema,
  saunaResponseSchema,
  validateClubSecretSchema,
  adminLoginSchema,
  adminRegisterSchema,
  errorResponseSchema,
} from './openapi';

// Create the registry
const registry = new OpenAPIRegistry();

// Register response schemas as components
registry.register('ReservationResponse', reservationResponseSchema);
registry.register('BoatResponse', boatResponseSchema);
registry.register('ClubResponse', clubResponseSchema);
registry.register('IslandResponse', islandResponseSchema);
registry.register('SaunaResponse', saunaResponseSchema);

// ============================================================================
// Security Schemes
// ============================================================================

registry.registerComponent('securitySchemes', 'adminSession', {
  type: 'apiKey',
  in: 'cookie',
  name: 'admin-session',
  description: 'Admin session cookie',
});

registry.registerComponent('securitySchemes', 'clubSession', {
  type: 'apiKey',
  in: 'cookie',
  name: 'club-session',
  description: 'Club member session cookie',
});

registry.registerComponent('securitySchemes', 'cronSecret', {
  type: 'http',
  scheme: 'bearer',
  description: 'Cron secret for automated jobs',
});

// ============================================================================
// Authentication Endpoints
// ============================================================================

// Admin Login
registry.registerPath({
  method: 'post',
  path: '/api/auth/admin/login',
  tags: ['Authentication'],
  summary: 'Admin login',
  description: 'Authenticate an admin user and create a session',
  request: {
    body: {
      content: {
        'application/json': {
          schema: adminLoginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              username: { type: 'string', example: 'admin' },
            },
          },
        },
      },
    },
    400: {
      description: 'Bad request',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    401: {
      description: 'Invalid credentials',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

// Admin Logout
registry.registerPath({
  method: 'post',
  path: '/api/auth/admin/logout',
  tags: ['Authentication'],
  summary: 'Admin logout',
  description: 'Clear the admin session',
  responses: {
    200: {
      description: 'Logout successful',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Logged out successfully' },
            },
          },
        },
      },
    },
  },
});

// Admin Register
registry.registerPath({
  method: 'post',
  path: '/api/auth/admin/register',
  tags: ['Authentication'],
  summary: 'Register first admin',
  description: 'Register the first admin user (only works if no admins exist)',
  request: {
    body: {
      content: {
        'application/json': {
          schema: adminRegisterSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Registration successful',
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    403: {
      description: 'Admin registration disabled',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

// Validate Club Secret
registry.registerPath({
  method: 'post',
  path: '/api/auth/validate-club-secret',
  tags: ['Authentication'],
  summary: 'Validate club secret',
  description: 'Validate a club secret and create a club session',
  request: {
    body: {
      content: {
        'application/json': {
          schema: validateClubSecretSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Valid club secret',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              valid: { type: 'boolean', example: true },
              clubId: { type: 'string', format: 'uuid' },
              clubName: { type: 'string', example: 'My Club' },
              expiresAt: {
                type: 'string',
                format: 'date-time',
                example: '2025-12-31T23:59:59.999Z',
              },
            },
          },
        },
      },
    },
    401: {
      description: 'Invalid club secret',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

// ============================================================================
// Reservation Endpoints
// ============================================================================

// Create Reservation
registry.registerPath({
  method: 'post',
  path: '/api/reservations',
  tags: ['Reservations'],
  summary: 'Create individual reservation',
  description: 'Create a new 1-hour individual reservation',
  security: [{ clubSession: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createReservationSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Reservation created',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { $ref: '#/components/schemas/ReservationResponse' },
            },
          },
        },
      },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Sauna or boat not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    409: {
      description: 'Time slot not available or boat already has reservation',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

// Get Reservations
registry.registerPath({
  method: 'get',
  path: '/api/reservations',
  tags: ['Reservations'],
  summary: 'Get reservations',
  description: 'Get reservations for a sauna',
  security: [{ clubSession: [] }],
  request: {
    query: z.object({
      saunaId: z.string().uuid().openapi({
        description: 'Sauna ID (required)',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
      date: z.string().optional().openapi({
        description: 'Date to query (ISO 8601, optional, defaults to today)',
        example: '2025-10-11',
      }),
      future: z.boolean().optional().openapi({
        description:
          'If true, get all future reservations from date (default: false)',
        example: false,
      }),
    }),
  },
  responses: {
    200: {
      description: 'List of reservations',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/ReservationResponse' },
              },
            },
          },
        },
      },
    },
    400: {
      description: 'Bad request',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

// Delete Reservation (Cancel)
registry.registerPath({
  method: 'delete',
  path: '/api/reservations/{id}',
  tags: ['Reservations'],
  summary: 'Cancel reservation',
  description: 'Cancel a reservation (must be >15 minutes before start time)',
  security: [{ clubSession: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: 'Reservation ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Reservation cancelled',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { $ref: '#/components/schemas/ReservationResponse' },
            },
          },
        },
      },
    },
    400: {
      description: 'Cannot cancel (too close to start time)',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Reservation not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

// ============================================================================
// Shared Reservation Endpoints
// ============================================================================

// Create Shared Reservation
registry.registerPath({
  method: 'post',
  path: '/api/shared-reservations',
  tags: ['Shared Reservations'],
  summary: 'Create shared reservation',
  description: 'Create a new shared reservation (Club Sauna or custom)',
  security: [{ adminSession: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createSharedReservationSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Shared reservation created',
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

// Join Shared Reservation
registry.registerPath({
  method: 'post',
  path: '/api/shared-reservations/{id}/join',
  tags: ['Shared Reservations'],
  summary: 'Join shared reservation',
  description: 'Join a shared reservation as a participant',
  security: [{ clubSession: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: 'Shared reservation ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
    body: {
      content: {
        'application/json': {
          schema: joinSharedReservationSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Successfully joined',
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Shared reservation not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    409: {
      description: 'Boat already participating or has other reservation',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

// ============================================================================
// Boat Endpoints
// ============================================================================

// Create Boat
registry.registerPath({
  method: 'post',
  path: '/api/boats',
  tags: ['Boats'],
  summary: 'Create boat',
  description: 'Create a new boat',
  security: [{ adminSession: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createBoatSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Boat created',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { $ref: '#/components/schemas/BoatResponse' },
            },
          },
        },
      },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    409: {
      description: 'Boat with this membership number already exists',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

// Get Boats
registry.registerPath({
  method: 'get',
  path: '/api/boats',
  tags: ['Boats'],
  summary: 'Get boats',
  description:
    'Get all boats (admin gets all, club users get their club boats)',
  security: [{ adminSession: [] }, { clubSession: [] }],
  responses: {
    200: {
      description: 'List of boats',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/BoatResponse' },
              },
            },
          },
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

// Search Boats
registry.registerPath({
  method: 'get',
  path: '/api/boats/search',
  tags: ['Boats'],
  summary: 'Search boats',
  description: 'Search boats by name or membership number (fuzzy matching)',
  security: [{ clubSession: [] }],
  request: {
    query: z.object({
      q: z.string().min(1).openapi({
        description: 'Search query (boat name or membership number)',
        example: 'Sea',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Search results (max 20)',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  allOf: [
                    { $ref: '#/components/schemas/BoatResponse' },
                    {
                      type: 'object',
                      properties: {
                        matchType: {
                          type: 'string',
                          enum: ['name', 'membership'],
                        },
                        matchScore: { type: 'number', example: 100 },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    400: {
      description: 'Search query required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

// ============================================================================
// Club Endpoints
// ============================================================================

// Create Club
registry.registerPath({
  method: 'post',
  path: '/api/clubs',
  tags: ['Clubs'],
  summary: 'Create club',
  description: 'Create a new club with auto-generated secret',
  security: [{ adminSession: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createClubSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Club created',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { $ref: '#/components/schemas/ClubResponse' },
            },
          },
        },
      },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

// Get Clubs
registry.registerPath({
  method: 'get',
  path: '/api/clubs',
  tags: ['Clubs'],
  summary: 'Get clubs',
  description: 'Get all clubs',
  security: [{ adminSession: [] }],
  responses: {
    200: {
      description: 'List of clubs',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/ClubResponse' },
              },
            },
          },
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

// Update Club Theme
registry.registerPath({
  method: 'post',
  path: '/api/clubs/{id}/theme',
  tags: ['Clubs'],
  summary: 'Update club theme',
  description: 'Update club logo and colors',
  security: [{ adminSession: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: 'Club ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
    body: {
      content: {
        'application/json': {
          schema: updateClubThemeSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Theme updated',
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Club not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

// ============================================================================
// Island Endpoints
// ============================================================================

// Create Island
registry.registerPath({
  method: 'post',
  path: '/api/islands',
  tags: ['Islands'],
  summary: 'Create island',
  description: 'Create a new island',
  security: [{ adminSession: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createIslandSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Island created',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { $ref: '#/components/schemas/IslandResponse' },
            },
          },
        },
      },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

// Get Islands
registry.registerPath({
  method: 'get',
  path: '/api/islands',
  tags: ['Islands'],
  summary: 'Get islands',
  description:
    'Get all islands (admin gets all, club users get their club islands)',
  security: [{ adminSession: [] }, { clubSession: [] }],
  responses: {
    200: {
      description: 'List of islands',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/IslandResponse' },
              },
            },
          },
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

// ============================================================================
// Sauna Endpoints
// ============================================================================

// Create Sauna
registry.registerPath({
  method: 'post',
  path: '/api/saunas',
  tags: ['Saunas'],
  summary: 'Create sauna',
  description: 'Create a new sauna',
  security: [{ adminSession: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createSaunaSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Sauna created',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { $ref: '#/components/schemas/SaunaResponse' },
            },
          },
        },
      },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

// Get Saunas
registry.registerPath({
  method: 'get',
  path: '/api/saunas',
  tags: ['Saunas'],
  summary: 'Get saunas',
  description:
    'Get all saunas (admin gets all, club users get their club saunas)',
  security: [{ adminSession: [] }, { clubSession: [] }],
  request: {
    query: z.object({
      islandId: z.string().uuid().optional().openapi({
        description: 'Filter by island ID (optional)',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
  },
  responses: {
    200: {
      description: 'List of saunas',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/SaunaResponse' },
              },
            },
          },
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

// Get Next Available
registry.registerPath({
  method: 'get',
  path: '/api/saunas/{id}/next-available',
  tags: ['Saunas'],
  summary: 'Get next available time slot',
  description:
    'Get the next available time slot for a sauna, including current status and shared reservations',
  security: [{ clubSession: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: 'Sauna ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Next available time slot',
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Sauna not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

// ============================================================================
// Generate OpenAPI Document
// ============================================================================

export function generateOpenAPIDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Sauna Reservation System API',
      version: '1.0.0',
      description:
        'Comprehensive API for managing sauna reservations across island communities. Supports individual reservations, shared reservations (Club Sauna), offline-capable island devices, and automated workflows.',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'https://your-app.vercel.app',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Admin and club member authentication endpoints',
      },
      {
        name: 'Reservations',
        description: 'Individual reservation management (1-hour slots)',
      },
      {
        name: 'Shared Reservations',
        description: 'Multi-participant Club Sauna reservations',
      },
      {
        name: 'Boats',
        description: 'Boat management and search',
      },
      {
        name: 'Clubs',
        description: 'Club management and theming',
      },
      {
        name: 'Islands',
        description: 'Island management',
      },
      {
        name: 'Saunas',
        description: 'Sauna management and availability',
      },
    ],
    externalDocs: {
      description: 'Full API Documentation',
      url: 'https://github.com/your-repo/docs/API.md',
    },
  });
}
