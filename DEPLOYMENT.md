# Deployment Guide - Armstrong Immo-Wallet

## Overview

This guide covers deploying the Armstrong platform to production. The platform is a React SPA with Supabase backend.

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Hosting provider account (Vercel, Netlify, or similar)
- Domain name (optional)

## Environment Configuration

### Required Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id

# Optional: LiveKit (for video conferencing)
VITE_LIVEKIT_URL=wss://your-livekit-server.com
VITE_LIVEKIT_API_KEY=your-livekit-key
VITE_LIVEKIT_API_SECRET=your-livekit-secret

# Optional: External Services
VITE_EUROPACE_PARTNER_ID=your-partner-id
VITE_EUROPACE_API_KEY=your-api-key
```

### Obtaining Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` `public` key → `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Project Reference → `VITE_SUPABASE_PROJECT_ID`

## Build Process

### Development Build
```bash
npm install
npm run dev
```
Access at: http://localhost:8080

### Production Build
```bash
npm install
npm run build
```
Output directory: `dist/`

### Preview Production Build Locally
```bash
npm run preview
```

## Deployment Options

### Option 1: Vercel (Recommended)

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Deploy
```bash
# First deployment
vercel

# Production deployment
vercel --prod
```

#### Step 3: Configure Environment Variables
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all required environment variables
3. Redeploy: `vercel --prod`

#### Step 4: Configure Build Settings
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Option 2: Netlify

#### Step 1: Create `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
```

#### Step 2: Deploy via CLI
```bash
npm install -g netlify-cli
netlify init
netlify deploy --prod
```

Or connect your GitHub repository in Netlify Dashboard.

### Option 3: GitHub Pages

**Note**: GitHub Pages doesn't support environment variables at build time. Not recommended for production.

### Option 4: Self-Hosted (Docker)

#### Step 1: Create Dockerfile
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Step 2: Create nginx.conf
```nginx
server {
    listen 80;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Step 3: Build and Run
```bash
docker build -t armstrong-platform .
docker run -p 80:80 armstrong-platform
```

## Database Setup (Supabase)

### Step 1: Run Migrations

The repository includes 300+ migrations. Apply them in order:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref your-project-id

# Push migrations
supabase db push
```

### Step 2: Set Up Row-Level Security (RLS)

Migrations include RLS policies. Verify in Supabase Dashboard:

1. Navigate to **Database** → **Policies**
2. Ensure each table has appropriate policies
3. Test policies with different user roles

### Step 3: Configure Storage

Enable storage buckets for file uploads:

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('documents', 'documents', false),
  ('images', 'images', true),
  ('exports', 'exports', false);

-- Set up storage policies (example)
CREATE POLICY "Users can upload to their tenant"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid() IN (
      SELECT user_id FROM tenant_memberships
      WHERE tenant_id = (storage.foldername(name))[1]::uuid
    )
  );
```

## Security Configuration

### Step 1: Enable HTTPS

All production deployments **must** use HTTPS. Vercel/Netlify provide this automatically.

### Step 2: Configure CORS

In Supabase Dashboard → Settings → API:
- Add your production domain to allowed origins
- Example: `https://armstrong.example.com`

### Step 3: Verify Authentication

Test authentication flows:
1. Sign up new user
2. Sign in existing user
3. Password reset
4. OTP authentication
5. Sign out
6. Token refresh (leave tab open for 1+ hour)

### Step 4: Set Up Monitoring

Supabase provides built-in monitoring. Additionally:

1. **Error Tracking**: Consider Sentry or LogRocket
2. **Analytics**: PostHog, Google Analytics, or Plausible
3. **Uptime Monitoring**: UptimeRobot or Pingdom

## Performance Optimization

### Step 1: Enable Compression

Vercel/Netlify enable this automatically. For self-hosted:

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### Step 2: Configure Caching

Static assets are cached for 1 year (see nginx.conf above).

### Step 3: Enable Service Worker

The PWA service worker is already configured in `vite.config.ts`. It will:
- Cache static assets
- Enable offline access to recently viewed pages
- Automatically update in the background

### Step 4: Monitor Bundle Size

```bash
npm run build

# Analyze bundle
npx vite-bundle-visualizer
```

Target: Keep main bundle < 500KB gzipped.

## Post-Deployment Checklist

### Immediate (Day 1)
- [ ] Verify all environment variables are set
- [ ] Test authentication flows
- [ ] Create test user and tenant
- [ ] Upload test document to verify storage
- [ ] Test mobile PWA installation
- [ ] Verify all modules load correctly
- [ ] Check browser console for errors
- [ ] Verify security headers (securityheaders.com)

### Week 1
- [ ] Monitor error logs daily
- [ ] Track user feedback
- [ ] Check performance metrics
- [ ] Verify database backups are running
- [ ] Test disaster recovery procedure
- [ ] Review API usage and rate limits

### Month 1
- [ ] Run security audit (`npm audit`)
- [ ] Review user analytics
- [ ] Optimize slow queries (Supabase dashboard)
- [ ] Update dependencies if needed
- [ ] Collect feature requests
- [ ] Plan next release

## Rollback Procedure

If deployment fails or critical issues arise:

### Vercel/Netlify
1. Go to Dashboard → Deployments
2. Find last working deployment
3. Click **Rollback** or **Publish**

### Self-Hosted
```bash
# Using Docker
docker pull armstrong-platform:previous-tag
docker stop armstrong-current
docker run -d --name armstrong-current armstrong-platform:previous-tag
```

### Database Rollback
```bash
# Using Supabase CLI
supabase db reset
# Then apply migrations up to specific version
```

## Troubleshooting

### Build Fails
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Working
- Ensure variables start with `VITE_`
- Rebuild after changing variables
- Clear browser cache and hard reload

### Authentication Issues
- Verify Supabase URL and key are correct
- Check CORS settings in Supabase
- Ensure HTTPS is enabled
- Check browser console for errors

### Performance Issues
- Enable CDN (Vercel/Netlify provide this)
- Optimize images (use WebP format)
- Enable compression
- Check database indexes

## Maintenance

### Regular Updates
```bash
# Update dependencies monthly
npm update
npm audit fix

# Test thoroughly
npm run test
npm run build
```

### Database Maintenance
- **Backups**: Supabase auto-backs up daily (paid plans)
- **Indexes**: Review slow queries and add indexes
- **Cleanup**: Periodically archive old data

### Monitoring
- **Supabase Dashboard**: Monitor database, auth, storage
- **Error Logs**: Review regularly for patterns
- **User Feedback**: Collect and prioritize

## Support

- **Documentation**: See README.md and other guides
- **Issues**: GitHub repository issues
- **Security**: See SECURITY.md for reporting vulnerabilities

## Version History

- **2026-02-18**: Initial deployment guide for beta testing phase
