#!/bin/bash

# Deployment Readiness Check Script
# Verifies that the application is ready for Vercel deployment

set -e

echo "🚀 Sauna Reservation System - Deployment Readiness Check"
echo "=========================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Track overall status
WARNINGS=0
ERRORS=0

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        ERRORS=$((ERRORS + 1))
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

print_info() {
    echo -e "ℹ️  $1"
}

echo "1. Checking environment files..."
echo "--------------------------------"

# Check .env.example exists
if [ -f ".env.example" ]; then
    print_status 0 ".env.example exists"
else
    print_status 1 ".env.example is missing"
fi

# Check required files
if [ -f "vercel.json" ]; then
    print_status 0 "vercel.json exists"
else
    print_status 1 "vercel.json is missing"
fi

if [ -f "DEPLOYMENT.md" ]; then
    print_status 0 "DEPLOYMENT.md exists"
else
    print_warning "DEPLOYMENT.md is missing (recommended)"
fi

echo ""
echo "2. Checking required environment variables in .env.example..."
echo "--------------------------------------------------------------"

REQUIRED_VARS=(
    "DATABASE_URL"
    "SESSION_SECRET"
    "CRON_SECRET"
    "BLOB_READ_WRITE_TOKEN"
)

for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^${var}=" .env.example; then
        print_status 0 "$var documented"
    else
        print_status 1 "$var missing from .env.example"
    fi
done

echo ""
echo "3. Checking database schema..."
echo "-------------------------------"

if [ -f "prisma/schema.prisma" ]; then
    print_status 0 "Prisma schema exists"

    # Count migrations
    MIGRATION_COUNT=$(find prisma/migrations -type d -mindepth 1 2>/dev/null | wc -l | tr -d ' ')
    if [ "$MIGRATION_COUNT" -gt 0 ]; then
        print_status 0 "Database migrations exist ($MIGRATION_COUNT found)"
    else
        print_warning "No database migrations found"
    fi
else
    print_status 1 "Prisma schema is missing"
fi

echo ""
echo "4. Checking TypeScript configuration..."
echo "----------------------------------------"

if npx tsc --noEmit > /dev/null 2>&1; then
    print_status 0 "TypeScript compilation passes"
else
    print_status 1 "TypeScript compilation has errors"
    print_info "Run 'npx tsc --noEmit' to see details"
fi

echo ""
echo "5. Checking tests..."
echo "--------------------"

if command -v npx > /dev/null 2>&1; then
    if npx vitest run --reporter=basic > /dev/null 2>&1; then
        print_status 0 "Unit tests pass"
    else
        print_warning "Some unit tests are failing"
        print_info "Run 'npx vitest run' to see details"
    fi
else
    print_warning "Cannot verify tests (vitest not found)"
fi

echo ""
echo "6. Checking Next.js configuration..."
echo "-------------------------------------"

if [ -f "next.config.mjs" ]; then
    print_status 0 "Next.js config exists"

    # Check for PWA configuration
    if grep -q "withPWA" next.config.mjs; then
        print_status 0 "PWA configuration present"
    else
        print_warning "PWA configuration not detected"
    fi
else
    print_status 1 "next.config.mjs is missing"
fi

echo ""
echo "7. Checking vercel.json configuration..."
echo "-----------------------------------------"

if [ -f "vercel.json" ]; then
    # Check for cron jobs
    if grep -q "crons" vercel.json; then
        print_status 0 "Cron jobs configured"

        # Count cron jobs
        CRON_COUNT=$(grep -c '"path":' vercel.json || echo "0")
        print_info "Found $CRON_COUNT cron job(s)"
    else
        print_warning "No cron jobs configured"
    fi

    # Check for function timeouts
    if grep -q "maxDuration" vercel.json; then
        print_status 0 "Function timeouts configured"
    else
        print_warning "Function timeouts not configured"
    fi
else
    print_status 1 "vercel.json is missing"
fi

echo ""
echo "8. Checking build output..."
echo "---------------------------"

if [ -d ".next" ]; then
    print_status 0 "Build artifacts exist (.next directory)"

    # Check for server output
    if [ -d ".next/server" ]; then
        print_status 0 "Server build exists"
    else
        print_warning "Server build not found"
    fi
else
    print_warning "No build artifacts found"
    print_info "Run 'npm run build' to create a production build"
fi

echo ""
echo "9. Checking package.json scripts..."
echo "------------------------------------"

REQUIRED_SCRIPTS=("build" "start" "dev")

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if grep -q "\"$script\":" package.json; then
        print_status 0 "Script '$script' exists"
    else
        print_status 1 "Script '$script' is missing"
    fi
done

echo ""
echo "10. Checking dependencies..."
echo "----------------------------"

if [ -f "package-lock.json" ] || [ -f "yarn.lock" ] || [ -f "pnpm-lock.yaml" ]; then
    print_status 0 "Lock file exists"
else
    print_warning "No lock file found (recommended for consistent deployments)"
fi

if [ -d "node_modules" ]; then
    print_status 0 "Dependencies installed"
else
    print_warning "node_modules not found"
    print_info "Run 'npm install' before deploying"
fi

echo ""
echo "=========================================================="
echo "Summary:"
echo "--------"
echo -e "Errors: ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Application is ready for deployment!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Set up Vercel Postgres: vercel integration add vercel-postgres"
    echo "2. Set up Vercel Blob: vercel integration add vercel-blob"
    echo "3. Set environment variables in Vercel dashboard"
    echo "4. Deploy: vercel --prod"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Please fix errors before deploying${NC}"
    echo ""
    exit 1
fi
