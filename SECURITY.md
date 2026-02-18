# Security Guidelines for Armstrong Platform

## Overview
This document outlines security considerations and best practices for the Armstrong Immo-Wallet platform as it enters beta testing.

## Known Security Considerations

### Dependencies
As of the beta testing phase, the following dependency issues are noted:

#### XLSX Library (HIGH Risk - No Fix Available)
- **Issue**: Prototype Pollution (GHSA-4r6h-8v6p-xvw6) and ReDoS (GHSA-5pgg-2g8v-p4x9)
- **Mitigation**: 
  - Only process XLSX files from trusted sources
  - Validate file size before processing (max 10MB recommended)
  - Consider migrating to `exceljs` or `xlsx-js-style` in future releases
  - Never allow user-uploaded XLSX files to be processed without sanitization

#### ESLint Chain (MODERATE Risk)
- **Issue**: Various moderate vulnerabilities in ESLint dependencies
- **Impact**: Development-only, no production impact
- **Status**: Waiting for upstream fixes

### Security Headers
The following security headers are configured in development and should be enforced in production:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**Production Configuration**: Ensure your hosting provider (Supabase/Vercel/etc.) enforces these headers.

### Authentication & Authorization

#### Multi-Tenant Architecture
- Row-Level Security (RLS) policies enforced at database level
- Tenant ID validation on every request
- Active tenant switching with proper isolation

#### Session Management
- Supabase handles JWT tokens with automatic refresh
- Tokens stored in localStorage (standard practice for SPAs)
- OTP authentication supported for enhanced security

#### Development Mode
- Development tenant UUID: `DEV_TENANT_UUID` environment variable
- **CRITICAL**: Ensure development mode is disabled in production
- Check: `import.meta.env.PROD` should be true in production builds

### Data Protection

#### Sensitive Data
- Passwords: Never stored in frontend state
- API Keys: Only `VITE_SUPABASE_PUBLISHABLE_KEY` (public by design)
- User Data: Encrypted in transit (HTTPS enforced)

#### Database Security
- 300+ PostgreSQL migrations with RLS policies
- Tenant isolation at row level
- Audit trails via `updated_at` timestamps

### Content Security Policy (CSP)

For production deployment, configure CSP headers:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.livekit.cloud;
  frame-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
```

**Note**: `unsafe-inline` and `unsafe-eval` are required for React and Mermaid diagrams. Consider using nonce-based CSP in future.

### API Rate Limiting

Supabase provides built-in rate limiting. For additional protection:

1. **Implement client-side rate limiting** for expensive operations
2. **Monitor** Supabase dashboard for unusual activity
3. **Set alerts** for high request volumes

### Third-Party Integrations

The platform integrates with:
- **LiveKit**: Video conferencing (requires API key validation)
- **Europace**: Financial services (API authentication required)
- **Lovable Cloud Auth**: Authentication provider

**Security Checklist for Integrations**:
- [ ] Validate all API responses before processing
- [ ] Never expose API keys in client-side code
- [ ] Use environment variables for configuration
- [ ] Implement timeout and retry logic with exponential backoff

## Beta Testing Security Checklist

### Before Beta Launch
- [ ] Verify all environment variables are properly configured
- [ ] Ensure development mode is disabled in production build
- [ ] Test authentication flows (sign in, sign out, token refresh)
- [ ] Verify RLS policies block unauthorized access
- [ ] Test tenant switching and isolation
- [ ] Review database permissions and roles
- [ ] Ensure HTTPS is enforced (no HTTP allowed)
- [ ] Configure security headers on hosting provider
- [ ] Set up monitoring and alerting
- [ ] Prepare incident response plan

### During Beta Testing
- [ ] Monitor for unusual authentication patterns
- [ ] Track failed login attempts
- [ ] Review error logs daily
- [ ] Monitor API usage and rate limits
- [ ] Collect security feedback from beta testers
- [ ] Test on different devices and browsers
- [ ] Verify mobile PWA security (app isolation)

### Regular Security Maintenance
- [ ] Run `npm audit` weekly and address issues
- [ ] Update dependencies monthly (test thoroughly)
- [ ] Review Supabase logs for suspicious activity
- [ ] Rotate API keys quarterly
- [ ] Review and update RLS policies as features evolve
- [ ] Conduct code reviews focusing on security

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. Email security details to: [contact email - to be configured]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Security Resources

- [Supabase Security Documentation](https://supabase.com/docs/guides/auth)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security Best Practices](https://react.dev/learn/escape-hatches#security-considerations)
- [Vite Security](https://vitejs.dev/guide/env-and-mode.html#env-files)

## Version History

- **2026-02-18**: Initial security documentation for beta testing phase
