# API Documentation

**Sauna Reservation System**
**Version:** 1.0.0
**Last Updated:** 2025-10-11

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication-endpoints)
  - [Clubs](#clubs)
  - [Islands](#islands)
  - [Saunas](#saunas)
  - [Boats](#boats)
  - [Reservations](#reservations)
  - [Shared Reservations](#shared-reservations)
  - [Reports](#reports)
  - [Synchronization](#synchronization)
  - [Cron Jobs](#cron-jobs)
- [Data Models](#data-models)
- [Validation Rules](#validation-rules)

---

## Overview

The Sauna Reservation System provides a RESTful API for managing sauna reservations across multiple islands and clubs. The API supports:

- **Individual Reservations**: 1-hour time slots for single boats
- **Shared Reservations**: Multi-participant "Club Sauna" events
- **Island Device Sync**: Offline-capable device synchronization
- **Club Theming**: Custom branding and colors
- **Automated Workflows**: Daily Club Sauna generation and evaluation

---

## Base URL

```
Production: https://your-app.vercel.app/api
Development: http://localhost:3000/api
```

---

## Authentication

The API uses three authentication methods:

### 1. Admin Session (Cookie-based)

**Setup:**

```bash
POST /api/auth/admin/login
{
  "username": "admin",
  "password": "password"
}
```

**Usage:**

- Automatically set via cookie
- Required for admin-only operations
- Expires after session timeout

### 2. Club Session (Cookie-based)

**Setup:**

```bash
POST /api/auth/validate-club-secret
{
  "secret": "ABC123XYZ"
}
```

**Usage:**

- Automatically set via cookie
- Scoped to single club
- Required for member operations

### 3. Cron Secret (Bearer Token)

**Usage:**

```bash
Authorization: Bearer <CRON_SECRET>
```

Set via environment variable `CRON_SECRET`.

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

Or for simple operations:

```json
{
  "success": true,
  "message": "Operation completed successfully"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

---

## Error Handling

### HTTP Status Codes

| Code  | Description                                         |
| ----- | --------------------------------------------------- |
| `200` | Success                                             |
| `201` | Created                                             |
| `400` | Bad Request (validation error, missing parameters)  |
| `401` | Unauthorized (missing or invalid authentication)    |
| `403` | Forbidden (authenticated but not authorized)        |
| `404` | Not Found (resource doesn't exist)                  |
| `409` | Conflict (duplicate resource, constraint violation) |
| `500` | Internal Server Error                               |

---

## API Endpoints

### Authentication Endpoints

#### Admin Authentication

##### `POST /api/auth/admin/login`

Authenticate an admin user and create a session.

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**

```json
{
  "success": true,
  "username": "admin"
}
```

**Errors:**

- `400` - Username and password are required
- `401` - Invalid credentials

---

##### `POST /api/auth/admin/logout`

Clear the admin session.

**Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

##### `GET /api/auth/admin/me`

Get the currently authenticated admin user.

**Auth:** Admin session required

**Response (200):**

```json
{
  "username": "admin"
}
```

**Errors:**

- `401` - Not authenticated

---

##### `POST /api/auth/admin/register`

Register the first admin user (only works if no admins exist).

**Request Body:**

```json
{
  "username": "string", // min 3 chars
  "password": "string", // min 8 chars
  "name": "string", // optional
  "email": "string" // optional
}
```

**Response (200):**

```json
{
  "success": true,
  "username": "admin"
}
```

**Errors:**

- `400` - Validation error
- `403` - Admin registration is disabled (admin already exists)

---

##### `GET /api/auth/admin/setup-status`

Check if admin setup is needed.

**Response (200):**

```json
{
  "needsSetup": true,
  "hasAdmins": false
}
```

---

#### Club Authentication

##### `GET /api/auth/session`

Get current club session information.

**Auth:** Club session required

**Response (200):**

```json
{
  "club": {
    "id": "uuid",
    "name": "My Club",
    "timezone": "Europe/Helsinki"
  }
}
```

**Errors:**

- `401` - No active session

---

##### `POST /api/auth/validate-club-secret`

Validate a club secret and create a club session.

**Request Body:**

```json
{
  "secret": "ABC123XYZ"
}
```

**Response (200):**

```json
{
  "valid": true,
  "clubId": "uuid",
  "clubName": "My Club",
  "expiresAt": "2025-12-31T23:59:59.999Z"
}
```

**Errors:**

- `400` - Validation error
- `401` - Invalid club secret

---

### Clubs

#### `POST /api/clubs`

Create a new club with auto-generated secret.

**Auth:** Admin only

**Request Body:**

```json
{
  "name": "string", // required, max 100 chars
  "timezone": "string", // default: Europe/Helsinki
  "logoUrl": "string", // optional, valid URL
  "primaryColor": "string", // optional, hex color
  "secondaryColor": "string" // optional, hex color
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "name": "My Club",
  "secret": "ABC123XYZ",
  "secretValidFrom": "2025-01-01T00:00:00.000Z",
  "secretValidUntil": "2025-12-31T23:59:59.999Z",
  "logoUrl": "https://example.com/logo.png",
  "primaryColor": "#FF5733",
  "secondaryColor": "#33C3FF",
  "timezone": "Europe/Helsinki",
  "createdAt": "2025-10-11T12:00:00.000Z",
  "updatedAt": "2025-10-11T12:00:00.000Z"
}
```

---

#### `GET /api/clubs`

Get all clubs with islands and boats.

**Auth:** Admin only

**Response (200):**

```json
[
  {
    "id": "uuid",
    "name": "My Club",
    "secret": "ABC123XYZ",
    "secretValidFrom": "2025-01-01T00:00:00.000Z",
    "secretValidUntil": "2025-12-31T23:59:59.999Z",
    "logoUrl": "https://example.com/logo.png",
    "primaryColor": "#FF5733",
    "secondaryColor": "#33C3FF",
    "timezone": "Europe/Helsinki",
    "islands": [...],
    "boats": [...],
    "createdAt": "2025-10-11T12:00:00.000Z",
    "updatedAt": "2025-10-11T12:00:00.000Z"
  }
]
```

---

#### `GET /api/clubs/:id`

Get a specific club with all related data.

**Auth:** Admin or Club session (club users can only access their own club)

**Response (200):**

```json
{
  "id": "uuid",
  "name": "My Club",
  "islands": [
    {
      "id": "uuid",
      "name": "North Island",
      "saunas": [...]
    }
  ],
  "boats": [...]
}
```

**Errors:**

- `403` - Access denied
- `404` - Club not found

---

#### `PUT /api/clubs/:id`

Update a club's details (excludes secret).

**Auth:** Admin only

**Request Body:**

```json
{
  "name": "string", // optional
  "logoUrl": "string", // optional
  "primaryColor": "string", // optional
  "secondaryColor": "string", // optional
  "timezone": "string" // optional
}
```

**Response (200):**

```json
{
  "id": "uuid",
  "name": "Updated Club Name",
  "logoUrl": "https://example.com/new-logo.png",
  "primaryColor": "#FF5733",
  "secondaryColor": "#33C3FF",
  "timezone": "Europe/Helsinki",
  "updatedAt": "2025-10-11T12:30:00.000Z"
}
```

---

#### `DELETE /api/clubs/:id`

Delete a club (cascade deletes all related data).

**Auth:** Admin only

**Response (200):**

```json
{
  "message": "Club deleted successfully"
}
```

---

#### `GET /api/clubs/:id/config`

Get complete club configuration for Island Device or user app setup.

**Auth:** Club session required

**Response (200):**

```json
{
  "club": {
    "id": "uuid",
    "name": "My Club",
    "logoUrl": "https://example.com/logo.png",
    "primaryColor": "#FF5733",
    "secondaryColor": "#33C3FF",
    "timezone": "Europe/Helsinki"
  },
  "islands": [
    {
      "id": "uuid",
      "name": "North Island",
      "numberOfSaunas": 2,
      "saunas": [
        {
          "id": "uuid",
          "name": "Main Sauna",
          "heatingTimeHours": 2.5,
          "autoClubSaunaEnabled": true
        }
      ]
    }
  ],
  "boats": [
    {
      "id": "uuid",
      "name": "Sea Breeze",
      "membershipNumber": "MB001",
      "captainName": "John Doe",
      "phoneNumber": "+358401234567"
    }
  ]
}
```

**Errors:**

- `403` - Access denied (must request own club)
- `404` - Club not found

---

#### `GET /api/clubs/:id/qr-code`

Generate QR code data for club access.

**Auth:** Admin only

**Response (200):**

```json
{
  "club": {
    "id": "uuid",
    "name": "My Club"
  },
  "qrData": {
    "type": "club_access",
    "clubId": "uuid",
    "clubName": "My Club",
    "secret": "ABC123XYZ",
    "validFrom": "2025-01-01T00:00:00.000Z",
    "validUntil": "2025-12-31T23:59:59.999Z",
    "appUrl": "https://your-app.vercel.app"
  },
  "qrString": "{\"type\":\"club_access\",\"clubId\":\"...\"}",
  "directUrl": "https://your-app.vercel.app/auth?secret=ABC123XYZ"
}
```

---

#### `POST /api/clubs/:id/theme`

Update club theme (logo and colors).

**Auth:** Admin only

**Request Body:**

```json
{
  "logoUrl": "string", // optional, valid URL
  "primaryColor": "string", // optional, hex #RRGGBB
  "secondaryColor": "string" // optional, hex #RRGGBB
}
```

**Response (200):**

```json
{
  "id": "uuid",
  "name": "My Club",
  "logoUrl": "https://example.com/new-logo.png",
  "primaryColor": "#FF5733",
  "secondaryColor": "#33C3FF"
}
```

---

### Islands

#### `POST /api/islands`

Create a new island.

**Auth:** Admin only

**Request Body:**

```json
{
  "name": "string", // required
  "clubId": "uuid" // required
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "name": "North Island",
  "clubId": "uuid",
  "numberOfSaunas": 0,
  "club": {
    "id": "uuid",
    "name": "My Club",
    "logoUrl": null,
    "primaryColor": null,
    "secondaryColor": null
  },
  "saunas": [],
  "createdAt": "2025-10-11T12:00:00.000Z",
  "updatedAt": "2025-10-11T12:00:00.000Z"
}
```

---

#### `GET /api/islands`

Get all islands (admin gets all, club users get their club's islands).

**Auth:** Admin or Club session

**Response (200):**

```json
[
  {
    "id": "uuid",
    "name": "North Island",
    "clubId": "uuid",
    "numberOfSaunas": 2,
    "club": {
      "id": "uuid",
      "name": "My Club",
      "logoUrl": "https://example.com/logo.png",
      "primaryColor": "#FF5733",
      "secondaryColor": "#33C3FF"
    },
    "saunas": [
      {
        "id": "uuid",
        "name": "Main Sauna"
      }
    ],
    "_count": {
      "saunas": 2
    }
  }
]
```

---

#### `GET /api/islands/:id`

Get a specific island with saunas.

**Auth:** Admin or Club session

**Response (200):**

```json
{
  "id": "uuid",
  "name": "North Island",
  "clubId": "uuid",
  "numberOfSaunas": 2,
  "club": {...},
  "saunas": [...]
}
```

**Errors:**

- `403` - Access denied
- `404` - Island not found

---

#### `PUT /api/islands/:id`

Update an island.

**Auth:** Admin only

**Request Body:**

```json
{
  "name": "string", // optional
  "numberOfSaunas": "number" // optional
}
```

**Response (200):**

```json
{
  "id": "uuid",
  "name": "Updated Island Name",
  "numberOfSaunas": 3,
  "club": {...},
  "saunas": [...]
}
```

---

#### `DELETE /api/islands/:id`

Delete an island (cascade deletes all saunas and reservations).

**Auth:** Admin only

**Response (200):**

```json
{
  "message": "Island deleted successfully"
}
```

---

### Saunas

#### `POST /api/saunas`

Create a new sauna.

**Auth:** Admin only

**Request Body:**

```json
{
  "islandId": "uuid", // required
  "name": "string", // required, max 100 chars
  "heatingTimeHours": 2.5, // 1-5, default: 2
  "autoClubSaunaEnabled": false // default: false
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "islandId": "uuid",
  "name": "Main Sauna",
  "heatingTimeHours": 2.5,
  "autoClubSaunaEnabled": false,
  "island": {
    "id": "uuid",
    "name": "North Island",
    "club": {...}
  },
  "createdAt": "2025-10-11T12:00:00.000Z",
  "updatedAt": "2025-10-11T12:00:00.000Z"
}
```

---

#### `GET /api/saunas`

Get all saunas (admin gets all, club users get their club's saunas).

**Auth:** Admin or Club session

**Query Parameters:**

- `islandId` (optional) - Filter by island ID

**Response (200):**

```json
[
  {
    "id": "uuid",
    "name": "Main Sauna",
    "islandId": "uuid",
    "heatingTimeHours": 2.5,
    "autoClubSaunaEnabled": true,
    "island": {
      "id": "uuid",
      "name": "North Island",
      "club": {
        "name": "My Club"
      }
    }
  }
]
```

---

#### `GET /api/saunas/:id`

Get a specific sauna.

**Auth:** Admin or Club session

**Response (200):**

```json
{
  "id": "uuid",
  "name": "Main Sauna",
  "islandId": "uuid",
  "heatingTimeHours": 2.5,
  "autoClubSaunaEnabled": true,
  "island": {
    "id": "uuid",
    "name": "North Island",
    "clubId": "uuid",
    "club": {...}
  }
}
```

---

#### `PUT /api/saunas/:id`

Update a sauna.

**Auth:** Admin only

**Request Body:**

```json
{
  "name": "string", // optional
  "heatingTimeHours": 2.5, // optional, 1-5
  "autoClubSaunaEnabled": true // optional
}
```

**Response (200):**

```json
{
  "id": "uuid",
  "name": "Updated Sauna Name",
  "heatingTimeHours": 3.0,
  "autoClubSaunaEnabled": true,
  "island": {...}
}
```

---

#### `DELETE /api/saunas/:id`

Delete a sauna (cascade deletes all reservations).

**Auth:** Admin only

**Response (200):**

```json
{
  "message": "Sauna deleted successfully"
}
```

---

#### `GET /api/saunas/:id/next-available`

Get the next available time slot for a sauna.

**Auth:** Club session required

**Response (200):**

```json
{
  "sauna": {
    "id": "uuid",
    "name": "Main Sauna",
    "heatingTimeHours": 2.5
  },
  "isCurrentlyReserved": false,
  "currentReservation": null,
  "nextAvailable": {
    "saunaId": "uuid",
    "saunaName": "Main Sauna",
    "startTime": "2025-10-11T18:00:00.000Z",
    "endTime": "2025-10-11T19:00:00.000Z",
    "reason": "heating"
  },
  "sharedReservationsToday": [
    {
      "id": "uuid",
      "name": "Club Sauna",
      "startTime": "2025-10-11T15:00:00.000Z",
      "malesDurationHours": 2,
      "femalesDurationHours": 2,
      "genderOrder": "MALES_FIRST",
      "participants": [...]
    }
  ]
}
```

**Reasons:**

- `heating` - Sauna is cold and needs heating time
- `buffer` - Within 15-minute buffer after current reservation
- `next_free` - Sauna is currently reserved, next free slot

---

### Boats

#### `POST /api/boats`

Create a new boat.

**Auth:** Admin only

**Request Body:**

```json
{
  "clubId": "uuid", // required
  "name": "string", // required, max 100 chars
  "membershipNumber": "string", // required, max 50 chars, unique
  "captainName": "string", // optional, max 100 chars
  "phoneNumber": "string" // optional, max 20 chars
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "clubId": "uuid",
  "name": "Sea Breeze",
  "membershipNumber": "MB001",
  "captainName": "John Doe",
  "phoneNumber": "+358401234567",
  "createdAt": "2025-10-11T12:00:00.000Z",
  "updatedAt": "2025-10-11T12:00:00.000Z"
}
```

**Errors:**

- `409` - Boat with this membership number already exists

---

#### `GET /api/boats`

Get all boats (admin gets all, club users get their club's boats).

**Auth:** Admin or Club session

**Response (200):**

```json
[
  {
    "id": "uuid",
    "name": "Sea Breeze",
    "membershipNumber": "MB001",
    "captainName": "John Doe",
    "phoneNumber": "+358401234567",
    "clubId": "uuid",
    "club": {
      "id": "uuid",
      "name": "My Club"
    }
  }
]
```

---

#### `GET /api/boats/:id`

Get a specific boat.

**Auth:** Admin or Club session

**Response (200):**

```json
{
  "id": "uuid",
  "name": "Sea Breeze",
  "membershipNumber": "MB001",
  "captainName": "John Doe",
  "phoneNumber": "+358401234567",
  "clubId": "uuid",
  "club": {...}
}
```

---

#### `PUT /api/boats/:id`

Update a boat.

**Auth:** Admin only

**Request Body:**

```json
{
  "name": "string", // optional
  "membershipNumber": "string", // optional
  "captainName": "string", // optional
  "phoneNumber": "string" // optional
}
```

**Response (200):**

```json
{
  "id": "uuid",
  "name": "Updated Boat Name",
  "membershipNumber": "MB001",
  "captainName": "Jane Smith",
  "phoneNumber": "+358409876543",
  "updatedAt": "2025-10-11T12:30:00.000Z"
}
```

---

#### `DELETE /api/boats/:id`

Delete a boat.

**Auth:** Admin only

**Response (200):**

```json
{
  "message": "Boat deleted successfully"
}
```

---

#### `GET /api/boats/search`

Search boats by name or membership number (fuzzy matching).

**Auth:** Club session required

**Query Parameters:**

- `q` (required) - Search query

**Response (200):**

```json
[
  {
    "id": "uuid",
    "name": "Sea Breeze",
    "membershipNumber": "MB001",
    "captainName": "John Doe",
    "phoneNumber": "+358401234567",
    "matchType": "name",
    "matchScore": 100
  }
]
```

**Match Scoring:**

- Exact name: 100
- Name starts with: 90
- Name contains: 70
- Exact membership: 85
- Membership starts with: 75
- Membership contains: 60

**Notes:**

- Returns max 20 results
- Sorted by match score descending, then by name

---

#### `POST /api/boats/bulk-import`

Bulk import boats from CSV data.

**Auth:** Admin only

**Request Body:**

```json
{
  "clubId": "uuid",
  "boats": [
    {
      "name": "string",
      "membershipNumber": "string",
      "captainName": "string", // optional
      "phoneNumber": "string" // optional
    }
  ]
}
```

**Response (201):**

```json
{
  "message": "Successfully imported 15 boats",
  "imported": 15,
  "boats": [...]
}
```

**Errors:**

- `400` - Validation errors (with detailed error messages per row)
- `409` - Duplicate membership numbers found

---

#### `GET /api/boats/:id/daily-limit`

Check if a boat can make a reservation on an island for a given date.

**Auth:** Club session required

**Query Parameters:**

- `islandId` (required) - Island ID
- `date` (optional) - Date to check (ISO 8601, defaults to today)

**Response (200):**

```json
{
  "canReserve": true,
  "hasIndividualReservation": false,
  "hasSharedParticipation": false,
  "existingReservation": undefined
}
```

Or:

```json
{
  "canReserve": false,
  "hasIndividualReservation": true,
  "hasSharedParticipation": false,
  "existingReservation": {
    "type": "individual",
    "id": "uuid",
    "startTime": "2025-10-11T14:00:00.000Z"
  }
}
```

**Notes:**

- Boats can only have one reservation per island per day
- Checks both individual reservations and shared participations

---

### Reservations

#### `POST /api/reservations`

Create a new individual reservation (1-hour slot).

**Auth:** Club session required

**Request Body:**

```json
{
  "saunaId": "uuid", // required
  "boatId": "uuid", // required
  "startTime": "2025-10-11T14:00:00Z", // required, must be on the hour
  "adults": 2, // required, 1-15
  "kids": 0 // optional, 0-15, default: 0
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "saunaId": "uuid",
  "boatId": "uuid",
  "startTime": "2025-10-11T14:00:00.000Z",
  "endTime": "2025-10-11T15:00:00.000Z",
  "adults": 2,
  "kids": 0,
  "status": "ACTIVE",
  "sauna": {...},
  "boat": {...},
  "createdAt": "2025-10-11T12:00:00.000Z",
  "updatedAt": "2025-10-11T12:00:00.000Z"
}
```

**Errors:**

- `400` - Invalid time slot / Validation error
- `409` - Time slot not available / Boat already has reservation on island today

**Notes:**

- Reservations are always 1 hour long
- Must start on the hour (e.g., 10:00, 11:00)
- Boat can only have one reservation per island per day
- Cannot reserve less than 15 minutes before start time

---

#### `GET /api/reservations`

Get reservations for a sauna.

**Auth:** Club session required

**Query Parameters:**

- `saunaId` (required) - Sauna ID
- `date` (optional) - Date to query (ISO 8601, defaults to today)
- `future` (optional) - If true, get all reservations from date onwards (default: false)

**Response (200):**

```json
[
  {
    "id": "uuid",
    "saunaId": "uuid",
    "boatId": "uuid",
    "startTime": "2025-10-11T14:00:00.000Z",
    "endTime": "2025-10-11T15:00:00.000Z",
    "adults": 2,
    "kids": 0,
    "status": "ACTIVE",
    "boat": {
      "id": "uuid",
      "name": "Sea Breeze",
      "membershipNumber": "MB001"
    },
    "createdAt": "2025-10-11T12:00:00.000Z",
    "cancelledAt": null
  }
]
```

---

#### `GET /api/reservations/:id`

Get a specific reservation.

**Auth:** Club session required

**Response (200):**

```json
{
  "id": "uuid",
  "saunaId": "uuid",
  "boatId": "uuid",
  "startTime": "2025-10-11T14:00:00.000Z",
  "endTime": "2025-10-11T15:00:00.000Z",
  "adults": 2,
  "kids": 0,
  "status": "ACTIVE",
  "sauna": {
    "id": "uuid",
    "name": "Main Sauna",
    "island": {...}
  },
  "boat": {...}
}
```

---

#### `DELETE /api/reservations/:id`

Cancel a reservation.

**Auth:** Club session required

**Response (200):**

```json
{
  "id": "uuid",
  "status": "CANCELLED",
  "cancelledAt": "2025-10-11T13:40:00.000Z",
  "sauna": {...},
  "boat": {...}
}
```

**Errors:**

- `400` - Cannot cancel (too close to start time / already started / already cancelled)

**Notes:**

- Cannot cancel within 15 minutes of start time
- Cannot cancel if reservation has already started
- Cannot cancel already cancelled reservations

---

### Shared Reservations

#### `POST /api/shared-reservations`

Create a new shared reservation (Club Sauna or custom).

**Auth:** Admin only

**Request Body:**

```json
{
  "saunaId": "uuid", // required
  "date": "2025-10-11", // required, ISO 8601 date
  "startTime": "2025-10-11T15:00:00Z", // required
  "malesDurationHours": 2, // required, 1-4
  "femalesDurationHours": 2, // required, 1-4
  "genderOrder": "MALES_FIRST", // required: MALES_FIRST | FEMALES_FIRST
  "name": "Club Sauna", // optional
  "description": "Weekly club gathering" // optional
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "saunaId": "uuid",
  "date": "2025-10-11",
  "startTime": "2025-10-11T15:00:00.000Z",
  "malesDurationHours": 2,
  "femalesDurationHours": 2,
  "genderOrder": "MALES_FIRST",
  "name": "Club Sauna",
  "description": "Weekly club gathering",
  "isAutoGenerated": false,
  "createdBy": "admin",
  "sauna": {...},
  "createdAt": "2025-10-11T12:00:00.000Z"
}
```

---

#### `GET /api/shared-reservations`

Get shared reservations.

**Auth:** Admin or Club session

**Query Parameters:**

- `saunaId` - Filter by sauna ID (required for club users, optional for admins)
- `date` - Filter by date (optional)

**Response (200):**

```json
[
  {
    "id": "uuid",
    "saunaId": "uuid",
    "date": "2025-10-11",
    "startTime": "2025-10-11T15:00:00.000Z",
    "malesDurationHours": 2,
    "femalesDurationHours": 2,
    "genderOrder": "MALES_FIRST",
    "name": "Club Sauna",
    "description": null,
    "isAutoGenerated": true,
    "autoCancelledAt": null,
    "convertedToIndividual": false,
    "sauna": {
      "id": "uuid",
      "name": "Main Sauna",
      "island": {
        "id": "uuid",
        "name": "North Island",
        "club": {
          "name": "My Club"
        }
      }
    },
    "participants": [
      {
        "id": "uuid",
        "boatId": "uuid",
        "adults": 2,
        "kids": 1,
        "joinedAt": "2025-10-11T13:00:00.000Z",
        "boat": {...}
      }
    ],
    "_count": {
      "participants": 3
    }
  }
]
```

---

#### `DELETE /api/shared-reservations/:id`

Delete a shared reservation (cascade deletes all participants).

**Auth:** Admin only

**Response (200):**

```json
{
  "message": "Shared reservation deleted successfully",
  "participantsDeleted": 3
}
```

---

#### `POST /api/shared-reservations/:id/join`

Join a shared reservation as a participant.

**Auth:** Club session required

**Request Body:**

```json
{
  "boatId": "uuid", // required
  "adults": 2, // required, 1-15
  "kids": 0 // optional, 0-15, default: 0
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "sharedReservationId": "uuid",
  "boatId": "uuid",
  "adults": 2,
  "kids": 1,
  "joinedAt": "2025-10-11T13:00:00.000Z",
  "boat": {...},
  "sharedReservation": {
    "id": "uuid",
    "name": "Club Sauna",
    "sauna": {...}
  }
}
```

**Errors:**

- `409` - Boat already participating / Boat has other reservation on island today

**Notes:**

- Boat can only join once per shared reservation
- Boat cannot join if it has any other reservation on the island that day

---

### Reports

#### `GET /api/reports/sauna/:id`

Get annual report for a sauna (for invoicing and analytics).

**Auth:** Admin only

**Query Parameters:**

- `year` (optional) - Year to report on (defaults to current year)

**Response (200):**

```json
{
  "saunaId": "uuid",
  "saunaName": "Main Sauna",
  "year": 2024,
  "totalHoursReserved": 150,
  "totalIndividualReservations": 150,
  "individualAdults": 250,
  "individualKids": 30,
  "sharedAdults": 80,
  "sharedKids": 20,
  "totalAdults": 330,
  "totalKids": 50,
  "uniqueBoatsTotal": 75,
  "uniqueBoatsIndividual": 60,
  "uniqueBoatsShared": 40,
  "uniqueBoatsBoth": 25
}
```

**Notes:**

- Only counts ACTIVE and COMPLETED reservations
- Individual reservations are for invoicing (1 hour each)
- Shared reservations tracked separately (not for invoicing)

---

#### `GET /api/reports/boat/:id`

Get annual report for a boat (for invoicing and usage tracking).

**Auth:** Admin only

**Query Parameters:**

- `year` (optional) - Year to report on (defaults to current year)

**Response (200):**

```json
{
  "boatId": "uuid",
  "boatName": "Sea Breeze",
  "membershipNumber": "MB001",
  "year": 2024,
  "totalIndividualReservations": 25,
  "totalHoursReserved": 25,
  "totalSharedParticipations": 10,
  "sharedAdults": 20,
  "sharedKids": 5,
  "perIslandData": [
    {
      "islandId": "uuid",
      "islandName": "North Island",
      "individualReservations": 15,
      "sharedParticipations": 6
    }
  ]
}
```

**Notes:**

- Only counts ACTIVE and COMPLETED reservations
- Individual reservations are for invoicing
- Shared participations tracked separately (not for invoicing)

---

### Synchronization

#### `POST /api/island-device/configure`

Configure an island device with a valid device token.

**Auth:** Device token

**Request Body:**

```json
{
  "token": "string"
}
```

**Response (200):**

```json
{
  "deviceId": "uuid",
  "club": {
    "id": "uuid",
    "name": "My Club",
    "secret": "ABC123XYZ",
    "logoUrl": "https://example.com/logo.png",
    "primaryColor": "#FF5733",
    "secondaryColor": "#33C3FF",
    "timezone": "Europe/Helsinki"
  },
  "island": {
    "id": "uuid",
    "name": "North Island",
    "clubId": "uuid",
    "numberOfSaunas": 2
  },
  "saunas": [...],
  "boats": [...]
}
```

**Notes:**

- Marks device as configured
- Returns all data needed for offline operation

---

#### `POST /api/sync/device`

Bidirectional sync between Island Device and backend.

**Auth:** Device ID validation

**Request Body:**

```json
{
  "deviceId": "uuid",
  "islandId": "uuid"
}
```

**Response (200):**

```json
{
  "synced": true,
  "timestamp": "2025-10-11T12:00:00.000Z",
  "message": "Sync completed successfully"
}
```

**Errors:**

- `403` - Device not authorized for this island
- `404` - Device not found

---

#### `POST /api/sync/push`

Push changes from Island Device to backend.

**Request Body:**

```json
{
  "islandId": "uuid",
  "changes": [
    {
      "id": "uuid",
      "entityType": "reservation",
      "entityId": "uuid",
      "operation": "create",
      "data": {
        "saunaId": "uuid",
        "boatId": "uuid",
        "startTime": "2025-10-11T14:00:00Z",
        "adults": 2,
        "kids": 0
      },
      "timestamp": "2025-10-11T13:00:00.000Z"
    }
  ],
  "lastSyncTimestamp": "2025-10-11T12:00:00.000Z"
}
```

**Response (200):**

```json
{
  "success": true,
  "appliedChanges": ["change-id-1", "change-id-2"],
  "rejectedChanges": [],
  "serverChanges": [],
  "newSyncTimestamp": "2025-10-11T13:00:00.000Z"
}
```

**Notes:**

- Device is source of truth
- Changes are applied as-is
- Creates sync logs for all applied changes

---

#### `GET /api/sync/pull/:islandId`

Pull changes from backend to Island Device.

**Query Parameters:**

- `since` (optional) - Timestamp to pull changes from (ISO 8601, defaults to start of today)

**Response (200):**

```json
{
  "islandId": "uuid",
  "changes": [
    {
      "id": "uuid",
      "entityType": "reservation",
      "entityId": "uuid",
      "operation": "create",
      "data": {
        "id": "uuid",
        "saunaId": "uuid",
        "boatId": "uuid",
        "startTime": "2025-10-11T14:00:00.000Z",
        "endTime": "2025-10-11T15:00:00.000Z",
        "adults": 2,
        "kids": 0,
        "status": "ACTIVE"
      },
      "timestamp": "2025-10-11T13:00:00.000Z"
    }
  ],
  "timestamp": "2025-10-11T13:30:00.000Z"
}
```

**Notes:**

- Returns reservations created/modified since the `since` timestamp
- Includes individual reservations and shared reservations with participants

---

### Cron Jobs

#### `POST /api/cron/generate-club-sauna`

Generate Club Sauna shared reservations for eligible saunas.

**Auth:** Cron secret (Bearer token)

**Schedule:** Daily at 00:00 UTC

**Response (200):**

```json
{
  "message": "Club Sauna generation completed",
  "date": "2025-10-11T00:00:00.000Z",
  "season": "high",
  "generated": [
    {
      "sharedReservationId": "uuid",
      "saunaId": "uuid",
      "saunaName": "Main Sauna",
      "islandName": "North Island",
      "clubName": "My Club",
      "date": "2025-10-12T00:00:00.000Z"
    }
  ]
}
```

**Notes:**

- Generates Club Sauna for tomorrow
- Only for eligible dates (high season or shoulder season weekends)
- Only for saunas with autoClubSaunaEnabled = true
- Skips if Club Sauna already exists

---

#### `POST /api/cron/evaluate-club-sauna`

Evaluate Club Sauna and convert to individual if < 3 participants.

**Auth:** Cron secret (Bearer token)

**Schedule:** Daily at 20:00 UTC

**Response (200):**

```json
{
  "message": "Club Sauna evaluation completed",
  "date": "2025-10-11T20:00:00.000Z",
  "evaluated": [
    {
      "sharedReservationId": "uuid",
      "saunaName": "Main Sauna",
      "islandName": "North Island",
      "clubName": "My Club",
      "participantCount": 2,
      "action": "cancelled_and_converted",
      "conversions": 2
    }
  ]
}
```

**Notes:**

- Evaluates today's Club Sauna reservations at 8 PM
- If < 3 participants: cancels shared, creates individual reservations
- If >= 3 participants: proceeds as shared reservation

---

#### `POST /api/cron/renew-club-secrets`

Automatically renew club secrets that are expired or expiring soon.

**Auth:** Cron secret (Bearer token)

**Schedule:** Daily at 00:00 UTC

**Response (200):**

```json
{
  "message": "Successfully renewed 2 club secret(s)",
  "renewed": [
    {
      "clubId": "uuid",
      "clubName": "My Club",
      "newExpiry": "2026-12-31T23:59:59.999Z",
      "wasExpired": false
    }
  ],
  "timestamp": "2025-10-11T00:00:00.000Z"
}
```

**Notes:**

- Renews secrets for clubs expired or expiring within 30 days
- Logs full details to server console
- Returns sanitized data (without secrets) in API response

---

## Data Models

### Club

```typescript
{
  id: string; // UUID
  name: string; // Max 100 chars
  secret: string; // Annual rotating credential
  secretValidFrom: Date; // Start of validity
  secretValidUntil: Date; // End of validity (December 31st)
  logoUrl: string | null; // Optional logo URL
  primaryColor: string | null; // Hex color #RRGGBB
  secondaryColor: string | null; // Hex color #RRGGBB
  timezone: string; // IANA timezone (default: Europe/Helsinki)
  createdAt: Date;
  updatedAt: Date;
}
```

### Island

```typescript
{
  id: string; // UUID
  name: string; // Max 100 chars
  clubId: string; // Foreign key
  numberOfSaunas: number; // 1-3
  createdAt: Date;
  updatedAt: Date;
}
```

### Sauna

```typescript
{
  id: string; // UUID
  islandId: string; // Foreign key
  name: string; // Max 100 chars
  heatingTimeHours: number; // 1-5, decimal
  autoClubSaunaEnabled: boolean; // Default: false
  createdAt: Date;
  updatedAt: Date;
}
```

### Boat

```typescript
{
  id: string; // UUID
  clubId: string; // Foreign key
  name: string; // Max 100 chars (not unique)
  membershipNumber: string; // Max 50 chars (unique within club)
  captainName: string | null; // Max 100 chars
  phoneNumber: string | null; // Max 20 chars
  createdAt: Date;
  updatedAt: Date;
}
```

### Reservation

```typescript
{
  id: string; // UUID
  saunaId: string; // Foreign key
  boatId: string; // Foreign key
  startTime: Date; // Must be on the hour
  endTime: Date; // startTime + 1 hour
  adults: number; // 1-15
  kids: number; // 0-15
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
}
```

### Shared Reservation

```typescript
{
  id: string; // UUID
  saunaId: string; // Foreign key
  date: Date; // Date only
  startTime: Date; // Must be on the hour
  malesDurationHours: number; // 1-4
  femalesDurationHours: number; // 1-4
  genderOrder: 'MALES_FIRST' | 'FEMALES_FIRST';
  name: string | null; // Optional name
  description: string | null; // Optional description
  isAutoGenerated: boolean; // True for Club Sauna
  createdBy: string; // 'admin' or 'system'
  autoCancelledAt: Date | null; // When auto-cancelled
  convertedToIndividual: boolean; // True if converted
  createdAt: Date;
}
```

### Shared Reservation Participant

```typescript
{
  id: string; // UUID
  sharedReservationId: string; // Foreign key
  boatId: string; // Foreign key
  adults: number; // 1-15
  kids: number; // 0-15
  joinedAt: Date;
}
```

---

## Validation Rules

### General

- **UUID fields**: Must be valid UUID v4
- **Timestamps**: ISO 8601 format
- **Dates**: ISO 8601 date format (YYYY-MM-DD)

### Party Size

- **Adults**: 1-15 (required)
- **Kids**: 0-15 (default: 0)
- **Total**: Max 20 people (adults + kids)

### Boat

- **Name**: 1-100 characters
- **Membership Number**: 1-50 characters, unique within club
- **Captain Name**: Max 100 characters (optional)
- **Phone Number**: Max 20 characters (optional)

### Club

- **Name**: 1-100 characters
- **Timezone**: Valid IANA timezone string
- **Colors**: Hex format #RRGGBB (case insensitive)
- **Logo URL**: Valid URL format

### Island

- **Name**: 1-100 characters
- **Number of Saunas**: 1-3

### Sauna

- **Name**: 1-100 characters
- **Heating Time**: 1-5 hours (decimal)

### Reservation

- **Start time**: Must be on the hour (e.g., 10:00, 11:00)
- **Duration**: 1 hour (fixed)
- **Minimum notice**: Cannot reserve within 15 minutes of start time
- **Daily limit**: One reservation per boat per island per day

### Shared Reservation

- **Duration per gender**: 1-4 hours
- **Gender order**: MALES_FIRST or FEMALES_FIRST
- **Name**: Optional string
- **Description**: Optional string

### Cancellation

- **Deadline**: 15 minutes before start time
- **Status**: Cannot cancel already cancelled or completed reservations

---

## Club Sauna Automation

### Season Definitions

**High Season** (Daily)

- May 15 - August 15

**Shoulder Season** (Fridays and Saturdays only)

- May 1-14
- August 16-31

### Generation Rules

- Runs daily at 00:00 UTC
- Creates Club Sauna for tomorrow
- Only for saunas with `autoClubSaunaEnabled = true`
- Skips if Club Sauna already exists for that date
- Gender schedule: Males first (2 hours), Females (2 hours)
- Start time: 15:00 (3 PM) in club timezone

### Evaluation Rules

- Runs daily at 20:00 UTC (8 PM)
- Evaluates today's auto-generated Club Sauna reservations
- **< 3 participants**: Cancels shared reservation, creates individual reservations for each participant
- **>= 3 participants**: Proceeds as shared reservation
- Only evaluates auto-generated reservations (not manual ones)

---

## Synchronization

### Island Device Priority

- Island Device is **source of truth** for all device-created reservations
- Web app reservations are pushed to Island Device via sync
- Conflict resolution: Device data always wins

### Sync Endpoints

1. **Configure** (`/api/island-device/configure`): One-time setup with device token
2. **Push** (`/api/sync/push`): Device → Backend (device changes)
3. **Pull** (`/api/sync/pull/:islandId`): Backend → Device (web app changes)
4. **Sync** (`/api/sync/device`): Bidirectional sync (updates lastSyncAt)

### Sync Flow

```
1. User creates reservation via web app
   → Backend creates reservation
   → Backend logs sync change

2. Island Device calls /api/sync/pull/:islandId
   → Receives web app changes since last sync

3. Island Device applies changes locally
   → Island Device stores as authoritative

4. Island Device creates reservation locally
   → Calls /api/sync/push with changes
   → Backend applies device changes

5. Web app polls for updates
   → Sees device-created reservations
```

---

## Rate Limiting

Currently not implemented. Consider adding in production:

- **Admin endpoints**: 100 requests/minute
- **Club endpoints**: 60 requests/minute
- **Cron endpoints**: Unlimited (internal only)

---

## Changelog

### Version 1.0.0 (2025-10-11)

- Initial API documentation
- All core endpoints documented
- Authentication flows defined
- Data models specified
- Validation rules documented

---

## Support

For issues or questions:

- **GitHub Issues**: [https://github.com/your-repo/issues](https://github.com/your-repo/issues)
- **Email**: support@example.com

---

**Generated:** 2025-10-11
**API Version:** 1.0.0
