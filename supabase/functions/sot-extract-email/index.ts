import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Domains to filter out (false positives)
const BLACKLISTED_DOMAINS = [
  'example.com', 'example.org', 'example.net',
  'wix.com', 'squarespace.com', 'wordpress.com', 'wordpress.org',
  'sentry.io', 'google.com', 'googleapis.com',
  'facebook.com', 'twitter.com', 'instagram.com',
  'w3.org', 'schema.org', 'gravatar.com',
  'jquery.com', 'bootstrap.com', 'github.com',
  'cloudflare.com', 'amazonaws.com',
  'placeholder.com', 'yourcompany.com', 'yourdomain.com',
  'test.com', 'test.de',
];

// Preferred prefixes (higher priority)
const PREFERRED_PREFIXES = ['info@', 'kontakt@', 'contact@', 'office@', 'mail@', 'service@', 'anfrage@'];

function extractEmails(html: string): string[] {
  // Decode HTML entities and common obfuscation
  const decoded = html
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\s*\[at\]\s*/gi, '@')
    .replace(/\s*\(at\)\s*/gi, '@')
    .replace(/\s*\[dot\]\s*/gi, '.')
    .replace(/\s*\(dot\)\s*/gi, '.');

  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const matches = decoded.match(emailRegex) || [];

  // Deduplicate and lowercase
  const unique = [...new Set(matches.map(e => e.toLowerCase()))];

  // Filter out blacklisted domains and image/file extensions
  return unique.filter(email => {
    const domain = email.split('@')[1];
    if (!domain) return false;
    if (BLACKLISTED_DOMAINS.some(bl => domain.endsWith(bl))) return false;
    // Filter emails that look like file references
    if (/\.(png|jpg|jpeg|gif|svg|css|js|webp)$/i.test(email)) return false;
    return true;
  });
}

function pickBestEmail(emails: string[]): string | null {
  if (emails.length === 0) return null;

  // Check preferred prefixes first
  for (const prefix of PREFERRED_PREFIXES) {
    const match = emails.find(e => e.startsWith(prefix));
    if (match) return match;
  }

  // Prefer .de domains
  const deDomain = emails.find(e => e.endsWith('.de'));
  if (deDomain) return deDomain;

  return emails[0];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Extracting email from: ${url}`);

    // Fetch the website HTML
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let html: string;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'de-DE,de;q=0.9,en;q=0.5',
        },
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      html = await response.text();
    } catch (fetchErr) {
      clearTimeout(timeout);
      console.error(`Failed to fetch ${url}:`, fetchErr);
      return new Response(
        JSON.stringify({ emails: [], bestEmail: null, error: `Could not fetch website: ${fetchErr.message}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also try /impressum and /kontakt pages
    const baseUrl = new URL(url).origin;
    const subpages = ['/impressum', '/kontakt', '/contact', '/imprint'];
    
    for (const path of subpages) {
      try {
        const subController = new AbortController();
        const subTimeout = setTimeout(() => subController.abort(), 5000);
        const subResponse = await fetch(`${baseUrl}${path}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html',
            'Accept-Language': 'de-DE,de;q=0.9',
          },
          signal: subController.signal,
          redirect: 'follow',
        });
        clearTimeout(subTimeout);
        if (subResponse.ok) {
          html += '\n' + await subResponse.text();
        }
      } catch {
        // Ignore subpage fetch errors
      }
    }

    const emails = extractEmails(html);
    const bestEmail = pickBestEmail(emails);

    console.log(`Found ${emails.length} emails, best: ${bestEmail}`);

    return new Response(
      JSON.stringify({ emails, bestEmail }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sot-extract-email:', error);
    return new Response(
      JSON.stringify({ error: error.message, emails: [], bestEmail: null }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
