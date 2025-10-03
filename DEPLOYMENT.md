# Deployment Guide - Sauna Reservation System

## Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com
2. **PostgreSQL Database**: Vercel Postgres or external provider
3. **Vercel Blob Storage**: For logo uploads

## Environment Variables

Required environment variables for production:

### Database
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct PostgreSQL URL for migrations (usually same as DATABASE_URL)

### Authentication & Security
- `SESSION_SECRET` - Random secret for session encryption (generate with: `openssl rand -base64 32`)
- `CRON_SECRET` - Secret for protecting cron endpoints (generate with: `openssl rand -base64 32`)

### Storage
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token for logo uploads

### App Configuration
- `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., https://your-app.vercel.app)
- `DEFAULT_TIMEZONE` - Default timezone for new clubs (e.g., "Europe/Helsinki")

### Optional
- `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` - Vercel Analytics ID
- `SENTRY_DSN` - Sentry error tracking (server)
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry error tracking (client)

## Deployment Steps

### 1. Database Setup

```bash
# Install Vercel Postgres (recommended)
vercel integration add vercel-postgres

# Or configure external PostgreSQL database
# Set DATABASE_URL and DIRECT_URL in Vercel dashboard
```

### 2. Blob Storage Setup

```bash
# Install Vercel Blob Storage
vercel integration add vercel-blob

# Token will be automatically added to environment variables
```

### 3. Set Environment Variables

In Vercel dashboard → Project → Settings → Environment Variables, add:

```
SESSION_SECRET=<generate-with-openssl-rand-base64-32>
CRON_SECRET=<generate-with-openssl-rand-base64-32>
DEFAULT_TIMEZONE=Europe/Helsinki
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 4. Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### 5. Run Database Migrations

```bash
# After first deployment, run migrations
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

### 6. Set Up Cron Jobs

Vercel Cron is configured in `vercel.json`. Jobs will run automatically:
- **Midnight** (00:00): Generate Club Sauna reservations
- **8 PM** (20:00): Evaluate Club Sauna reservations

**Important**: Add CRON_SECRET to your environment variables to secure cron endpoints.

## Post-Deployment Checklist

- [ ] Database migrations applied successfully
- [ ] Test admin login works
- [ ] Create test club and verify functionality
- [ ] Test QR code authentication flow
- [ ] Verify Island Device setup works
- [ ] Check that reservations can be created
- [ ] Verify Club Sauna auto-generation (check logs at midnight)
- [ ] Test offline functionality in Island Device mode
- [ ] Verify blob storage for logo uploads works

## Troubleshooting

### Build Warnings

The build may show prerender warnings for dynamic pages:
```
Error occurred prerendering page "/auth"
TypeError: Cannot read properties of null (reading 'useContext')
```

**This is expected** for pages using client-side features. They will render correctly at runtime on Vercel.

### Database Connection Issues

If you see database connection errors:
1. Verify DATABASE_URL is correct
2. Ensure database accepts connections from Vercel IPs
3. Check that SSL mode is configured: `?sslmode=require`

### Cron Jobs Not Running

1. Verify CRON_SECRET is set in environment variables
2. Check Vercel dashboard → Deployments → Functions → Cron Jobs
3. Test endpoints manually:
   ```bash
   curl -X POST https://your-app.vercel.app/api/cron/generate-club-sauna \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

## Monitoring

- **Vercel Analytics**: Automatic performance monitoring
- **Vercel Logs**: View function logs in dashboard
- **Cron Execution**: Check cron job history in Vercel dashboard

## Scaling Considerations

- Database connection pooling is configured via Prisma
- Blob storage has generous free tier (100GB bandwidth/month)
- Consider upgrading Vercel plan for:
  - Increased function execution time
  - Higher bandwidth limits
  - Team collaboration features
