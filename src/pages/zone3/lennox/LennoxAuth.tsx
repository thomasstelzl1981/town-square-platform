/**
 * LennoxAuth — Alpine Chic Login/Registrierung
 */
import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useZ3Auth } from '@/hooks/useZ3Auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { LENNOX as C } from './lennoxTheme';
import lennoxPatch from '@/assets/logos/lennox_logo_patch.jpeg';

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
  const { z3Login, z3Signup } = useZ3Auth();

  const handleLogin = async () => {
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.errors[0]?.message); return; }
    setLoading(true);
    try {
      await z3Login(parsed.data.email, parsed.data.password);
      toast.success('Erfolgreich eingeloggt!');
      navigate(returnTo);
    } catch (err: any) {
      toast.error('Login fehlgeschlagen: ' + (err.message || 'Unbekannter Fehler'));
    } finally { setLoading(false); }
  };

  const handleSignup = async () => {
    const parsed = signupSchema.safeParse({ email, password, firstName, lastName });
    if (!parsed.success) { toast.error(parsed.error.errors[0]?.message); return; }
    setLoading(true);
    try {
      await z3Signup(parsed.data.email, parsed.data.password, parsed.data.firstName, parsed.data.lastName);
      toast.success('Registrierung erfolgreich!');
      navigate(returnTo);
    } catch (err: any) {
      toast.error('Registrierung fehlgeschlagen: ' + (err.message || 'Unbekannter Fehler'));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12" style={{ background: C.cream }}>
      <Link to="/website/tierservice" className="inline-flex items-center gap-1.5 text-sm mb-8 self-start max-w-md w-full mx-auto hover:gap-2.5 transition-all"
        style={{ color: C.barkMuted }}>
        <ArrowLeft className="h-4 w-4" /> Zurück zur Startseite
      </Link>

      <Card className="w-full max-w-md shadow-xl border" style={{ borderColor: C.sandLight, background: C.white }}>
        <CardHeader className="text-center space-y-3 pb-2">
          <img src={lennoxPatch} alt="Lennox & Friends" className="h-16 w-16 rounded-xl object-cover mx-auto shadow-md" />
          <CardTitle className="text-xl font-bold" style={{ color: C.bark }}>
            {mode === 'login' ? 'Willkommen zurück' : 'Werde Teil der Familie'}
          </CardTitle>
          <p className="text-sm" style={{ color: C.barkMuted }}>
            {mode === 'login'
              ? 'Melde dich an, um dein Profil und deine Tiere zu verwalten.'
              : 'Erstelle ein kostenloses Konto bei Lennox & Friends.'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: C.bark }}>Vorname</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4" style={{ color: C.barkMuted }} />
                  <Input placeholder="Max" value={firstName} onChange={e => setFirstName(e.target.value)}
                    className="pl-9" style={{ borderColor: C.sand, background: C.cream, color: C.bark }} maxLength={100} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: C.bark }}>Nachname</label>
                <Input placeholder="Mustermann" value={lastName} onChange={e => setLastName(e.target.value)}
                  style={{ borderColor: C.sand, background: C.cream, color: C.bark }} maxLength={100} />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: C.bark }}>E-Mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4" style={{ color: C.barkMuted }} />
              <Input type="email" placeholder="max@beispiel.de" value={email} onChange={e => setEmail(e.target.value)}
                className="pl-9" style={{ borderColor: C.sand, background: C.cream, color: C.bark }} maxLength={255} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: C.bark }}>Passwort</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4" style={{ color: C.barkMuted }} />
              <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                className="pl-9" style={{ borderColor: C.sand, background: C.cream, color: C.bark }} maxLength={128}
                onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())} />
            </div>
          </div>

          <Button onClick={mode === 'login' ? handleLogin : handleSignup} disabled={loading}
            className="w-full rounded-full text-white font-semibold" style={{ background: C.forest }}>
            {loading ? 'Bitte warten...' : mode === 'login' ? 'Einloggen' : 'Konto erstellen'}
          </Button>

          <div className="text-center pt-1">
            <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-sm font-medium hover:underline" style={{ color: C.coral }}>
              {mode === 'login' ? 'Noch kein Konto? Registrieren' : 'Schon ein Konto? Einloggen'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
