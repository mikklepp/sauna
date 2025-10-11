import { NextResponse } from 'next/server';
import { generateOpenAPIDocument } from '@/lib/openapi-registry';

/**
 * GET /api/openapi
 * Returns the OpenAPI 3.1 specification in JSON format
 */
export async function GET() {
  try {
    const openAPIDocument = generateOpenAPIDocument();

    return NextResponse.json(openAPIDocument, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('❌ Error generating OpenAPI document:');
    console.error(
      'Error type:',
      error instanceof Error ? error.constructor.name : typeof error
    );
    console.error(
      'Error message:',
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      'Stack trace:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    return NextResponse.json(
      {
        error: 'Failed to generate OpenAPI document',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
