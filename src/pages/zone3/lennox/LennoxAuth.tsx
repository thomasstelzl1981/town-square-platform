/**
 * LennoxAuth — Zone 3 Login/Registrierung für Lennox & Friends
 */
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PawPrint, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Link } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().trim().email('Ungültige E-Mail-Adresse').max(255),
  password: z.string().min(6, 'Mindestens 6 Zeichen').max(128),
});

const signupSchema = loginSchema.extend({
  firstName: z.string().trim().min(1, 'Vorname erforderlich').max(100),
  lastName: z.string().trim().min(1, 'Nachname erforderlich').max(100),
});

export default function LennoxAuth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/website/tierservice/mein-bereich';

  const handleLogin = async () => {
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    setLoading(false);
    if (error) {
      toast.error('Login fehlgeschlagen: ' + error.message);
    } else {
      toast.success('Erfolgreich eingeloggt!');
      navigate(returnTo);
    }
  };

  const handleSignup = async () => {
    const parsed = signupSchema.safeParse({ email, password, firstName, lastName });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin + '/website/tierservice/mein-bereich',
        data: {
          first_name: parsed.data.firstName,
          last_name: parsed.data.lastName,
          source: 'lennox_website',
        },
      },
    });
    if (error) {
      setLoading(false);
      toast.error('Registrierung fehlgeschlagen: ' + error.message);
      return;
    }

    // Create Z1 customer profile after signup
    if (data.user) {
      await supabase.functions.invoke('sot-pet-profile-init', {
        body: {
          userId: data.user.id,
          email: parsed.data.email,
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
        },
      });
    }

    setLoading(false);
    toast.success('Registrierung erfolgreich! Bitte bestätige deine E-Mail-Adresse.');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <Link to="/website/tierservice" className="inline-flex items-center gap-1 text-sm text-[hsl(25,15%,55%)] hover:text-[hsl(25,85%,55%)] mb-6 self-start max-w-md w-full mx-auto">
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Link>

      <Card className="w-full max-w-md border-[hsl(35,30%,90%)]">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <PawPrint className="h-10 w-10 text-[hsl(25,85%,55%)]" />
          </div>
          <CardTitle className="text-xl text-[hsl(25,30%,15%)]">
            {mode === 'login' ? 'Einloggen' : 'Registrieren'}
          </CardTitle>
          <p className="text-sm text-[hsl(25,15%,55%)]">
            {mode === 'login'
              ? 'Melde dich an, um dein Profil und deine Tiere zu verwalten.'
              : 'Erstelle ein kostenloses Konto bei Lennox & Friends.'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[hsl(25,20%,35%)]">Vorname</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-[hsl(25,15%,60%)]" />
                  <Input
                    placeholder="Max"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="pl-9 border-[hsl(35,30%,85%)] bg-[hsl(35,40%,97%)]"
                    maxLength={100}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[hsl(25,20%,35%)]">Nachname</label>
                <Input
                  placeholder="Mustermann"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="border-[hsl(35,30%,85%)] bg-[hsl(35,40%,97%)]"
                  maxLength={100}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-[hsl(25,20%,35%)]">E-Mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[hsl(25,15%,60%)]" />
              <Input
                type="email"
                placeholder="max@beispiel.de"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-9 border-[hsl(35,30%,85%)] bg-[hsl(35,40%,97%)]"
                maxLength={255}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[hsl(25,20%,35%)]">Passwort</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[hsl(25,15%,60%)]" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-9 border-[hsl(35,30%,85%)] bg-[hsl(35,40%,97%)]"
                maxLength={128}
                onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
              />
            </div>
          </div>

          <Button
            onClick={mode === 'login' ? handleLogin : handleSignup}
            disabled={loading}
            className="w-full rounded-full bg-[hsl(25,85%,55%)] hover:bg-[hsl(25,85%,48%)] text-white"
          >
            {loading ? 'Bitte warten...' : mode === 'login' ? 'Einloggen' : 'Konto erstellen'}
          </Button>

          <div className="text-center">
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-sm text-[hsl(25,85%,55%)] hover:underline"
            >
              {mode === 'login' ? 'Noch kein Konto? Registrieren' : 'Schon ein Konto? Einloggen'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
