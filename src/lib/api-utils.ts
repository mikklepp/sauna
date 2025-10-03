import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';
import { ZodError } from 'zod';

/**
 * Create a success API response
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Create an error API response
 */
export function errorResponse(
  error: string,
  status: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return errorResponse(
      `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
      400
    );
  }

  // Known errors with messages
  if (error instanceof Error) {
    // Authentication errors
    if (error.message.includes('Unauthorized')) {
      return errorResponse(error.message, 401);
    }

    // Not found errors
    if (error.message.includes('not found')) {
      return errorResponse(error.message, 404);
    }

    // Conflict errors
    if (error.message.includes('already exists') || error.message.includes('conflict')) {
      return errorResponse(error.message, 409);
    }

    // Generic error
    return errorResponse(error.message, 400);
  }

  // Unknown error
  return errorResponse('An unexpected error occurred', 500);
}

/**
 * Parse request body with error handling
 */
export async function parseRequestBody<T>(request: NextRequest): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Get query parameter from request
 */
export function getQueryParam(
  request: NextRequest,
  param: string
): string | null {
  const { searchParams } = new URL(request.url);
  return searchParams.get(param);
}

/**
 * Get required query parameter
 */
export function getRequiredQueryParam(
  request: NextRequest,
  param: string
): string {
  const value = getQueryParam(request, param);
  if (!value) {
    throw new Error(`Missing required query parameter: ${param}`);
  }
  return value;
}

/**
 * Get path parameter from dynamic route
 */
export function getPathParam(
  params: { [key: string]: string },
  param: string
): string {
  const value = params[param];
  if (!value) {
    throw new Error(`Missing required path parameter: ${param}`);
  }
  return value;
}

/**
 * Validate UUID format
 */
export function validateUUID(value: string, fieldName: string = 'ID'): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new Error(`Invalid ${fieldName} format`);
  }
}

/**
 * Parse date from query parameter
 */
export function parseDateParam(dateString: string | null): Date | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return date;
  } catch (error) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
}

/**
 * Get required date parameter
 */
export function getRequiredDateParam(
  request: NextRequest,
  param: string
): Date {
  const dateString = getRequiredQueryParam(request, param);
  const date = parseDateParam(dateString);
  if (!date) {
    throw new Error(`Invalid date parameter: ${param}`);
  }
  return date;
}

/**
 * Paginate results
 */
export function paginate<T>(
  items: T[],
  page: number = 1,
  pageSize: number = 20
): {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
} {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = items.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    total: items.length,
    page,
    pageSize,
    hasMore: endIndex < items.length,
  };
}

/**
 * Check if request has authorization header
 */
export function getAuthHeader(request: NextRequest): string | null {
  return request.headers.get('Authorization');
}

/**
 * Extract bearer token from authorization header
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = getAuthHeader(request);
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * CORS headers for API responses
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Handle OPTIONS request for CORS
 */
export function handleOptions(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(response: NextResponse): NextResponse {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}