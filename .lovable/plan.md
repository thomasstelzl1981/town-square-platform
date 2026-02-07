
# Mobile-Login Fix: Robuste Authentifizierung

## Ziel
Mobile-Login am iPhone zuverlässig machen durch Input-Normalisierung, Passwort-Sichtbarkeit und Passwort-Recovery-Flow.

---

## Änderungen

### 1. Auth.tsx - Mobile-sichere Eingabefelder

**Neue Features:**
- E-Mail-Normalisierung: `email.trim().toLowerCase()` vor Login/Signup
- Mobile Input-Attribute: `autoCapitalize="none"`, `autoCorrect="off"`, `spellCheck={false}`, `inputMode="email"`
- Passwort-Sichtbarkeits-Toggle (Eye/EyeOff)
- "Passwort vergessen?"-Link mit Dialog zur E-Mail-Eingabe
- Bessere Fehlermeldung bei "Invalid login credentials"

**Neue Imports:**
- `Eye`, `EyeOff` aus lucide-react
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription` aus ui/dialog
- `supabase` Client für Password-Reset

**Neue State-Variablen:**
- `showPassword: boolean` - Toggle für Passwort-Sichtbarkeit
- `forgotPasswordOpen: boolean` - Dialog-State
- `resetEmail: string` - E-Mail für Reset
- `resetLoading: boolean` - Loading-State

**Neue Funktion:**
```
handleForgotPassword():
1. Validiere E-Mail mit Zod
2. Rufe supabase.auth.resetPasswordForEmail() auf
3. Zeige Erfolgs-Toast
4. Schließe Dialog
```

### 2. AuthResetPassword.tsx - Neue Seite

**Pfad:** `src/pages/AuthResetPassword.tsx`

**Funktion:**
- User landet hier nach Klick auf Reset-Link in E-Mail
- Supabase setzt automatisch eine temporäre Session
- Formular: Neues Passwort + Bestätigung
- Validierung: mind. 8 Zeichen, Passwörter müssen übereinstimmen
- `supabase.auth.updateUser({ password })` zum Speichern
- Redirect zu `/portal` nach Erfolg

**UI:**
- Gleiches Design wie Auth.tsx (Card, Shield-Icon)
- Zwei Passwort-Felder mit Sichtbarkeits-Toggle
- Klarer Erfolgs-/Fehler-Feedback

### 3. App.tsx - Neue Route

**Änderung:**
```
+ import AuthResetPassword from "./pages/AuthResetPassword";

In Routes:
+ <Route path="/auth/reset-password" element={<AuthResetPassword />} />
```

---

## Technische Details

### E-Mail-Normalisierung (Auth.tsx)

Zeile 54 ändern:
```typescript
// Vorher:
const { error } = await signIn(email, password);

// Nachher:
const normalizedEmail = email.trim().toLowerCase();
const { error } = await signIn(normalizedEmail, password);
```

Analog für signUp.

### Mobile Input-Attribute (Auth.tsx)

```typescript
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
```

### Passwort-Toggle (Auth.tsx)

```typescript
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
    className="absolute right-0 top-0 h-full px-3"
    onClick={() => setShowPassword(!showPassword)}
  >
    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
  </Button>
</div>
```

### Password-Reset Flow

**Auth.tsx - Dialog:**
```typescript
<Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Passwort zurücksetzen</DialogTitle>
      <DialogDescription>
        Gib deine E-Mail-Adresse ein. Du erhältst einen Link zum Zurücksetzen.
      </DialogDescription>
    </DialogHeader>
    <form onSubmit={handleForgotPassword}>
      <Input
        type="email"
        value={resetEmail}
        onChange={(e) => setResetEmail(e.target.value)}
        placeholder="deine@email.de"
        autoCapitalize="none"
        autoCorrect="off"
      />
      <Button type="submit" disabled={resetLoading}>
        {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Link senden
      </Button>
    </form>
  </DialogContent>
</Dialog>
```

**Redirect-URL für Reset:**
```typescript
const redirectUrl = `${window.location.origin}/auth/reset-password`;
await supabase.auth.resetPasswordForEmail(resetEmail.trim().toLowerCase(), {
  redirectTo: redirectUrl
});
```

---

## Dateien-Übersicht

| Datei | Aktion |
|-------|--------|
| `src/pages/Auth.tsx` | Bearbeiten: Mobile-Attribute, Passwort-Toggle, Forgot-Password-Dialog, E-Mail-Normalisierung |
| `src/pages/AuthResetPassword.tsx` | Neu erstellen: Reset-Seite |
| `src/App.tsx` | Bearbeiten: Route für `/auth/reset-password` hinzufügen |

---

## Erwartetes Ergebnis

Nach der Implementierung:
1. Auto-Korrektur/Auto-Caps am iPhone haben keinen Einfluss mehr auf Login
2. Passwort beim Tippen sichtbar machbar (reduziert Tippfehler)
3. Bei Login-Problemen: Selbsthilfe per Passwort-Reset-Mail
4. Bessere Fehlermeldungen bei falschen Credentials
