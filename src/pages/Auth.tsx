import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, Shield, ArrowLeft, Mail } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Ungültige E-Mail-Adresse');

type Step = 'email' | 'pin';

export default function Auth() {
  const navigate = useNavigate();
  const { user, isLoading, signInWithOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (user && !isLoading && user.id !== 'dev-user') {
      navigate('/portal');
    }
  }, [user, isLoading, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    try {
      emailSchema.parse(normalizedEmail);
    } catch {
      setError('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }

    setSubmitting(true);
    const { error } = await signInWithOtp(normalizedEmail);
    setSubmitting(false);

    if (error) {
      setError(error.message);
    } else {
      setStep('pin');
      setCooldown(60);
    }
  };

  const handleVerifyPin = async (value: string) => {
    if (value.length !== 6) return;
    setPin(value);
    setError(null);
    setSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await verifyOtp(normalizedEmail, value);
    setSubmitting(false);

    if (error) {
      setError('Ungültiger Code. Bitte versuche es erneut.');
      setPin('');
    }
    // On success, onAuthStateChange handles redirect
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await signInWithOtp(normalizedEmail);
    if (error) {
      setError(error.message);
    } else {
      setCooldown(60);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Portalzugang</CardTitle>
          <CardDescription>
            {step === 'email'
              ? 'Gib deine E-Mail-Adresse ein, um einen Zugangscode zu erhalten.'
              : 'Gib den 6-stelligen Code ein, den wir an deine E-Mail gesendet haben.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="otp-email">E-Mail</Label>
                <Input
                  id="otp-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="max@example.de"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="email"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Zugangscode senden
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Code gesendet an <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>

              {/* PIN Input — Bank-Feeling */}
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={pin}
                  onChange={handleVerifyPin}
                  disabled={submitting}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <span className="text-muted-foreground text-2xl mx-1">–</span>
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {submitting && (
                <div className="flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              <div className="flex flex-col items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className="text-muted-foreground"
                >
                  {cooldown > 0 ? `Neuer Code in ${cooldown}s` : 'Code erneut senden'}
                </Button>

                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setStep('email');
                    setPin('');
                    setError(null);
                  }}
                  className="text-muted-foreground"
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Andere E-Mail verwenden
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
