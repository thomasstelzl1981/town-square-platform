/**
 * FutureRoomLogin — Customer Login/Register in FutureRoom Design
 * 
 * Simple email + password auth for the FutureRoom Akte area.
 */
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Landmark, Mail, Lock, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';

export default function FutureRoomLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromBonitat = searchParams.get('from') === 'bonitat';
  
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('Passwörter stimmen nicht überein.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Passwort muss mindestens 6 Zeichen lang sein.');
          setLoading(false);
          return;
        }
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + '/website/futureroom/akte',
          },
        });
        if (signUpError) throw signUpError;
        setEmailSent(true);
        toast.success('Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        toast.success('Erfolgreich eingeloggt!');
        navigate('/website/futureroom/akte');
      }
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="py-16" style={{ background: 'hsl(210 25% 97%)' }}>
        <div className="container mx-auto px-4 max-w-md text-center">
          <div className="fr-form-card">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'hsl(165 70% 36% / 0.1)' }}>
              <Mail className="h-8 w-8" style={{ color: 'hsl(165 70% 36%)' }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'hsl(210 30% 15%)' }}>E-Mail bestätigen</h2>
            <p className="text-gray-500 text-sm mb-6">
              Wir haben Ihnen eine Bestätigungs-E-Mail an <strong>{email}</strong> gesendet. 
              Bitte klicken Sie auf den Link in der E-Mail, um Ihr Konto zu aktivieren.
            </p>
            <button onClick={() => setEmailSent(false)} className="fr-btn fr-btn-primary w-full">
              <LogIn className="h-4 w-4" />
              Zum Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16" style={{ background: 'hsl(210 25% 97%)' }}>
      <div className="container mx-auto px-4 max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, hsl(165 70% 36%) 0%, hsl(158 64% 52%) 100%)' }}>
            <Landmark className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(210 30% 15%)' }}>
            {mode === 'register' ? 'Konto erstellen' : 'Anmelden'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {fromBonitat
              ? 'Erstellen Sie Ihr Konto, um Ihre Finanzierungsakte zu pflegen.'
              : 'Melden Sie sich an, um Ihre Finanzierungsakte zu verwalten.'
            }
          </p>
        </div>

        {/* Form */}
        <div className="fr-form-card">
          <SocialLoginButtons variant="futureroom" separatorText="oder per E-Mail" />
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: 'hsl(0 65% 51% / 0.08)', color: 'hsl(0 65% 51%)' }}>
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="fr-label">E-Mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="fr-input pl-10"
                  placeholder="ihre@email.de"
                  required
                />
              </div>
            </div>

            <div>
              <label className="fr-label">Passwort</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="fr-input pl-10"
                  placeholder="Mindestens 6 Zeichen"
                  required
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="fr-label">Passwort bestätigen</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="fr-input pl-10"
                    placeholder="Passwort wiederholen"
                    required
                  />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="fr-btn fr-btn-primary w-full">
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Bitte warten...
                </span>
              ) : mode === 'register' ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  Konto erstellen
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Anmelden
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 text-center text-sm" style={{ borderTop: '1px solid hsl(210 20% 88%)' }}>
            {mode === 'register' ? (
              <span className="text-gray-500">
                Bereits registriert?{' '}
                <button onClick={() => { setMode('login'); setError(null); }} className="font-medium" style={{ color: 'hsl(165 70% 36%)' }}>
                  Jetzt anmelden
                </button>
              </span>
            ) : (
              <span className="text-gray-500">
                Noch kein Konto?{' '}
                <button onClick={() => { setMode('register'); setError(null); }} className="font-medium" style={{ color: 'hsl(165 70% 36%)' }}>
                  Jetzt registrieren
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
