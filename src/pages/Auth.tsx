import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Shield, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben'),
});

const emailSchema = z.string().email('Ungültige E-Mail-Adresse');

export default function Auth() {
  const navigate = useNavigate();
  const { user, isLoading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot password dialog
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    // Only redirect if we have a REAL authenticated user (not dev-bypass)
    if (user && !isLoading && user.id !== 'dev-user') {
      // Redirect to portal after login (not admin, unless platform_admin)
      navigate('/portal');
    }
  }, [user, isLoading, navigate]);

  const validateInput = () => {
    try {
      authSchema.parse({ email: email.trim().toLowerCase(), password });
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.errors[0].message);
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateInput()) return;
    
    // Normalize email for mobile compatibility
    const normalizedEmail = email.trim().toLowerCase();
    
    setSubmitting(true);
    const { error } = await signIn(normalizedEmail, password);
    setSubmitting(false);
    
    if (error) {
      // Better error message for invalid credentials
      if (error.message.includes('Invalid login credentials')) {
        setError('Ungültige Anmeldedaten. Bitte überprüfe E-Mail und Passwort auf Tippfehler oder Leerzeichen.');
      } else {
        setError(error.message);
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!validateInput()) return;
    
    // Normalize email for mobile compatibility
    const normalizedEmail = email.trim().toLowerCase();
    
    setSubmitting(true);
    const { error } = await signUp(normalizedEmail, password);
    setSubmitting(false);
    
    if (error) {
      if (error.message.includes('already registered')) {
        setError('Diese E-Mail ist bereits registriert. Bitte melde dich an.');
      } else {
        setError(error.message);
      }
    } else {
      // With auto-confirm, user is logged in immediately after signup
      setSuccess('Account erstellt! Du wirst weitergeleitet...');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    
    const normalizedEmail = resetEmail.trim().toLowerCase();
    
    try {
      emailSchema.parse(normalizedEmail);
    } catch {
      setResetError('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }
    
    setResetLoading(true);
    
    const redirectUrl = `${window.location.origin}/auth/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: redirectUrl
    });
    
    setResetLoading(false);
    
    if (error) {
      setResetError(error.message);
    } else {
      toast({
        title: 'E-Mail gesendet',
        description: 'Prüfe dein Postfach für den Link zum Zurücksetzen deines Passworts.',
      });
      setForgotPasswordOpen(false);
      setResetEmail('');
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">System of a Town</CardTitle>
          <CardDescription>Admin Portal</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Anmelden</TabsTrigger>
              <TabsTrigger value="signup">Registrieren</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signin-email">E-Mail</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Passwort</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoCapitalize="none"
                      autoCorrect="off"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Anmelden
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-sm text-muted-foreground"
                  onClick={() => {
                    setResetEmail(email);
                    setForgotPasswordOpen(true);
                  }}
                >
                  Passwort vergessen?
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-Mail</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Passwort</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoCapitalize="none"
                      autoCorrect="off"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Account erstellen
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Passwort zurücksetzen</DialogTitle>
            <DialogDescription>
              Gib deine E-Mail-Adresse ein. Du erhältst einen Link zum Zurücksetzen deines Passworts.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            {resetError && (
              <Alert variant="destructive">
                <AlertDescription>{resetError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="reset-email">E-Mail</Label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="deine@email.de"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="email"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setForgotPasswordOpen(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1" disabled={resetLoading}>
                {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Link senden
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
