/**
 * SocialLoginButtons — Reusable Apple + Google Sign-In buttons
 * Used in both Portal Login (/auth) and FutureRoom Login.
 */
import { useState } from 'react';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';

interface SocialLoginButtonsProps {
  /** Optional separator text below buttons */
  separatorText?: string;
  /** Visual variant for different login pages */
  variant?: 'portal' | 'futureroom';
}

export default function SocialLoginButtons({
  separatorText = 'oder mit E-Mail anmelden',
  variant = 'portal',
}: SocialLoginButtonsProps) {
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);

  const handleSocialLogin = async (provider: 'apple' | 'google') => {
    setLoading(provider);
    try {
      // Portal login → redirect to /portal so brand-domain root guard doesn't intercept
      const redirectTarget = variant === 'portal'
        ? `${window.location.origin}/portal`
        : window.location.origin;
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: redirectTarget,
      });
      if (result.error) {
        toast.error(`Anmeldung fehlgeschlagen: ${result.error.message}`);
      }
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || 'Ein Fehler ist aufgetreten.');
    } finally {
      setLoading(null);
    }
  };

  if (variant === 'futureroom') {
    return (
      <div className="space-y-3 mb-6">
        <button
          type="button"
          onClick={() => handleSocialLogin('apple')}
          disabled={loading !== null}
          className="fr-btn w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: 'hsl(210 30% 15%)',
            color: 'white',
            opacity: loading === 'google' ? 0.5 : 1,
          }}
        >
          {loading === 'apple' ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <AppleIcon />
          )}
          Mit Apple fortfahren
        </button>

        <button
          type="button"
          onClick={() => handleSocialLogin('google')}
          disabled={loading !== null}
          className="fr-btn w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: 'white',
            color: 'hsl(210 30% 15%)',
            border: '1.5px solid hsl(210 20% 88%)',
            opacity: loading === 'apple' ? 0.5 : 1,
          }}
        >
          {loading === 'google' ? (
            <div className="h-5 w-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          Mit Google fortfahren
        </button>

        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px" style={{ background: 'hsl(210 20% 88%)' }} />
          <span className="text-xs text-gray-400 whitespace-nowrap">{separatorText}</span>
          <div className="flex-1 h-px" style={{ background: 'hsl(210 20% 88%)' }} />
        </div>
      </div>
    );
  }

  // Portal variant (default)
  return (
    <div className="space-y-3 mb-6">
      <button
        type="button"
        onClick={() => handleSocialLogin('apple')}
        disabled={loading !== null}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg text-sm font-semibold transition-all bg-foreground text-background hover:opacity-90 disabled:opacity-50"
      >
        {loading === 'apple' ? (
          <div className="h-5 w-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
        ) : (
          <AppleIcon />
        )}
        Mit Apple anmelden
      </button>

      <button
        type="button"
        onClick={() => handleSocialLogin('google')}
        disabled={loading !== null}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg text-sm font-semibold transition-all bg-background text-foreground border border-border hover:bg-muted disabled:opacity-50"
      >
        {loading === 'google' ? (
          <div className="h-5 w-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Mit Google anmelden
      </button>

      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">{separatorText}</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    </div>
  );
}

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);
