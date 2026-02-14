/**
 * SoT Demo Login — Email + Armstrong Chat Bubble + 6-digit PIN (Bank-Feeling)
 * State machine: idle → sending → code-input → verifying → success → transitioning
 */
import { useState, useCallback } from 'react';
import { Sparkles, ArrowRight, Mail } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type Phase = 'email' | 'sending' | 'code' | 'verifying' | 'success';

interface SotDemoLoginProps {
  onLoginSuccess: () => void;
}

export function SotDemoLogin({ onLoginSuccess }: SotDemoLoginProps) {
  const [phase, setPhase] = useState<Phase>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleEmailSubmit = useCallback(async () => {
    if (!email || !email.includes('@')) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      return;
    }
    setError('');
    setPhase('sending');
    
    const { error: otpError } = await supabase.auth.signInWithOtp({ email });
    
    if (otpError) {
      setError('Fehler beim Senden. Bitte versuchen Sie es erneut.');
      setPhase('email');
      return;
    }
    
    // Short delay for Armstrong bubble animation
    setTimeout(() => setPhase('code'), 600);
  }, [email]);

  const handleCodeComplete = useCallback(async (value: string) => {
    setCode(value);
    if (value.length !== 6) return;
    
    setPhase('verifying');
    setError('');

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: value,
      type: 'email',
    });

    if (verifyError) {
      setError('Ungültiger Code. Bitte versuchen Sie es erneut.');
      setCode('');
      setPhase('code');
      return;
    }

    setPhase('success');
    // Trigger transition after success glow
    setTimeout(() => onLoginSuccess(), 800);
  }, [email, onLoginSuccess]);

  return (
    <section className="max-w-xl mx-auto">
      <div 
        className={cn(
          'sot-glass-card rounded-3xl p-8 lg:p-10 transition-all duration-500',
          phase === 'success' && 'shadow-[0_0_40px_-5px_hsl(142_71%_45%/0.4)] border-[hsl(142_71%_45%/0.5)]'
        )}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'hsl(var(--z3-accent)/0.1)' }}
          >
            <Sparkles className="w-7 h-7" style={{ color: 'hsl(var(--z3-accent))' }} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'hsl(var(--z3-foreground))' }}>
            Testen Sie unser System.
          </h3>
          <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
            Erleben Sie die Plattform — kostenlos und unverbindlich.
          </p>
        </div>

        {/* Phase: Email Input */}
        {(phase === 'email' || phase === 'sending') && (
          <div className="space-y-4 animate-fade-in">
            <div className="relative">
              <Mail 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" 
                style={{ color: 'hsl(var(--z3-muted-foreground))' }} 
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                placeholder="ihre@email.de"
                disabled={phase === 'sending'}
                className="w-full h-12 pl-11 pr-14 rounded-xl text-sm outline-none transition-all"
                style={{
                  backgroundColor: 'hsl(var(--z3-background)/0.5)',
                  border: '1px solid hsl(var(--z3-border)/0.5)',
                  color: 'hsl(var(--z3-foreground))',
                }}
              />
              <button
                onClick={handleEmailSubmit}
                disabled={phase === 'sending'}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
                style={{ backgroundColor: 'hsl(var(--z3-accent))', color: 'hsl(var(--z3-background))' }}
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {phase === 'sending' && (
              <p className="text-xs text-center animate-pulse" style={{ color: 'hsl(var(--z3-accent))' }}>
                Wird gesendet...
              </p>
            )}
          </div>
        )}

        {/* Phase: Armstrong Chat Bubble + PIN */}
        {(phase === 'code' || phase === 'verifying') && (
          <div className="space-y-6 animate-fade-in">
            {/* Armstrong Chat Bubble — WhatsApp style */}
            <div className="flex gap-3">
              <div 
                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: 'hsl(var(--z3-accent)/0.15)' }}
              >
                <Sparkles className="w-4 h-4" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <div 
                className="rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%]"
                style={{ 
                  backgroundColor: 'hsl(var(--z3-accent)/0.08)',
                  border: '1px solid hsl(var(--z3-accent)/0.15)',
                }}
              >
                <p className="text-sm font-medium mb-0.5" style={{ color: 'hsl(var(--z3-accent))' }}>
                  Armstrong
                </p>
                <p className="text-sm" style={{ color: 'hsl(var(--z3-foreground))' }}>
                  Wir haben Ihnen eine E-Mail geschickt. Geben Sie Ihren Code ein.
                </p>
              </div>
            </div>

            {/* 6-digit PIN — Bank feeling */}
            <div className="flex flex-col items-center gap-4">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={handleCodeComplete}
                disabled={phase === 'verifying'}
              >
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className={cn(
                        'w-12 h-14 rounded-xl text-lg font-bold',
                        'border-[hsl(var(--z3-border)/0.4)] bg-[hsl(var(--z3-background)/0.5)]',
                        'text-[hsl(var(--z3-foreground))]',
                        'first:rounded-l-xl last:rounded-r-xl',
                        phase === 'verifying' && 'animate-pulse'
                      )}
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              <p className="text-xs" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                {phase === 'verifying' ? 'Wird überprüft...' : '6-stelliger Sicherheitscode'}
              </p>
            </div>
          </div>
        )}

        {/* Phase: Success */}
        {phase === 'success' && (
          <div className="text-center animate-scale-in py-4">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-[hsl(142_71%_45%/0.15)]">
              <svg className="w-8 h-8 text-[hsl(142_71%_45%)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: 'hsl(var(--z3-foreground))' }}>
              Willkommen. Ihr System wird vorbereitet...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-center mt-3 text-red-400">{error}</p>
        )}
      </div>
    </section>
  );
}
