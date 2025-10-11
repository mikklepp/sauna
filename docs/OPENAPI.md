# OpenAPI Specification

**Auto-Generated from TypeScript Types & Zod Schemas**

## Overview

The Sauna Reservation System provides a complete OpenAPI 3.1 specification that is automatically generated from:

- **TypeScript types** - Type definitions
- **Zod schemas** - Validation schemas with OpenAPI metadata
- **Prisma schema** - Database models (indirectly via TypeScript types)

This ensures the API documentation is always in sync with the actual implementation.

---

## Accessing the OpenAPI Spec

### JSON Specification

```
GET http://localhost:3000/api/openapi
```

**Production:**

```
GET https://your-app.vercel.app/api/openapi
```

**Response:** OpenAPI 3.1 JSON document

**Usage:**

- Import into Postman, Insomnia, or other API clients
- Generate client SDKs using OpenAPI Generator
- Validate API contracts
- Generate mock servers

---

## Interactive API Documentation (Swagger UI)

### Development

Visit: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### Production

Visit: [https://your-app.vercel.app/api-docs](https://your-app.vercel.app/api-docs)

**Features:**

- Interactive API explorer
- Try out API calls directly in the browser
- View request/response schemas
- Authentication flows
- Example payloads

---

## Key Features

### ✅ Automatically Synced

The OpenAPI spec is generated from the same sources as the actual API:

1. **Zod Validation Schemas** (`src/lib/openapi.ts`)
   - All request/response validation
   - OpenAPI metadata embedded
   - Type-safe validation

2. **API Routes** (`src/app/api/**/*.ts`)
   - Route handlers reference Zod schemas
   - Ensures validation matches documentation

3. **TypeScript Types**
   - Compile-time type checking
   - Prevents schema drift

### ✅ No Manual Maintenance

- Update validation schema → OpenAPI spec updates automatically
- Add new endpoint → Register in `openapi-registry.ts`
- Change types → Reflected immediately

### ✅ Rich Metadata

- Detailed descriptions
- Example values
- Parameter constraints
- Authentication requirements
- Response codes
- Error schemas

---

## Architecture

### File Structure

```
src/
├── lib/
│   ├── openapi.ts              # Zod schemas with OpenAPI metadata
│   ├── openapi-registry.ts     # OpenAPI route definitions
│   └── validation.ts           # Base Zod schemas (extended by openapi.ts)
├── app/
│   ├── api/
│   │   ├── openapi/
│   │   │   └── route.ts        # OpenAPI JSON endpoint
│   │   └── [other routes]/     # API endpoints
│   └── api-docs/
│       └── page.tsx            # Swagger UI page
```

### Data Flow

```
┌─────────────────────┐
│  Prisma Schema      │  ──┐
│  (database models)  │    │
└─────────────────────┘    │
                           ├──> TypeScript Types
┌─────────────────────┐    │
│  TypeScript Types   │  ──┘
│  (interfaces/types) │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Zod Schemas        │  ◄── Base validation
│  (validation.ts)    │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  OpenAPI Schemas    │  ◄── Extended with metadata
│  (openapi.ts)       │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  OpenAPI Registry   │  ◄── Route definitions
│  (openapi-registry) │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  OpenAPI Spec       │  ◄── Generated document
│  (GET /api/openapi) │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Swagger UI         │  ◄── Interactive docs
│  (/api-docs)        │
└─────────────────────┘
```

---

## Adding a New Endpoint

### Step 1: Create/Update Zod Schema with OpenAPI Metadata

**File:** `src/lib/openapi.ts`

```typescript
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const createExampleSchema = z
  .object({
    name: z.string().min(1).max(100).openapi({
      description: 'Example name',
      example: 'My Example',
    }),
    value: z.number().int().min(0).openapi({
      description: 'Example value (non-negative integer)',
      example: 42,
    }),
  })
  .openapi('CreateExampleRequest');

export const exampleResponseSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    value: z.number(),
    createdAt: z.string().datetime(),
  })
  .openapi('ExampleResponse');
```

### Step 2: Register Schema in OpenAPI Registry

**File:** `src/lib/openapi-registry.ts`

```typescript
import { createExampleSchema, exampleResponseSchema } from './openapi';

// Register as component
registry.register('ExampleResponse', exampleResponseSchema);

// Register path
registry.registerPath({
  method: 'post',
  path: '/api/examples',
  tags: ['Examples'],
  summary: 'Create example',
  description: 'Create a new example',
  security: [{ adminSession: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createExampleSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Example created',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { $ref: '#/components/schemas/ExampleResponse' },
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
```

### Step 3: Use Schema in API Route

**File:** `src/app/api/examples/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import {
  parseRequestBody,
  successResponse,
  handleApiError,
} from '@/lib/api-utils';
import { createExampleSchema } from '@/lib/validation';
import prisma from '@/lib/db';

/**
 * POST /api/examples
 * Create a new example (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();
    const body = await parseRequestBody(request);

    // Validate input - Zod schema ensures type safety
    const validated = createExampleSchema.parse(body);

    // Create example
    const example = await prisma.example.create({
      data: validated,
    });

    return successResponse(example, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Step 4: Test

1. **Check TypeScript:** `npx tsc --noEmit`
2. **View OpenAPI Spec:** Visit `/api/openapi`
3. **Try in Swagger UI:** Visit `/api-docs`
4. **Test endpoint:** Use Swagger UI or API client

---

## Schema Guidelines

### ✅ DO

```typescript
// ✓ Add descriptions
.openapi({
  description: 'User email address',
  example: 'user@example.com',
})

// ✓ Provide examples
.openapi({
  example: 42,
})

// ✓ Name complex schemas
.openapi('UserCreateRequest')

// ✓ Use standard formats
z.string().email()
z.string().uuid()
z.string().datetime()
z.string().url()
```

### ❌ DON'T

```typescript
// ✗ Missing descriptions
z.string().min(1)

// ✗ Vague names
.openapi('Request1')

// ✗ No examples for complex objects
z.object({ ... })  // No example

// ✗ Inconsistent naming
.openapi('user_create_req')  // Use PascalCase
```

---

## Authentication in OpenAPI

The spec defines three security schemes:

### 1. Admin Session (Cookie)

```yaml
adminSession:
  type: apiKey
  in: cookie
  name: admin-session
```

**Usage:**

```typescript
security: [{ adminSession: [] }];
```

### 2. Club Session (Cookie)

```yaml
clubSession:
  type: apiKey
  in: cookie
  name: club-session
```

**Usage:**

```typescript
security: [{ clubSession: [] }];
```

### 3. Cron Secret (Bearer Token)

```yaml
cronSecret:
  type: http
  scheme: bearer
```

**Usage:**

```typescript
security: [{ cronSecret: [] }];
```

### Multiple Auth Options

```typescript
// Either admin OR club session
security: [{ adminSession: [] }, { clubSession: [] }];
```

---

## Response Format

All endpoints follow a consistent response format:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Generating Client SDKs

### Using OpenAPI Generator

```bash
# Install
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:3000/api/openapi \
  -g typescript-fetch \
  -o ./generated/api-client

# Generate Python client
openapi-generator-cli generate \
  -i http://localhost:3000/api/openapi \
  -g python \
  -o ./generated/python-client

# Generate Go client
openapi-generator-cli generate \
  -i http://localhost:3000/api/openapi \
  -g go \
  -o ./generated/go-client
```

### Supported Generators

- `typescript-fetch` - TypeScript with Fetch API
- `typescript-axios` - TypeScript with Axios
- `javascript` - Plain JavaScript
- `python` - Python client
- `go` - Go client
- `java` - Java client
- `ruby` - Ruby client
- `php` - PHP client
- `csharp` - C# client
- [+50 more](https://openapi-generator.tech/docs/generators)

---

## Importing into API Clients

### Postman

1. Open Postman
2. **Import** → **Link**
3. Enter: `http://localhost:3000/api/openapi`
4. Click **Continue** → **Import**

**Result:** Complete API collection with all endpoints, authentication, and examples.

### Insomnia

1. Open Insomnia
2. **Application** → **Preferences** → **Data**
3. **Import Data** → **From URL**
4. Enter: `http://localhost:3000/api/openapi`
5. Click **Fetch and Import**

### Swagger Editor

1. Visit [editor.swagger.io](https://editor.swagger.io/)
2. **File** → **Import URL**
3. Enter: `http://localhost:3000/api/openapi`
4. View/edit spec in browser

---

## Testing with OpenAPI Spec

### Contract Testing

```typescript
// tests/api-contract.test.ts
import { generateOpenAPIDocument } from '@/lib/openapi-registry';

describe('OpenAPI Contract', () => {
  it('should generate valid OpenAPI 3.1 spec', () => {
    const spec = generateOpenAPIDocument();

    expect(spec.openapi).toBe('3.1.0');
    expect(spec.info.title).toBe('Sauna Reservation System API');
    expect(spec.paths).toBeDefined();
  });

  it('should include all required endpoints', () => {
    const spec = generateOpenAPIDocument();

    expect(spec.paths['/api/reservations']).toBeDefined();
    expect(spec.paths['/api/boats']).toBeDefined();
    expect(spec.paths['/api/clubs']).toBeDefined();
    // ... more assertions
  });
});
```

### Schema Validation Testing

```typescript
import Ajv from 'ajv';
import { generateOpenAPIDocument } from '@/lib/openapi-registry';

const ajv = new Ajv();
const spec = generateOpenAPIDocument();

it('should validate reservation response against schema', () => {
  const schema = spec.components.schemas.ReservationResponse;
  const validate = ajv.compile(schema);

  const response = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    saunaId: '123e4567-e89b-12d3-a456-426614174001',
    boatId: '123e4567-e89b-12d3-a456-426614174002',
    startTime: '2025-10-11T14:00:00Z',
    endTime: '2025-10-11T15:00:00Z',
    adults: 2,
    kids: 0,
    status: 'ACTIVE',
    createdAt: '2025-10-11T12:00:00Z',
    updatedAt: '2025-10-11T12:00:00Z',
    cancelledAt: null,
  };

  const valid = validate(response);
  expect(valid).toBe(true);
});
```

---

## Versioning

### Current Version

**API Version:** 1.0.0 (defined in `openapi-registry.ts`)

### Version Format

Follows Semantic Versioning (SemVer):

- **Major** (1.x.x): Breaking changes
- **Minor** (x.1.x): New features, backward compatible
- **Patch** (x.x.1): Bug fixes, backward compatible

### Updating Version

**File:** `src/lib/openapi-registry.ts`

```typescript
info: {
  title: 'Sauna Reservation System API',
  version: '1.1.0',  // ← Update here
  // ...
}
```

---

## Troubleshooting

### OpenAPI spec not generating

**Check:**

1. TypeScript compiles: `npx tsc --noEmit`
2. All schemas registered in `openapi-registry.ts`
3. Dev server running: `npm run dev`

### Schema reference not found

**Error:** `$ref '#/components/schemas/Example' not found`

**Solution:** Register schema:

```typescript
registry.register('Example', exampleSchema);
```

### Swagger UI not loading

**Check:**

1. Navigate to `/api-docs` (not `/api/openapi`)
2. Check browser console for errors
3. Clear browser cache
4. Verify `swagger-ui-react` is installed

### TypeScript errors in openapi-registry.ts

**Common causes:**

1. Zod schema not extended with OpenAPI: Missing `extendZodWithOpenApi(z)`
2. Wrong schema format in response
3. Missing imports

---

## Best Practices

### 1. Keep Schemas DRY

```typescript
// ✓ Reuse base schemas
const userBaseSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

export const createUserSchema = userBaseSchema.openapi('CreateUserRequest');
export const updateUserSchema = userBaseSchema
  .partial()
  .openapi('UpdateUserRequest');
```

### 2. Provide Meaningful Examples

```typescript
// ✓ Good example
membershipNumber: z.string().openapi({
  description: 'Unique boat membership number',
  example: 'MB001',
});

// ✗ Bad example
membershipNumber: z.string().openapi({
  example: 'string',
});
```

### 3. Group Related Endpoints with Tags

```typescript
registry.registerPath({
  method: 'post',
  path: '/api/boats',
  tags: ['Boats'], // ← Groups in Swagger UI
  // ...
});
```

### 4. Document Error Responses

```typescript
responses: {
  400: {
    description: 'Validation error - Check request body format',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
  409: {
    description: 'Conflict - Boat with this membership number already exists',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
}
```

---

## References

- **OpenAPI 3.1 Spec:** [spec.openapis.org](https://spec.openapis.org/oas/v3.1.0)
- **Zod to OpenAPI:** [github.com/asteasolutions/zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi)
- **Swagger UI:** [swagger.io/tools/swagger-ui](https://swagger.io/tools/swagger-ui/)
- **OpenAPI Generator:** [openapi-generator.tech](https://openapi-generator.tech/)

---

## Summary

✅ **Auto-generated** from TypeScript/Zod schemas
✅ **Always in sync** with implementation
✅ **Interactive documentation** via Swagger UI
✅ **Client SDK generation** for any language
✅ **Import into API clients** (Postman, Insomnia)
✅ **Contract testing** support
✅ **Type-safe** validation

**Access:**

- **Spec:** `/api/openapi`
- **Docs:** `/api-docs`

---

**Last Updated:** 2025-10-11
**OpenAPI Version:** 3.1.0
**API Version:** 1.0.0
