'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI with no SSR to avoid window issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

/**
 * API Documentation page with interactive Swagger UI
 */
export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <SwaggerUI
        url="/api/openapi"
        docExpansion="list"
        defaultModelsExpandDepth={1}
        defaultModelExpandDepth={1}
      />
    </div>
  );
}
