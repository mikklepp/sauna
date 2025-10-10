# Deployment Guide - Sauna Reservation System

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Vercel Deployment](#vercel-deployment)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Post-Deployment Checks](#post-deployment-checks)
- [Monitoring & Analytics](#monitoring--analytics)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- [ ] Vercel account (free or paid tier)
- [ ] GitHub repository with the code
- [ ] PostgreSQL database (Vercel Postgres recommended)
- [ ] Admin credentials configured
- [ ] All environment variables ready

## Environment Setup

### Production Environment

1. **Database**: Vercel Postgres (or any PostgreSQL 15+ instance)
2. **Domain**: Custom domain or Vercel subdomain
3. **Region**: Choose closest to your users (default: us-east-1)

### Staging/Development Environment

1. **Database**: Separate Vercel Postgres instance
2. **Domain**: `staging-your-app.vercel.app`
3. **Purpose**: Testing before production deployment

## Vercel Deployment

### Initial Setup

1. **Connect Repository to Vercel**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

2. **Configure Project Settings**

In Vercel Dashboard:

- Framework Preset: **Next.js**
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Development Command: `npm run dev`

3. **Set Root Directory** (if needed)

- Root Directory: `.` (or leave blank)

### Branch Deployment Strategy

```
main branch       → Production (your-app.vercel.app)
develop branch    → Staging (staging-your-app.vercel.app)
feature/* branches → Preview deployments
```

### Configure Branch Deployments

In Vercel Dashboard → Project Settings → Git:

- **Production Branch**: `main`
- **Preview Deployments**: Enable for all branches
- **Automatic Deployments**: Enable

## Database Setup

### Option 1: Vercel Postgres (Recommended)

```bash
# Create database via Vercel Dashboard
# Storage → Create Database → Postgres

# Or via CLI
vercel postgres create sauna-prod
```

### Option 2: External PostgreSQL

Any PostgreSQL 15+ instance:

- AWS RDS
- Railway
- Supabase
- DigitalOcean Managed Database

### Database Migration

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://..."

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Optional: Seed initial data
npx prisma db seed
```

## Environment Variables

### Production Variables (Required)

Set these in Vercel Dashboard → Project Settings → Environment Variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication
SESSION_SECRET=<generate-with-openssl-rand-base64-32>
CRON_SECRET=<generate-with-openssl-rand-base64-32>

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production

# File Upload (if using Vercel Blob Storage)
BLOB_READ_WRITE_TOKEN=<from-vercel-blob-storage>
```

### Staging Variables

Same as production but with different values:

```env
DATABASE_URL=postgresql://user:password@staging-host:5432/staging_db
NEXT_PUBLIC_APP_URL=https://staging-your-app.vercel.app
```

### Generate Secrets

```bash
# Generate SESSION_SECRET
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -base64 32
```

## Post-Deployment Checks

Run the automated check script:

```bash
./scripts/deployment-check.sh https://your-app.vercel.app
```

### Manual Checks

1. **Authentication Flow**
   - [ ] Admin login works
   - [ ] QR code authentication works
   - [ ] Club secret validation works

2. **Core Functionality**
   - [ ] Create individual reservation
   - [ ] Create shared reservation
   - [ ] Join shared reservation
   - [ ] Cancel reservation
   - [ ] View reservations list

3. **Admin Portal**
   - [ ] Manage clubs
   - [ ] Manage islands/saunas/boats
   - [ ] View reports
   - [ ] Generate QR codes

4. **PWA Features**
   - [ ] Service worker registers
   - [ ] Offline fallback works
   - [ ] Manifest loads correctly

5. **Cron Jobs**
   - [ ] Secret renewal (midnight)
   - [ ] Club sauna generation (midnight)
   - [ ] Club sauna evaluation (20:00)

## Monitoring & Analytics

### Vercel Analytics

Enable in Vercel Dashboard:

- **Analytics**: Track page views, performance
- **Speed Insights**: Monitor Core Web Vitals

### Error Tracking (Optional - Sentry)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Add to environment variables:

```env
SENTRY_DSN=https://...@sentry.io/...
```

## Troubleshooting

### Build Failures

**Error: "Cannot find module '@prisma/client'"**

- Ensure `postinstall` script runs: `npx prisma generate`

**Error: "Environment variable DATABASE_URL is not set"**

- Add DATABASE_URL to Vercel environment variables
- Can use placeholder for build

### Database Connection Issues

- Check DATABASE_URL format
- Verify database allows Vercel IP ranges
- Add `?sslmode=require` for SSL connections

### Cron Jobs Not Running

- Requires Vercel Pro plan
- Alternative: GitHub Actions scheduled workflows

## Security Checklist

- [ ] All secrets in Vercel environment variables
- [ ] No sensitive data in repository
- [ ] HTTPS enforced (automatic on Vercel)
- [ ] Database uses SSL
- [ ] Admin portal requires authentication
- [ ] Cron endpoints require CRON_SECRET

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
